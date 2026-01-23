import { useEffect, useRef, useState } from "react";
import {
  FaceDetector,
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

/**
 * CameraProctoringTest Component
 * @param {boolean} autoStart - Auto-start camera on mount (default: false)
 * @param {string} sessionId - Session ID for WebSocket (default: 'test-session-001')
 * @param {boolean} hideControls - Hide the manual start/stop buttons (default: false)
 * @param {function} onCheatingDetected - Callback function when cheating is detected, receives (type, message)
 */
export default function CameraProctoringTest({ autoStart = false, sessionId: propSessionId = 'test-session-001', hideControls = false, onCheatingDetected = null }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const streamRef = useRef(null);
  const wsRef = useRef(null);

  // mediapipe
  const faceDetectorRef = useRef(null);
  const faceLandmarkerRef = useRef(null);

  // tfjs
  const cocoModelRef = useRef(null);

  // loops
  const animationRef = useRef(null);
  const phoneIntervalRef = useRef(null);

  // state
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [modelsReady, setModelsReady] = useState(false);

  const autoStartAttemptedRef = useRef(false);

  // session id
  const sessionId = propSessionId;

  // ============================
  // GLOBAL COOLDOWN (5 sec)
  // ============================
  const EVENT_COOLDOWN_MS = 5000; // ✅ 5 seconds cooldown per event type
  const lastEventRef = useRef({}); // { EVENT_NAME: lastTimeMs }

  // ============================
  // STABILITY / GRACE SETTINGS
  // ============================
  const FACE_MISSING_GRACE_MS = 1200; // allow small movements
  const FACE_MISSING_REQUIRED_FRAMES = 10; // stable missing
  const MULTIPLE_FACES_REQUIRED_FRAMES = 10; // stable multiple faces
  const LOOK_AWAY_REQUIRED_FRAMES = 14; // stable looking away

  // counters
  const faceMissingFramesRef = useRef(0);
  const multipleFacesFramesRef = useRef(0);
  const lookAwayFramesRef = useRef(0);

  // face missing timer
  const faceMissingStartRef = useRef(null);

  // ============================
  // LOGGING HELPERS
  // ============================
  const addLog = (msg) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev]);
  };

  /**
   * Send + Log only once per cooldown interval
   * This guarantees:
   * ✅ only 1 log in 5 seconds for same cheating type
   * ✅ only 1 websocket event in 5 seconds for same cheating type
   */
  const logAndSend = (type, logMsg, payload = {}) => {
    const now = Date.now();
    const lastTs = lastEventRef.current[type] || 0;

    if (now - lastTs < EVENT_COOLDOWN_MS) return; // cooldown active

    lastEventRef.current[type] = now;

    // log once
    addLog(logMsg);

    // trigger callback for toast notification
    if (onCheatingDetected) {
      onCheatingDetected(type, logMsg);
    }

    // send event once
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(
        JSON.stringify({
          type,
          ts: now,
          ...payload,
        })
      );
    }
  };

  // =============================
  // WebSocket
  // =============================
  const connectWebSocket = () => {
    const ws = new WebSocket(
      `ws://127.0.0.1:8000/api/ws/proctoring/${sessionId}`
    );
    wsRef.current = ws;

    ws.onopen = () => addLog("WebSocket connected");
    ws.onclose = () => addLog("WebSocket disconnected");
    ws.onerror = () => addLog("WebSocket error");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addLog(`Server: ${JSON.stringify(data)}`);
      } catch {
        addLog("Server message received");
      }
    };
  };

  // =============================
  // Proctoring checks (tab/focus)
  // =============================
  const cleanupFocusRef = useRef(null);

  const attachFocusListeners = () => {
    const handleVisibility = () => {
      if (document.hidden) {
        logAndSend("TAB_SWITCH", "Cheating: Tab switched / minimized");
      }
    };

    const handleBlur = () => {
      logAndSend("WINDOW_BLUR", "Cheating: Window lost focus");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  };

  // =============================
  // Start Camera
  // =============================
  const startCamera = async () => {
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      addLog("Camera started");
      setStatus("ready");

      connectWebSocket();

      cleanupFocusRef.current = attachFocusListeners();

      await loadModels();

      startFaceDetectionLoop();
      startPhoneDetectionLoop();
    } catch (err) {
      console.error(err);
      setStatus("denied");
      addLog("Camera permission denied or blocked");
    }
  };

  // Auto-start camera on mount if autoStart prop is true
  useEffect(() => {
    if (autoStart && status === "idle" && !autoStartAttemptedRef.current) {
      console.log('AutoStart: Starting camera');
      autoStartAttemptedRef.current = true;
      startCamera();
    }
  }, [autoStart]);

  useEffect(() => {
    if (!autoStart) {
      autoStartAttemptedRef.current = false;
    }
  }, [autoStart]);

  const stopCamera = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;

    if (phoneIntervalRef.current) clearInterval(phoneIntervalRef.current);
    phoneIntervalRef.current = null;

    if (cleanupFocusRef.current) cleanupFocusRef.current();
    cleanupFocusRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    faceDetectorRef.current = null;
    faceLandmarkerRef.current = null;
    cocoModelRef.current = null;

    setModelsReady(false);
    setStatus("idle");
    addLog("Camera stopped");
  };

  // =============================
  // Load models
  // =============================
  const loadModels = async () => {
    addLog("Loading AI models...");
    setModelsReady(false);

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      },
      runningMode: "VIDEO",
    });

    faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
    });

    cocoModelRef.current = await cocoSsd.load();

    setModelsReady(true);
    addLog("AI models ready");
  };

  // =============================
  // Face + Look detection loop
  // =============================
  const startFaceDetectionLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const loop = () => {
      if (!video || video.readyState < 2) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      const faceDetector = faceDetectorRef.current;
      const faceLandmarker = faceLandmarkerRef.current;

      if (!faceDetector || !faceLandmarker) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      // canvas match
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();

      // ---------------- Face detection ----------------
      const faceResult = faceDetector.detectForVideo(video, now);
      const faces = faceResult?.detections || [];
      const faceCount = faces.length;

      // draw face boxes
      faces.forEach((d) => {
        const box = d.boundingBox;
        if (!box) return;
        ctx.beginPath();
        ctx.rect(box.originX, box.originY, box.width, box.height);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "lime";
        ctx.stroke();
      });

      // ============= FACE MISSING =============
      if (faceCount === 0) {
        // start timer once
        if (!faceMissingStartRef.current) {
          faceMissingStartRef.current = Date.now();
        }

        const missingMs = Date.now() - faceMissingStartRef.current;

        // count stable frames only after grace time
        if (missingMs > FACE_MISSING_GRACE_MS) {
          faceMissingFramesRef.current += 1;
        }

        if (faceMissingFramesRef.current >= FACE_MISSING_REQUIRED_FRAMES) {
          logAndSend(
            "FACE_MISSING",
            "Cheating: No face detected (candidate left frame)",
            { missingMs }
          );
        }

        // reset others
        multipleFacesFramesRef.current = 0;
        lookAwayFramesRef.current = 0;

        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      // if face is back, reset missing tracking
      faceMissingStartRef.current = null;
      faceMissingFramesRef.current = 0;

      // ============= MULTIPLE FACES =============
      if (faceCount > 1) {
        multipleFacesFramesRef.current += 1;

        if (multipleFacesFramesRef.current >= MULTIPLE_FACES_REQUIRED_FRAMES) {
          logAndSend(
            "MULTIPLE_FACES",
            `Cheating: Multiple faces detected (${faceCount})`,
            { count: faceCount }
          );
        }

        // reset lookAway
        lookAwayFramesRef.current = 0;

        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      // reset multiple faces counter if ok
      multipleFacesFramesRef.current = 0;

      // ============= LOOKING AWAY =============
      // only when exactly 1 face
      const landmarkResult = faceLandmarker.detectForVideo(video, now);
      const landmarks = landmarkResult?.faceLandmarks?.[0];

      if (landmarks && landmarks.length > 0) {
        const lookDir = estimateLookDirection(landmarks);

        if (lookDir !== "CENTER") {
          lookAwayFramesRef.current += 1;

          if (lookAwayFramesRef.current >= LOOK_AWAY_REQUIRED_FRAMES) {
            logAndSend("LOOKING_AWAY", `Cheating: Looking ${lookDir}`, {
              direction: lookDir,
            });
          }
        } else {
          lookAwayFramesRef.current = 0;
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  /**
   * Updated look direction with MORE FREEDOM
   * - LEFT/RIGHT threshold increased (less sensitive)
   * - DOWN threshold increased (less sensitive)
   */
  const estimateLookDirection = (landmarks) => {
    const nose = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    if (!nose || !leftCheek || !rightCheek) return "CENTER";

    const centerX = (leftCheek.x + rightCheek.x) / 2;
    const offsetX = nose.x - centerX;

    // ✅ more freedom: previously 0.035
    const LEFT_RIGHT_THRESHOLD = 0.055;

    if (offsetX > LEFT_RIGHT_THRESHOLD) return "RIGHT";
    if (offsetX < -LEFT_RIGHT_THRESHOLD) return "LEFT";

    // ✅ more freedom: previously 0.62 (too sensitive)
    // allow user to look slightly down naturally
    const DOWN_THRESHOLD = 0.72;
    if (nose.y > DOWN_THRESHOLD) return "DOWN";

    return "CENTER";
  };

  // =============================
  // Phone detection loop (COCO-SSD)
  // =============================
  const startPhoneDetectionLoop = () => {
    const video = videoRef.current;

    phoneIntervalRef.current = setInterval(async () => {
      if (!video || video.readyState < 2) return;
      if (!cocoModelRef.current) return;

      try {
        const predictions = await cocoModelRef.current.detect(video);

        const phone = predictions.find(
          (p) => p.class === "cell phone" && p.score > 0.55
        );

        if (phone) {
          logAndSend(
            "PHONE_DETECTED",
            `Cheating: Phone detected (${(phone.score * 100).toFixed(0)}%)`,
            { confidence: phone.score }
          );
        }
      } catch (err) {
        console.error("Phone detection error:", err);
      }
    }, 1200);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div style={{ padding: hideControls ? 0 : 20, width: "100%", height: "100%" }}>
      {!hideControls && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            Live Interview Proctoring (Face + Phone + Look Away)
          </h2>

          <div style={{ marginTop: 12 }}>
            {status === "idle" && (
              <button onClick={startCamera} style={btnStyle}>
                Allow Camera & Start Proctoring
              </button>
            )}

            {status === "requesting" && <p>Requesting camera permission...</p>}

            {status === "denied" && (
              <p style={{ color: "red" }}>
                Camera blocked. Please allow camera in Chrome settings and refresh.
              </p>
            )}

            {status === "ready" && (
              <button
                onClick={stopCamera}
                style={{ ...btnStyle, background: "#DC2626" }}
              >
                Stop Interview
              </button>
            )}
          </div>

          <div style={{ marginTop: 10 }}>
            <b>Models:</b>{" "}
            <span style={{ color: modelsReady ? "green" : "orange" }}>
              {modelsReady ? "READY" : "LOADING"}
            </span>
          </div>
        </>
      )}

      <div style={{ display: hideControls ? "block" : "flex", gap: 20, marginTop: hideControls ? 0 : 20 }}>
        <div style={{ position: "relative", flex: hideControls ? 1 : "auto" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: hideControls ? "100%" : 520,
              height: hideControls ? "100%" : "auto",
              borderRadius: hideControls ? 0 : 14,
              border: hideControls ? "none" : "2px solid #2563EB",
              background: "#000",
              objectFit: "cover"
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />

          {!hideControls && (
            <p style={{ marginTop: 8, fontWeight: 600 }}>
              Status:{" "}
              <span style={{ color: status === "ready" ? "green" : "gray" }}>
                {status}
              </span>
            </p>
          )}
        </div>

        {!hideControls && (
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 700 }}>Live Proctoring Logs</h3>

            <div
              style={{
                height: 380,
                overflowY: "auto",
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 12,
                background: "#fafafa",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            >
              {logs.length === 0 ? (
                <p>No logs yet...</p>
              ) : (
                logs.map((l, i) => <div key={i}>{l}</div>)
              )}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
              <b>Cooldown:</b> {EVENT_COOLDOWN_MS / 1000}s (per cheating type)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#2563EB",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
