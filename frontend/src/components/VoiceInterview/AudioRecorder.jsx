import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Volume2, Wifi, AlertCircle, Loader2 } from 'lucide-react';

const AudioRecorder = ({
  onRecordingComplete,
  isInterviewActive,
  disabled = false,
  websocket = null,
  connectionQuality = 'good',
  isFallbackMode = false,
  fallbackReason = '',
  onAudioLevelChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const analyserRef = useRef(null);

  // Simulate audio levels for demo
  useEffect(() => {
    if (isRecording && analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(average * 2, 100));
          requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } else {
      setAudioLevel(0);
    }
  }, [isRecording]);

  // Update parent component with audio level
  useEffect(() => {
    if (onAudioLevelChange) {
      onAudioLevelChange(audioLevel);
    }
  }, [audioLevel, onAudioLevelChange]);

  useEffect(() => {
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setIsProcessing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      streamRef.current = stream;

      // Set up audio context for level monitoring
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up real-time audio streaming if WebSocket is available
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        await startAudioStreaming(stream);
      } else {
        // Fallback to traditional recording
        await startTraditionalRecording(stream);
      }

      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startAudioStreaming = async (stream) => {
    try {
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Create script processor for real-time audio chunks
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (event) => {
        if (websocket && websocket.readyState === WebSocket.OPEN && isRecording) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);

          // Convert Float32Array to Int16Array (PCM 16-bit)
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }

          // Send binary audio data to WebSocket
          try {
            websocket.send(pcmData.buffer);
          } catch (error) {
            console.error("Error sending audio data to WebSocket:", error);
          }
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsStreaming(true);

    } catch (error) {
      console.error('Error starting audio streaming:', error);
      // Fallback to traditional recording
      await startTraditionalRecording(stream);
    }
  };

  const startTraditionalRecording = async (stream) => {
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    });

    const audioChunks = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.push(event.data);

      // Send audio chunk to WebSocket in real-time if available
      if (websocket && websocket.readyState === WebSocket.OPEN && event.data.size > 0) {
        try {
          websocket.send(event.data);
        } catch (error) {
          console.error("Error sending audio chunk to WebSocket:", error);
        }
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioURL(audioUrl);

      if (onRecordingComplete) {
        onRecordingComplete(audioBlob);
      }
    };

    // Start recording with frequent data events for real-time streaming
    mediaRecorderRef.current.start(100); // Get data every 100ms
  };

  const stopRecording = () => {
    setIsRecording(false);

    // Stop traditional recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop audio streaming
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Clear timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsStreaming(false);

    // Send stop signal to WebSocket
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        websocket.send(JSON.stringify({ type: 'audio_stop' }));
      } catch (error) {
        console.error("Error sending stop signal to WebSocket:", error);
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2 flex items-center justify-center">
          <Mic className="w-5 h-5 mr-2 text-blue-400" />
          Audio Recorder
        </h3>
        <p className="text-white/60 text-sm">
          {isRecording ? 'Recording in progress...' : 'Ready to record your responses'}
        </p>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
          </div>
          {isStreaming && (
            <div className="text-sm text-green-400 flex items-center justify-center">
              <Wifi className="w-4 h-4 mr-1" />
              Live streaming to AI interviewer
            </div>
          )}
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || !isInterviewActive || isProcessing}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
              disabled || !isInterviewActive
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-500/30'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            <span>{isProcessing ? 'Starting...' : 'Start Recording'}</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/30"
          >
            <Square className="w-5 h-5" />
            <span>Stop Recording</span>
          </button>
        )}
      </div>

      {/* Audio Level Visualization */}
      {isRecording && (
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-1 mb-3">
            <Volume2 className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Audio Level</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-100 ${
                  i < (audioLevel / 5)
                    ? 'bg-gradient-to-t from-green-400 to-emerald-300 h-8'
                    : 'bg-white/20 h-2'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Playback Controls */}
      {audioURL && (
        <div className="mt-6 bg-black/20 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-center space-x-4 mb-3">
            {!isPlaying ? (
              <button
                onClick={playRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover:scale-105"
              >
                <Play className="w-4 h-4" />
                <span>Play</span>
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}
          </div>

          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            className="w-full"
            controls
          />
        </div>
      )}

      {/* Connection Quality Indicator */}
      {isRecording && !isFallbackMode && (
        <div className="mt-6 bg-black/20 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {connectionQuality === 'excellent' || connectionQuality === 'good' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <Wifi className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-medium">Connection</span>
            </div>
            <span className={`text-sm font-medium capitalize ${
              connectionQuality === 'excellent' ? 'text-green-400' :
              connectionQuality === 'good' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {connectionQuality}
            </span>
          </div>
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  i < (connectionQuality === 'excellent' ? 5 : connectionQuality === 'good' ? 3 : 1)
                    ? 'bg-gradient-to-r from-green-400 to-emerald-300'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fallback Mode Indicator */}
      {isFallbackMode && isInterviewActive && (
        <div className="mt-6 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-center text-yellow-400 mb-3">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Fallback Mode</h3>
          </div>
          <p className="text-white/60 text-sm">{fallbackReason || 'Voice service temporarily unavailable'}</p>
        </div>
      )}

      {!isInterviewActive && (
        <div className="mt-6 text-center bg-black/20 rounded-2xl p-4 border border-white/10">
          <MicOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-white/60 text-sm">
            Start the voice interview to begin recording
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
