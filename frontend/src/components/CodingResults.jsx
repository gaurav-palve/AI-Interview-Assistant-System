import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import completedTick from "../assets/completed-tick.gif";

const CodingResults = ({
    results,
    interviewId,
    onFinish,
    className = ''
}) => {
    const navigate = useNavigate();

    // Format time taken if available, otherwise use a placeholder
    // In a real scenario, this would come from props
    const timeTaken = results?.duration_seconds !== undefined
        ? new Date(results.duration_seconds * 1000).toISOString().substr(14, 5)
        : "--:--";

    const handleFinish = () => {
        if (onFinish) {
            onFinish();
        } else {
            navigate('/interview-complete');
        }
    };

    return (
        <div className={`flex items-center justify-center py-1 w-full ${className}`}>
            {/* Centered Summary Card */}
            <div className="w-[375px] h-[400px] bg-[radial-gradient(ellipse_45.36%_45.36%_at_50.00%_24.95%,_#112662_0%,_#0B1739_100%)] backdrop-blur-3xl rounded-md px-8 py-1 border border-white/10 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">

                {/* Subtle Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-60 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Animated Checkmark/GIF Area */}
                <div className="relative z-10 w-32 h-32 flex items-center justify-center mb-0">
                    <img
                        src={completedTick}
                        alt="Completed"
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Title Section */}
                <h2 className="text-[24px] font-semibold text-white mb-3 tracking-tight leading-tight z-10">
                    Coding Round Completed
                </h2>

                <p className="text-white/70 text-[14px] font-normal leading-[1.6] mb-5 max-w-[320px] z-10">
                    You've successfully submitted the coding test. Your response has been recorded.
                </p>

                <div className="w-full max-w-[230px] bg-[#0B1739]/50 backdrop-blur-md border border-white/5 rounded-md py-2 mb-6 flex flex-col items-center z-10">
                    <span className="text-[28px] font-semibold text-white mb-1 leading-none tabular-nums tracking-tight">
                        {timeTaken}
                    </span>
                    <span className="text-[11px] font-normal text-white tracking-[0.2em]">
                        Time Taken
                    </span>
                </div>

                {/* Action Button - Premium Style */}
                <button
                    onClick={handleFinish}
                    className="w-[230px] h-12 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-md font-semibold text-[15px] shadow-[0px_8px_24px_rgba(37,99,235,0.4)] transition-all duration-300 flex items-center justify-center gap-3 group z-10 active:scale-[0.98]"
                >
                    Finish Test
                    <ArrowForwardIcon sx={{ fontSize: 18 }} className="transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

export default CodingResults;
