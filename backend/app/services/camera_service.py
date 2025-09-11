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
mp_face_mesh = mp.solutions.face_mesh
mp_draw = mp.solutions.drawing_utils
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=3,  # Increased from 2 to 3
    refine_landmarks=True,
    min_detection_confidence=0.5,  # Lowered from 0.7 to 0.5
    min_tracking_confidence=0.5  # Lowered from 0.7 to 0.5
)

# Counters
face_missing_counter = 0  # For no face detected
multiple_faces_counter = 0  # For multiple faces detected
iris_cheating_counter = 0  # For looking away
phone_cheating_counter = 0  # For phone detection


def detect_iris_gaze(face_landmarks, img_w, img_h, frame):
    """
    Detect if the person is looking away from the screen based on iris position.
    Returns:
        0: Not looking away (normal gaze)
        1: Mild deviation (slightly looking away)
        2: Moderate deviation (definitely looking away)
        3: Severe deviation (completely looking away)
    """
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
        return 0  # Cannot determine gaze, assume normal

    left_ratio = (left_iris_center[0] - left_eye_left[0]) / left_eye_width
    right_ratio = (right_iris_center[0] - right_eye_left[0]) / right_eye_width
    left_vertical = (left_iris_center[1] - left_eye_left[1]) / left_eye_width
    right_vertical = (right_iris_center[1] - right_eye_right[1]) / right_eye_width

    # Calculate horizontal deviation (much more relaxed thresholds)
    h_min, h_max = 0.10, 0.90  # Was 0.15, 0.85
    h_deviation = max(0,
                      h_min - left_ratio if left_ratio < h_min else 0,
                      left_ratio - h_max if left_ratio > h_max else 0,
                      h_min - right_ratio if right_ratio < h_min else 0,
                      right_ratio - h_max if right_ratio > h_max else 0)
    
    # Calculate vertical deviation (much more relaxed thresholds)
    v_min, v_max = 0.05, 0.60  # Was 0.10, 0.55
    v_deviation = max(0,
                      v_min - left_vertical if left_vertical < v_min else 0,
                      left_vertical - v_max if left_vertical > v_max else 0,
                      v_min - right_vertical if right_vertical < v_min else 0,
                      right_vertical - v_max if right_vertical > v_max else 0)
    
    # Determine severity based on total deviation (increased thresholds)
    total_deviation = h_deviation + v_deviation
    
    if total_deviation == 0:
        return 0  # Normal gaze
    elif total_deviation < 0.15:  # Was 0.1
        return 1  # Mild deviation
    elif total_deviation < 0.25:  # Was 0.2
        return 2  # Moderate deviation
    else:
        return 3  # Severe deviation



# Removed hand-on-face detection function


# Cooldown timers
last_face_warning = 0
last_iris_warning = 0
last_phone_warning = 0
COOLDOWN = 15  # seconds (increased from 5 to reduce false positives)
PHONE_COOLDOWN = 8  # seconds (specific cooldown for phone detection)

# Consecutive frame counters for temporal consistency
consecutive_iris_deviations = 0
consecutive_face_missing = 0
consecutive_multiple_faces = 0
consecutive_phone_detections = 0

# Required consecutive frames for different detection types
REQUIRED_CONSECUTIVE_FRAMES = 8  # For iris gaze detection
REQUIRED_FACE_MISSING_FRAMES = 2  # For face missing detection
REQUIRED_MULTIPLE_FACES_FRAMES = 2  # For multiple faces detection
REQUIRED_PHONE_FRAMES = 2  # For phone detection

# Thread-safe frame queue
frame_queue = Queue(maxsize=10)
# Camera status
camera_active = False
# Camera thread
camera_thread = None
# Default camera resolution
DEFAULT_WIDTH = 640
DEFAULT_HEIGHT = 480
# Thread lock for camera operations
camera_lock = threading.Lock()
# Flag to enable/disable cheating detection
detection_enabled = False

