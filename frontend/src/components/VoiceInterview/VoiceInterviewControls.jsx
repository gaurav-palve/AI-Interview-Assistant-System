import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, Zap, Volume2, Wifi, WifiOff, AlertCircle } from 'lucide-react';

const VoiceInterviewControls = ({
  status,
  onStart,
  onStop,
  disabled = false,
  duration = 0,
  connectionQuality = 'good',
  audioLevel = 0,
  isRecording = false,
  isFallbackMode = false,
  fallbackReason = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setIsProcessing(true);
    try {
      await onStart();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = async () => {
    setIsProcessing(true);
    try {
      await onStop();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
      <div className="text-center mb-8">
        {/* Animated Microphone Visualization */}
        <div className="relative inline-block mb-6">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            status === 'active'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-2xl shadow-red-500/30'
              : 'bg-gradient-to-r from-gray-600 to-gray-700'
          }`}>
            {isProcessing ? (
              <Loader2 className="w-12 h-12 animate-spin text-white" />
            ) : status === 'active' ? (
              <Mic className={`w-12 h-12 text-white ${isRecording ? 'animate-pulse' : ''}`} />
            ) : status === 'completed' ? (
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Mic className="w-12 h-12 text-white/60" />
            )}
          </div>

          {/* Audio Level Visualization */}
          {status === 'active' && isRecording && (
            <div className="absolute inset-0 rounded-full">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"
                  style={{
                    animationDelay: `${i * 0.5}s`,
                    transform: `scale(${1 + (audioLevel / 100) * (i + 1) * 0.3})`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {status === 'pending' && 'Ready to Start'}
          {status === 'active' && 'Interview in Progress'}
          {status === 'completed' && 'Interview Completed'}
        </h2>

        <p className="text-white/60 mb-6">
          {status === 'pending' && 'Click the button below to begin your voice interview'}
          {status === 'active' && 'Speak naturally and take your time to answer'}
          {status === 'completed' && 'Your interview has been successfully recorded'}
        </p>

        {/* Main Action Button */}
        {status === 'pending' && (
          <button
            onClick={handleStart}
            disabled={disabled || isProcessing}
            className="group relative px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </span>
            ) : (
              <span className="flex items-center">
                <Zap className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Start Interview
              </span>
            )}
          </button>
        )}

        {status === 'active' && (
          <div className="space-y-4">
            <button
              onClick={handleStop}
              disabled={isProcessing}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {isProcessing ? 'Ending...' : 'End Interview'}
            </button>
          </div>
        )}
      </div>

      {/* Audio Level Meter */}
      {status === 'active' && isRecording && (
        <div className="mt-8">
          <div className="flex items-center justify-center space-x-1 mb-2">
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

      {/* Connection Quality */}
      {status === 'active' && !isFallbackMode && (
        <div className="mt-6 bg-black/20 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {connectionQuality === 'excellent' || connectionQuality === 'good' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-medium">Connection Quality</span>
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

      {/* Fallback Mode */}
      {isFallbackMode && status === 'active' && (
        <div className="mt-6 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-center text-yellow-400 mb-3">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Text Mode Active</h3>
          </div>
          <p className="text-white/60 text-sm">{fallbackReason || 'Voice service temporarily unavailable'}</p>
        </div>
      )}

      {/* Duration Display */}
      {(status === 'active' || status === 'completed') && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="font-mono text-sm">{formatDuration(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInterviewControls;
