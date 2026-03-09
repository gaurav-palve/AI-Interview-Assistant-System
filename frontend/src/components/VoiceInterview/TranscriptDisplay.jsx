import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MessageCircle, Clock } from 'lucide-react';

const TranscriptDisplay = ({
  transcript,
  isLive = false,
  duration = "00:00:00",
  className = ''
}) => {
  const scrollRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);

  // Auto-scroll logic
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current && !userScrolled) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [userScrolled]);

  useEffect(() => {
    scrollToBottom();
  }, [transcript, scrollToBottom]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setUserScrolled(!isAtBottom);
    }
  };

  const parseTranscript = useMemo(() => {
    if (!transcript) return [];

    // Split by double newline as these represent distinct entries
    const entries = transcript.split('\n\n').filter(l => l.trim());

    return entries.map((entry, idx) => {
      const colonIndex = entry.indexOf(':');
      if (colonIndex === -1) return null;

      const role = entry.substring(0, colonIndex).trim().toLowerCase();
      const text = entry.substring(colonIndex + 1).trim();

      const isAI = ['ai', 'assistant', 'interviewer', 'agent', 'bot', 'interviewer_bot', 'ai voice'].includes(role) || role.startsWith('ai');

      return {
        id: `${idx}-${text.length}`,
        type: isAI ? 'ai' : 'user',
        text: text
      };
    }).filter(Boolean);
  }, [transcript]);

  return (
    <div className={`flex flex-col h-full bg-[#050D27] border border-white/5 rounded-md overflow-hidden shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 bg-[#0B1739]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <h3 className="text-white font-semibold text-base tracking-wide">Live Transcript</h3>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono tabular-nums">{duration}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="bg-[#0B1739] flex-1 overflow-y-auto p-4 py-2 space-y-4 scrollbar-hide"
      >
        {parseTranscript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
            <MessageCircle className="w-12 h-12 mb-4" />
            <p className="text-sm">Conversation transcript will appear here in real-time</p>
          </div>
        ) : (
          parseTranscript.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.type === 'ai' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
            >
              <div className={`max-w-[85%] flex flex-col ${msg.type === 'ai' ? 'items-start' : 'items-end'}`}>
                {msg.type === 'ai' ? (
                  <>
                    {/* AI Label */}
                    <div className="mb-1 px-3 py-0 bg-[#0E1E4C] rounded-lg border border-white/10">
                      <span className="text-[10px] font-normal text-white tracking-widest">AI Voice</span>
                    </div>
                    {/* AI Text */}
                    <div className="text-left">
                      <p className="text-white text-[14px] leading-relaxed font-inter font-normal">
                        <span className="text-white mr-1 text-lg not-italic">“</span>
                        {msg.text}
                        <span className="text-white ml-1 text-lg not-italic">”</span>
                      </p>
                    </div>
                  </>
                ) : (
                  /* User Bubble */
                  <div className="bg-[#136C344D] border border-[#343B4F] rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[10px] px-3 py-1 shadow-inner relative group-hover:border-[#1E4D4D]/80 transition-colors">
                    <p className="text-white text-[14px] leading-relaxed font-inter font-normal text-right">
                      <span className="opacity-40 mr-1 text-lg not-italic">“</span>
                      {msg.text}
                      <span className="opacity-40 ml-1 text-lg not-italic">”</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-2 border-t border-white/5 bg-[#0B1739] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated Equalizer */}
          <div className="flex items-end gap-[3px] h-4">
            <div className="w-[3px] bg-[#43A8C6] animate-[equalizer_1s_ease-in-out_infinite]" />
            <div className="w-[3px] bg-[#43A8C6] animate-[equalizer_1.2s_ease-in-out_infinite_delay-1] h-3" />
            <div className="w-[3px] bg-[#43A8C6] animate-[equalizer_0.8s_ease-in-out_infinite_delay-20] h-2" />
            <div className="w-[3px] bg-[#43A8C6] animate-[equalizer_1.1s_ease-in-out_infinite_delay-30] h-4" />
            <div className="w-[3px] bg-[#43A8C6] animate-[equalizer_0.9s_ease-in-out_infinite_delay-40] h-3" />
          </div>
          <span className="text-[#43A8C6] text-xs text-base font-normal tracking-wide">Listening</span>
        </div>

        <div className="flex items-center gap-2 text-white">
          <span className="text-xs font-medium tracking-tighter">Transcribing in real time</span>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes equalizer {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TranscriptDisplay;