def camera_processing_thread(width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT):
    """
    Background thread for camera processing.
    This runs the heavy computer vision operations in a separate thread
    to keep the main application responsive.
    """
    global face_cheating_counter, iris_cheating_counter, phone_cheating_counter
    global last_face_warning, last_iris_warning, last_phone_warning
    global camera_active

    logger.info(f"Starting camera thread with resolution {width}x{height}")
    
    # Track consecutive failures for retry logic
    consecutive_failures = 0
    max_consecutive_failures = 5
    
    # Try different camera backends if one fails - use integers directly to avoid issues
    camera_backends = [0]  # Use only default backend (0) which is more reliable
    current_backend_index = 0
    current_backend = camera_backends[current_backend_index]
    
    cap = None
    
    try:
        # Initialize camera with retry logic
        cap = None
        for attempt in range(3):  # Try up to 3 times
            cap = initialize_camera(width, height, current_backend)
            if cap and cap.isOpened():
                logger.info(f"Camera initialized successfully on attempt {attempt+1}")
                break
            logger.warning(f"Failed to initialize camera on attempt {attempt+1}/3")
            time.sleep(1)  # Wait before retry
            
        if not cap or not cap.isOpened():
            raise Exception("Failed to initialize camera after multiple attempts")
        
        # Reset consecutive failures counter
        consecutive_failures = 0
        
        while camera_active:
            try:
                success, frame = cap.read()
                if not success:
                    consecutive_failures += 1
                    logger.warning(f"Failed to capture frame from camera (attempt {consecutive_failures}/{max_consecutive_failures})")
                    
                    if consecutive_failures >= max_consecutive_failures:
                        logger.info("Maximum consecutive failures reached, reinitializing camera")
                        # Try next backend
                        if cap and cap.isOpened():
                            cap.release()
                        
                        current_backend_index = (current_backend_index + 1) % len(camera_backends)
                        current_backend = camera_backends[current_backend_index]
                        
                        cap = initialize_camera(width, height, current_backend)
                        if not cap or not cap.isOpened():
                            logger.error(f"Failed to reinitialize camera with backend {current_backend}")
                            time.sleep(1.0)  # Wait before next attempt
                            continue
                            
                        consecutive_failures = 0
                    
                    # Wait before retry
                    time.sleep(0.5)
                    continue
                
                # Reset failure counter on success
                consecutive_failures = 0
                
                # Process frame for cheating detection
                process_frame_for_cheating(frame)
                # Resize frame to match display size and improve performance
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
                logger.error(f"Error processing frame: {str(e)}")
                time.sleep(0.5)  # Wait before retry
    
    except Exception as e:
        logger.error(f"Error in camera thread: {str(e)}")
    finally:
        if cap and cap.isOpened():
            cap.release()
        logger.info("Camera thread stopped")

def initialize_camera(width, height, backend):
    """Helper function to initialize camera with specified parameters"""
    try:
        # Try to initialize without specifying backend first (most reliable)
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            logger.warning("Failed to open camera with default method, trying with explicit backend")
            try:
                # Release the previous attempt
                cap.release()
                # Try with explicit backend
                cap = cv2.VideoCapture(0, backend)
            except Exception as inner_e:
                logger.error(f"Error with explicit backend: {str(inner_e)}")
                # Fall back to simplest form
                cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            logger.error("Failed to open camera with all methods")
            return None
            
        # Set camera resolution
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        
        # Set additional properties for better stability
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)  # Increase buffer size
        
        # Test if we can read a frame with retry
        success = False
        for attempt in range(3):  # Try up to 3 times
            success, _ = cap.read()
            if success:
                break
            logger.warning(f"Failed to read initial frame, attempt {attempt+1}/3")
            time.sleep(0.5)  # Short delay between attempts
            
        if not success:
            logger.error("Camera opened but failed to read initial frame after multiple attempts")
            cap.release()
            return None
            
        logger.info("Camera initialized successfully")
        return cap
    except Exception as e:
        logger.error(f"Error initializing camera: {str(e)}")
        return None
