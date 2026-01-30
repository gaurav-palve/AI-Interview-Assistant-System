import { useEffect, useRef, useState } from "react";

export default function CameraInterviewRoom() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const wsRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);

  const sessionId = "test-session-001"; // later you can make it dynamic

  const addLog = (msg) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev]);
  };

  const connectWebSocket = () => {
    // IMPORTANT: Use ws:// for local, wss:// for production
    const ws = new WebSocket(`ws://127.0.0.1:8000/api/ws/proctoring/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => addLog(" WebSocket connected");
    ws.onclose = () => addLog("❌ WebSocket disconnected");
    ws.onerror = () => addLog("❌ WebSocket error");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(`📩 Server: ${JSON.stringify(data.event)}`);
    };
  };

  const sendEvent = (type, payload = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;

    wsRef.current.send(
      JSON.stringify({
        type,
        ts: Date.now(),
        ...payload,
      })
    );
  };

  const startCamera = async () => {
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      setStatus("ready");
      addLog("🎥 Camera started");

      connectWebSocket();

      // Basic proctoring checks
      startProctoringChecks();
    } catch (err) {
      console.error(err);
      setStatus("denied");
      addLog("❌ Camera permission denied or blocked");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("idle");
    addLog("🛑 Camera stopped");
  };

  const startProctoringChecks = () => {
    // Tab switching detection
    const handleVisibility = () => {
      if (document.hidden) {
        addLog("⚠️ Tab switched / minimized");
        sendEvent("TAB_SWITCH");
      }
    };

    // Window focus detection
    const handleBlur = () => {
      addLog("⚠️ Window lost focus");
      sendEvent("WINDOW_BLUR");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    // Cleanup on stop/unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>🎥 Live Interview Camera Setup</h2>

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
          <button onClick={stopCamera} style={{ ...btnStyle, background: "#DC2626" }}>
            Stop Interview
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: 520,
              borderRadius: 14,
              border: "2px solid #2563EB",
              background: "#000",
            }}
          />
          <p style={{ marginTop: 8, fontWeight: 600 }}>
            Status:{" "}
            <span style={{ color: status === "ready" ? "green" : "gray" }}>{status}</span>
          </p>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700 }}>📌 Live Proctoring Logs</h3>
          <div
            style={{
              height: 320,
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
        </div>
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
