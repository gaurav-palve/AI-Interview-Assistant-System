import cv2
import time
import threading
import numpy as np
import logging
import os
import urllib.request
from queue import Queue

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from ultralytics import YOLO

logger = logging.getLogger(__name__)

# =====================================================
# YOLO MODEL
# =====================================================
yolo_model = YOLO("yolov8n.pt")

# =====================================================
# MEDIAPIPE FACE LANDMARKER (TASKS API)
# =====================================================
FACE_LANDMARK_MODEL = "face_landmarker.task"
FACE_LANDMARK_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_landmarker/face_landmarker/float16/1/"
    "face_landmarker.task"
)

def _download_face_model():
    if not os.path.exists(FACE_LANDMARK_MODEL):
        urllib.request.urlretrieve(FACE_LANDMARK_URL, FACE_LANDMARK_MODEL)

_download_face_model()

base_options = python.BaseOptions(model_asset_path=FACE_LANDMARK_MODEL)
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
    num_faces=3,
    running_mode=vision.RunningMode.IMAGE
)

face_landmarker = vision.FaceLandmarker.create_from_options(options)
face_landmarker_lock = threading.Lock()

# =====================================================
# COUNTERS (UNCHANGED)
# =====================================================
face_missing_counter = 0
multiple_faces_counter = 0
iris_cheating_counter = 0
phone_cheating_counter = 0

# =====================================================
# COOLDOWNS & FRAME LOGIC (UNCHANGED)
# =====================================================
last_face_warning = 0
last_iris_warning = 0
last_phone_warning = 0

COOLDOWN = 15
PHONE_COOLDOWN = 8

consecutive_iris_deviations = 0
consecutive_face_missing = 0
consecutive_multiple_faces = 0
consecutive_phone_detections = 0

REQUIRED_CONSECUTIVE_FRAMES = 8
REQUIRED_FACE_MISSING_FRAMES = 2
REQUIRED_MULTIPLE_FACES_FRAMES = 2
REQUIRED_PHONE_FRAMES = 2

# =====================================================
# CAMERA STATE (UNCHANGED)
# =====================================================
frame_queue = Queue(maxsize=10)
camera_active = False
camera_thread = None
camera_lock = threading.Lock()
detection_enabled = False

DEFAULT_WIDTH = 640
DEFAULT_HEIGHT = 480