def process_frame_for_cheating(frame):
    """Process a frame to detect cheating behaviors"""
    global face_missing_counter, multiple_faces_counter, iris_cheating_counter, phone_cheating_counter
    global last_face_warning, last_iris_warning, last_phone_warning
    global detection_enabled
    global consecutive_iris_deviations, consecutive_face_missing
    global consecutive_multiple_faces, consecutive_phone_detections
    
    # If detection is disabled, just return without processing
    if not detection_enabled:
        return
    
    now = time.time()
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    h, w, _ = frame.shape
    
    face_results = face_mesh.process(frame_rgb)
    
    # Run YOLO detection for people
    yolo_results = yolo_model.predict(frame_rgb, conf=0.3, verbose=False)
    
    # Check for multiple people using YOLO
    person_count = 0
    for r in yolo_results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = yolo_model.names[cls_id]
            if label.lower() == "person":
                person_count += 1
                if person_count > 1:  # If we found more than one person, no need to count further
                    break
        if person_count > 1:
            break
    
    # Multiple people detected via YOLO
    multiple_people_detected = person_count > 1
    
    # Face checks
    if not face_results.multi_face_landmarks:
        consecutive_face_missing += 1
        consecutive_iris_deviations = 0  # Reset other counters
        consecutive_multiple_faces = 0
        
        # Only trigger warning after consecutive frames and cooldown
        if consecutive_face_missing >= REQUIRED_FACE_MISSING_FRAMES and now - last_face_warning > COOLDOWN:
            face_missing_counter += 1
            last_face_warning = now
            logger.warning("No face detected!")
    elif len(face_results.multi_face_landmarks) > 1 or multiple_people_detected:
        # Multiple faces detected either by MediaPipe or by YOLO person detection
        consecutive_multiple_faces += 1
        consecutive_face_missing = 0  # Reset other counters
        consecutive_iris_deviations = 0
        
        # Only trigger warning after consecutive frames and cooldown
        if consecutive_multiple_faces >= REQUIRED_MULTIPLE_FACES_FRAMES and now - last_face_warning > COOLDOWN:
            multiple_faces_counter += 1
            last_face_warning = now
            detection_method = "MediaPipe" if len(face_results.multi_face_landmarks) > 1 else "YOLO"
            logger.warning(f"Multiple faces detected! (Method: {detection_method})")
            last_face_warning = now
            logger.warning("Multiple faces detected!")
    else:
        # Reset face counters when a single face is detected
        consecutive_face_missing = 0
        consecutive_multiple_faces = 0
        
        # Check iris gaze
        face_landmarks = face_results.multi_face_landmarks[0]
        gaze_severity = detect_iris_gaze(face_landmarks, w, h, frame)
        
        # Only count severe deviations (level 3) or persistent moderate deviations (level 2)
        if gaze_severity == 3:
            # For severe deviations, count immediately
            consecutive_iris_deviations += 1
        elif gaze_severity == 2:
            # For moderate deviations, increment counter but with less weight
            consecutive_iris_deviations += 0.5  # Count as half a frame to require more consistent deviation
        elif gaze_severity <= 1:
            # Reset counter for normal or mild gaze (levels 0-1)
            consecutive_iris_deviations = 0
        
        # Only trigger warning after consecutive frames and cooldown
        if consecutive_iris_deviations >= REQUIRED_CONSECUTIVE_FRAMES and now - last_iris_warning > COOLDOWN:
            iris_cheating_counter += 1
            last_iris_warning = now
            logger.warning(f"Looking away detected! (Severity: {gaze_severity})")
    
    # Phone detection using the same YOLO results
    phone_detected = False
    
    # Log all detected objects periodically (every 100 frames) for debugging
    if phone_cheating_counter % 100 == 0:
        all_detections = []
        for r in yolo_results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                label = yolo_model.names[cls_id]
                conf = float(box.conf[0])
                if conf > 0.3:
                    all_detections.append(f"{label} ({conf:.2f})")
        
        if all_detections:
            logger.debug(f"All detected objects: {', '.join(all_detections)}")
    
    # Reuse the same YOLO results for phone detection
    for r in yolo_results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = yolo_model.names[cls_id]
            # Expanded list of potential phone-related class labels
            if label.lower() in ["cell phone", "mobile phone", "phone", "smartphone", "cellphone",
                                "cellular telephone", "mobile", "iphone", "android", "device"]:
                phone_detected = True
                logger.debug(f"Detected potential phone: {label} with confidence {float(box.conf[0]):.2f}")
                break
        if phone_detected:
            break
    
    if phone_detected:
        consecutive_phone_detections += 1
        
        # Only trigger warning after consecutive frames and cooldown
        if consecutive_phone_detections >= REQUIRED_PHONE_FRAMES and now - last_phone_warning > PHONE_COOLDOWN:
            phone_cheating_counter += 1
            last_phone_warning = now
            logger.warning("Mobile Phone detected!")
    else:
        consecutive_phone_detections = 0

