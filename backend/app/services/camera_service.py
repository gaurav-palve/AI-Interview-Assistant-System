import cv2
import mediapipe as mp
from ultralytics import YOLO
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import uvicorn
import time
import threading
import numpy as np
from queue import Queue
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

# Load YOLOv8 small model
yolo_model = YOLO("yolov8n.pt")

# Initialize MediaPipe modules
mp_hands = mp.solutions.hands
mp_face_mesh = mp.solutions.face_mesh
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=2,
    refine_landmarks=True,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

# Counters
hand_cheating_counter = 0
face_cheating_counter = 0
iris_cheating_counter = 0
phone_cheating_counter = 0


def detect_iris_gaze(face_landmarks, img_w, img_h, frame):
    LEFT_EYE = [33, 133]
    RIGHT_EYE = [362, 263]
    LEFT_IRIS = [468, 469, 470, 471]
    RIGHT_IRIS = [473, 474, 475, 476]

    def get_point(idx):
        lm = face_landmarks.landmark[idx]
        return int(lm.x * img_w), int(lm.y * img_h)

    left_eye_left = get_point(LEFT_EYE[0])
    left_eye_right = get_point(LEFT_EYE[1])
    right_eye_left = get_point(RIGHT_EYE[0])
    right_eye_right = get_point(RIGHT_EYE[1])

    left_iris = [get_point(i) for i in LEFT_IRIS]
    right_iris = [get_point(i) for i in RIGHT_IRIS]
    left_iris_center = (sum([p[0] for p in left_iris]) // 4,
                        sum([p[1] for p in left_iris]) // 4)
    right_iris_center = (sum([p[0] for p in right_iris]) // 4,
                         sum([p[1] for p in right_iris]) // 4)

    left_eye_width = abs(left_eye_right[0] - left_eye_left[0])
    right_eye_width = abs(right_eye_right[0] - right_eye_left[0])

    if left_eye_width == 0 or right_eye_width == 0:
        return False

    left_ratio = (left_iris_center[0] - left_eye_left[0]) / left_eye_width
    right_ratio = (right_iris_center[0] - right_eye_left[0]) / right_eye_width
    left_vertical = (left_iris_center[1] - left_eye_left[1]) / left_eye_width
    right_vertical = (right_iris_center[1] - right_eye_right[1]) / right_eye_width

    # Allow a wider horizontal range (more freedom to move eyes left/right)
    if left_ratio < 0.30 or left_ratio > 0.70:
        return True
    if right_ratio < 0.30 or right_ratio > 0.70:
        return True

    # Allow a little more vertical freedom (up/down eye/head movement)
    if left_vertical > 0.30 or right_vertical > 0.30:
        return True


    return False


def is_hand_on_face(hand_landmarks, face_landmarks, img_w, img_h):
    face_x = [lm.x for lm in face_landmarks.landmark]
    face_y = [lm.y for lm in face_landmarks.landmark]
    fx_min, fx_max = int(min(face_x) * img_w), int(max(face_x) * img_w)
    fy_min, fy_max = int(min(face_y) * img_h), int(max(face_y) * img_h)

    hand_x = [lm.x for lm in hand_landmarks.landmark]
    hand_y = [lm.y for lm in hand_landmarks.landmark]
    hx_min, hx_max = int(min(hand_x) * img_w), int(max(hand_x) * img_w)
    hy_min, hy_max = int(min(hand_y) * img_h), int(max(hand_y) * img_h)

    overlap_x = max(0, min(fx_max, hx_max) - max(fx_min, hx_min))
    overlap_y = max(0, min(fy_max, hy_max) - max(fy_min, hy_min))
    overlap_area = overlap_x * overlap_y

    hand_area = (hx_max - hx_min) * (hy_max - hy_min)

    if hand_area > 0 and overlap_area > 0.1 * hand_area:
        return True
    return False


# Cooldown timers
last_hand_warning = 0
last_face_warning = 0
last_iris_warning = 0
last_phone_warning = 0
COOLDOWN = 5  # seconds

# Thread-safe frame queue
frame_queue = Queue(maxsize=10)
# Camera status
camera_active = False
# Camera thread
camera_thread = None
# Default camera resolution
DEFAULT_WIDTH = 640
DEFAULT_HEIGHT = 480

def camera_processing_thread(width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT):
    """
    Background thread for camera processing.
    This runs the heavy computer vision operations in a separate thread
    to keep the main application responsive.
    """
    global hand_cheating_counter, face_cheating_counter, iris_cheating_counter, phone_cheating_counter
    global last_hand_warning, last_face_warning, last_iris_warning, last_phone_warning
    global camera_active

    logger.info(f"Starting camera thread with resolution {width}x{height}")
    
    try:
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        # Set camera resolution
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        
        while camera_active:
            success, frame = cap.read()
            if not success:
                logger.error("Failed to capture frame from camera")
                break
                
            # Process frame for cheating detection
            process_frame_for_cheating(frame)
            # Resize frame to match display size (113x75) and improve performance
            resized_frame = cv2.resize(frame, (210, 150))
            
            
            # Encode and put in queue for streaming with higher quality
            _, buffer = cv2.imencode('.jpg', resized_frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            frame_bytes = buffer.tobytes()
            
            # Add to queue, if full, remove oldest frame
            if frame_queue.full():
                try:
                    frame_queue.get_nowait()
                except:
                    pass
            
            frame_queue.put(frame_bytes)
            
            # Small delay to prevent CPU overuse
            time.sleep(0.01)
    
    except Exception as e:
        logger.error(f"Error in camera thread: {str(e)}")
    finally:
        if cap and cap.isOpened():
            cap.release()
        logger.info("Camera thread stopped")

def process_frame_for_cheating(frame):
    """Process a frame to detect cheating behaviors"""
    global hand_cheating_counter, face_cheating_counter, iris_cheating_counter, phone_cheating_counter
    global last_hand_warning, last_face_warning, last_iris_warning, last_phone_warning
    
    now = time.time()
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    h, w, _ = frame.shape
    
    face_results = face_mesh.process(frame_rgb)
    hand_results = hands.process(frame_rgb)
    
    # Hand-on-face detection
    if hand_results.multi_hand_landmarks and face_results.multi_face_landmarks:
        for hand_landmarks in hand_results.multi_hand_landmarks:
            face_landmarks = face_results.multi_face_landmarks[0]
            if is_hand_on_face(hand_landmarks, face_landmarks, w, h):
                if now - last_hand_warning > COOLDOWN:
                    hand_cheating_counter += 1
                    last_hand_warning = now
                    logger.warning("Hand on Face detected!")
    
    # Face checks
    if not face_results.multi_face_landmarks:
        if now - last_face_warning > COOLDOWN:
            face_cheating_counter += 1
            last_face_warning = now
            logger.warning("No face detected!")
    elif len(face_results.multi_face_landmarks) > 1:
        if now - last_face_warning > COOLDOWN:
            face_cheating_counter += 1
            last_face_warning = now
            logger.warning("Multiple faces detected!")
    else:
        face_landmarks = face_results.multi_face_landmarks[0]
        if detect_iris_gaze(face_landmarks, w, h, frame):
            if now - last_iris_warning > COOLDOWN:
                iris_cheating_counter += 1
                last_iris_warning = now
                logger.warning("Looking away detected!")
    
    # YOLO phone detection
    yolo_results = yolo_model.predict(frame_rgb, conf=0.5, verbose=False)
    for r in yolo_results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = yolo_model.names[cls_id]
            
            if label.lower() in ["cell phone", "mobile phone", "phone"]:
                if now - last_phone_warning > COOLDOWN:
                    phone_cheating_counter += 1
                    last_phone_warning = now
                    logger.warning("Mobile Phone detected!")

def start_camera(width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT):
    """Start the camera processing thread"""
    global camera_thread, camera_active
    
    if camera_active:
        logger.warning("Camera is already active")
        return False
    
    camera_active = True
    camera_thread = threading.Thread(
        target=camera_processing_thread,
        args=(width, height),
        daemon=True
    )
    camera_thread.start()
    logger.info(f"Camera started with resolution {width}x{height}")
    return True

def stop_camera():
    """Stop the camera processing thread"""
    global camera_active
    
    if not camera_active:
        logger.warning("Camera is not active")
        return False
    
    camera_active = False
    # Clear the queue
    while not frame_queue.empty():
        try:
            frame_queue.get_nowait()
        except:
            pass
    
    logger.info("Camera stopped")
    return True

def gen_frames():
    """Generate frames for streaming response"""
    # Start camera if not already started
    if not camera_active:
        start_camera()
        # Allow camera to initialize
        time.sleep(1.0)
    
    # Use a larger queue size for smoother streaming
    frame_buffer = []
    buffer_size = 3  # Keep a small buffer of frames
    
    try:
        while True:
            if not camera_active:
                # If camera is not active, start it
                start_camera()
                # Allow camera to initialize
                time.sleep(1.0)
                continue
            
            try:
                # Get frame from queue with timeout
                frame_bytes = frame_queue.get(timeout=0.5)
                
                # Add to buffer
                frame_buffer.append(frame_bytes)
                if len(frame_buffer) > buffer_size:
                    frame_buffer.pop(0)
                
                # Yield the frame for streaming
                yield (b'--frame\r\n'
                      b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            except Exception as e:
                # If we have frames in the buffer, use the last one instead of a placeholder
                if frame_buffer:
                    last_frame = frame_buffer[-1]
                    yield (b'--frame\r\n'
                          b'Content-Type: image/jpeg\r\n\r\n' + last_frame + b'\r\n')
                else:
                    # Only use placeholder if buffer is empty
                    logger.debug(f"Frame fetch error: {str(e)}")
                    placeholder = np.ones((240, 320, 3), dtype=np.uint8) * 128
                    _, buffer = cv2.imencode('.jpg', placeholder)
                    placeholder_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                          b'Content-Type: image/jpeg\r\n\r\n' + placeholder_bytes + b'\r\n')
    except GeneratorExit:
        # Handle generator exit gracefully
        logger.info("Camera stream generator closed")
    except Exception as e:
        logger.error(f"Error in camera stream: {str(e)}")
        # Make sure to stop the camera if there's an error
        stop_camera()