# =====================================================
# IRIS GAZE DETECTION (UNCHANGED LOGIC)
# =====================================================
def detect_iris_gaze(face_landmarks, img_w, img_h):
    LEFT_EYE = [33, 133]
    RIGHT_EYE = [362, 263]
    LEFT_IRIS = [468, 469, 470, 471]
    RIGHT_IRIS = [473, 474, 475, 476]

    def get_point(idx):
        lm = face_landmarks[idx]
        return int(lm.x * img_w), int(lm.y * img_h)

    left_eye_left = get_point(LEFT_EYE[0])
    left_eye_right = get_point(LEFT_EYE[1])
    right_eye_left = get_point(RIGHT_EYE[0])
    right_eye_right = get_point(RIGHT_EYE[1])

    left_iris = [get_point(i) for i in LEFT_IRIS]
    right_iris = [get_point(i) for i in RIGHT_IRIS]

    left_center = (sum(p[0] for p in left_iris) // 4,
                   sum(p[1] for p in left_iris) // 4)
    right_center = (sum(p[0] for p in right_iris) // 4,
                    sum(p[1] for p in right_iris) // 4)

    left_width = abs(left_eye_right[0] - left_eye_left[0])
    right_width = abs(right_eye_right[0] - right_eye_left[0])

    if left_width == 0 or right_width == 0:
        return 0

    left_ratio = (left_center[0] - left_eye_left[0]) / left_width
    right_ratio = (right_center[0] - right_eye_left[0]) / right_width

    h_min, h_max = 0.10, 0.90
    h_dev = max(0,
                h_min - left_ratio if left_ratio < h_min else 0,
                left_ratio - h_max if left_ratio > h_max else 0,
                h_min - right_ratio if right_ratio < h_min else 0,
                right_ratio - h_max if right_ratio > h_max else 0)

    if h_dev == 0:
        return 0
    elif h_dev < 0.15:
        return 1
    elif h_dev < 0.25:
        return 2
    else:
        return 3

# =====================================================
# FRAME PROCESSING (UPDATED MEDIAPIPE ONLY)
# =====================================================
def process_frame_for_cheating(frame):
    global face_missing_counter, multiple_faces_counter
    global iris_cheating_counter, phone_cheating_counter
    global consecutive_iris_deviations, consecutive_face_missing
    global consecutive_multiple_faces, consecutive_phone_detections
    global last_face_warning, last_iris_warning, last_phone_warning

    if not detection_enabled:
        return

    now = time.time()
    h, w, _ = frame.shape

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    )

    with face_landmarker_lock:
        result = face_landmarker.detect(mp_image)

    faces = result.face_landmarks

    # ---------------- Face checks ----------------
    if not faces:
        consecutive_face_missing += 1
        if consecutive_face_missing >= REQUIRED_FACE_MISSING_FRAMES and now - last_face_warning > COOLDOWN:
            face_missing_counter += 1
            last_face_warning = now
        return

    if len(faces) > 1:
        consecutive_multiple_faces += 1
        if consecutive_multiple_faces >= REQUIRED_MULTIPLE_FACES_FRAMES and now - last_face_warning > COOLDOWN:
            multiple_faces_counter += 1
            last_face_warning = now
        return

    # ---------------- Iris gaze ----------------
    face_landmarks = faces[0]
    gaze = detect_iris_gaze(face_landmarks, w, h)

    if gaze >= 2:
        consecutive_iris_deviations += 1
    else:
        consecutive_iris_deviations = 0

    if consecutive_iris_deviations >= REQUIRED_CONSECUTIVE_FRAMES and now - last_iris_warning > COOLDOWN:
        iris_cheating_counter += 1
        last_iris_warning = now

    # ---------------- Phone detection ----------------
    phone_detected = False
    yolo_results = yolo_model(frame, verbose=False)

    for r in yolo_results:
        for cls in r.boxes.cls:
            if int(cls) == 67:  # cell phone
                phone_detected = True
                break

    if phone_detected:
        consecutive_phone_detections += 1
        if consecutive_phone_detections >= REQUIRED_PHONE_FRAMES and now - last_phone_warning > PHONE_COOLDOWN:
            phone_cheating_counter += 1
            last_phone_warning = now
    else:
        consecutive_phone_detections = 0

# =====================================================
# CAMERA THREAD (UNCHANGED)
# =====================================================
def camera_processing_thread(width, height):
    global camera_active
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

    while camera_active:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.1)
            continue

        process_frame_for_cheating(frame)

        resized = cv2.resize(frame, (180, 135))
        _, buffer = cv2.imencode(".jpg", resized, [cv2.IMWRITE_JPEG_QUALITY, 90])

        if frame_queue.full():
            frame_queue.get()

        frame_queue.put(buffer.tobytes())
        time.sleep(0.01)

    cap.release()

# =====================================================
# PUBLIC API (UNCHANGED SIGNATURES)
# =====================================================
def start_camera(width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT, enable_detection=False):
    global camera_active, camera_thread, detection_enabled
    detection_enabled = enable_detection

    with camera_lock:
        if camera_active:
            return True

        camera_active = True
        camera_thread = threading.Thread(
            target=camera_processing_thread,
            args=(width, height),
            daemon=True
        )
        camera_thread.start()
        return True

def set_detection_enabled(enable):
    global detection_enabled
    detection_enabled = enable
    return detection_enabled

def stop_camera():
    global camera_active, detection_enabled
    with camera_lock:
        camera_active = False
        detection_enabled = False
        return True

def gen_frames():
    while True:
        frame_bytes = frame_queue.get()
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" +
               frame_bytes + b"\r\n")
 
