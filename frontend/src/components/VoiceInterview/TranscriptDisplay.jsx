import React, { useEffect, useRef } from 'react';
import { MessageCircle, User, Bot, Wifi, WifiOff } from 'lucide-react';

const TranscriptDisplay = ({
  transcript,
  isLive = false,
  aiThinking = false,
  connectionQuality = 'good',
  className = ''
}) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const parseTranscript = (text) => {
    if (!text) return [];

    const lines = text.split('\n\n');
    return lines.map((line, index) => {
      const isCandidate = line.startsWith('You:');
      const isInterviewer = line.startsWith('AI:');

      if (isCandidate) {
        return {
          id: index,
          type: 'candidate',
          text: line.replace('You:', '').trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (isInterviewer) {
        return {
          id: index,
          type: 'interviewer',
          text: line.replace('AI:', '').trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return null;
    }).filter(Boolean);
  };

  const messages = parseTranscript(transcript);

  return (
    <div className={`bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Live Transcript</h3>
            <p className="text-white/60 text-sm">
              {isLive ? 'Real-time conversation' : 'Interview transcript'}
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          {isLive && (
            <div className="flex items-center space-x-2">
              {connectionQuality === 'excellent' || connectionQuality === 'good' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs font-medium capitalize ${
                connectionQuality === 'excellent' ? 'text-green-400' :
                connectionQuality === 'good' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {connectionQuality}
              </span>
            </div>
          )}

          {/* Live Indicator */}
          {isLive && (
            <div className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-red-500/30">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-200">LIVE</span>
            </div>
          )}

          {/* AI Thinking Indicator */}
          {aiThinking && (
            <div className="flex items-center space-x-2 text-purple-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-xs font-medium">AI is thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Content */}
      <div className="flex-1 relative">
        <div
          ref={scrollRef}
          className="bg-black/20 rounded-2xl p-6 h-full overflow-y-auto border border-white/10 custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/40">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Transcript will appear here</p>
                <p className="text-sm">Start the interview to begin the conversation</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'candidate' ? 'justify-end' : 'justify-start'} animate-[slideIn_0.3s_ease-out]`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    message.type === 'interviewer'
                      ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30'
                      : 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/30'
                  }`}>
                    {/* Message Header */}
                    <div className="flex items-center mb-3">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        message.type === 'interviewer' ? 'bg-purple-400' : 'bg-blue-400'
                      }`} />
                      <span className="text-xs font-medium text-white/60">
                        {message.type === 'interviewer' ? 'AI Interviewer' : 'You'}
                      </span>
                      <span className="text-xs text-white/40 ml-auto">{message.timestamp}</span>
                    </div>

                    {/* Message Content */}
                    <p className="text-white/90 leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        {messages.length > 0 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
              <span className="text-xs text-white/60">Scroll for more messages</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {isLive && (
        <div className="mt-4 text-center">
          <p className="text-xs text-white/50">
            Transcript updates automatically • {messages.length} messages
          </p>
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