def start_camera(width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT, enable_detection=False):
    """Start the camera processing thread"""
    global camera_thread, camera_active, detection_enabled
    
    # Set detection flag based on parameter
    detection_enabled = enable_detection
    
    # Use a lock to prevent race conditions during initialization
    with camera_lock:
        if camera_active:
            logger.warning("Camera is already active")
            return True  # Return True to indicate camera is running
        
        # Reset counters when starting a new camera session
        global face_missing_counter, multiple_faces_counter, iris_cheating_counter, phone_cheating_counter
        global consecutive_iris_deviations, consecutive_face_missing
        global consecutive_multiple_faces, consecutive_phone_detections
        
        # Reset violation counters
        face_missing_counter = 0
        multiple_faces_counter = 0
        iris_cheating_counter = 0
        phone_cheating_counter = 0
        
        # Reset consecutive frame counters
        consecutive_iris_deviations = 0
        consecutive_face_missing = 0
        consecutive_multiple_faces = 0
        consecutive_phone_detections = 0
        
        # Clear the frame queue
        while not frame_queue.empty():
            try:
                frame_queue.get_nowait()
            except:
                pass
        
        camera_active = True
        camera_thread = threading.Thread(
            target=camera_processing_thread,
            args=(width, height),
            daemon=True
        )
        camera_thread.start()
        logger.info(f"Camera started with resolution {width}x{height}")
        return True

def set_detection_enabled(enable):
    """Set the detection enabled flag"""
    global detection_enabled
    global consecutive_iris_deviations, consecutive_face_missing
    global consecutive_multiple_faces, consecutive_phone_detections
    
    # Update detection flag
    detection_enabled = enable
    
    # Reset consecutive frame counters when toggling detection
    consecutive_iris_deviations = 0
    consecutive_face_missing = 0
    consecutive_multiple_faces = 0
    consecutive_phone_detections = 0
    
    logger.info(f"Cheating detection {'enabled' if enable else 'disabled'}")
    return detection_enabled

def stop_camera():
    """Stop the camera processing thread"""
    global camera_active, detection_enabled
    global consecutive_iris_deviations, consecutive_face_missing
    global consecutive_multiple_faces, consecutive_phone_detections
    
    # Use a lock to prevent race conditions during shutdown
    with camera_lock:
        if not camera_active:
            logger.warning("Camera is not active")
            return False
        
        camera_active = False
        detection_enabled = False
        
        # Reset consecutive frame counters
        consecutive_iris_deviations = 0
        consecutive_face_missing = 0
        consecutive_multiple_faces = 0
        consecutive_phone_detections = 0
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
    # Start camera if not already started - use lock for thread safety
    with camera_lock:
        if not camera_active:
            start_camera(enable_detection=detection_enabled)
            # Allow camera to initialize
            time.sleep(1.0)
    
    # Use a larger queue size for smoother streaming
    frame_buffer = []
    buffer_size = 3  # Keep a small buffer of frames
    
    try:
        while True:
            # Check camera status with lock
            with camera_lock:
                camera_is_active = camera_active
                if not camera_is_active:
                    # If camera is not active, start it
                    start_camera(enable_detection=detection_enabled)
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
