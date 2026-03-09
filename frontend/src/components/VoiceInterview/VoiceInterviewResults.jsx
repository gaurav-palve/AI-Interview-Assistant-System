import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import completedTick from "../../assets/completed-tick.gif";

const VoiceInterviewResults = ({
  results,
  interviewId,
  className = ''
}) => {
  const navigate = useNavigate();

  // Format time taken if available, otherwise use a placeholder
  const timeTaken = results?.duration_seconds
    ? new Date(results.duration_seconds * 1000).toISOString().substr(14, 5)
    : "15:04"; // Default placeholder if missing

  const handleContinue = () => {
    const id = interviewId || results?.interview_id;
    if (id) {
      navigate(`/coding-instructions/${id}`);
    }
  };

  return (
    <div className={`flex items-center justify-center py-0 ${className}`}>
      {/* Centered Summary Card */}
      <div className="w-100 h-[390px] mt-4 bg-[radial-gradient(ellipse_45.36%_45.36%_at_50.00%_24.95%,_#112662_0%,_#0B1739_100%)] backdrop-blur-3xl rounded-md p-8 py-0 border border-white/5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-60 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 rounded-md" />
        <img
          src={completedTick}
          alt="Completed"
          className="relative z-10 w-50 h-50 object-contain"
        />

        {/* Title Section */}
        <h2 className="text-[22px] font-semibold text-white mb-3 tracking-tight leading-tight z-10">
          AI Voice Round Completed
        </h2>

        <p className="text-white text-xs font-normal leading-[1.6] mb-4 max-w-[280px] z-10">
          You've successfully submitted the voice interview. Your response have been recorded.
        </p>

        {/* Time Taken Box */}
        <div className="w-60 max-w-[260px] bg-[#0B1739] border border-[#1E293B] rounded-lg py-2 mb-5 flex flex-col items-center z-10">
          <span className="text-[26px] font-semibold text-white mb-0.5 leading-none tabular-nums">
            {timeTaken}
          </span>
          <span className="text-[10px] font-normal text-white tracking-widest mt-1">
            Time Taken
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleContinue}
          className="w-60 h-10 bg-[#2563EB] text-white rounded-[6px] font-semibold text-[13px] shadow-[0px_0px_16px_0px_rgba(37,99,235,0.80)] transition-all flex items-center justify-center gap-2 group z-10"
        >
          Continue to Coding Round
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  );
};

export default VoiceInterviewResults;
