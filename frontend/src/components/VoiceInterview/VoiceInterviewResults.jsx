import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Code } from 'lucide-react';

const VoiceInterviewResults = ({
  results,
  interviewId,
  className = ''
}) => {
  const navigate = useNavigate();

  if (!results) {
    return (
      <div className={`bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl ${className}`}>
        <div className="text-center text-white/60">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No results available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
          HR + Technical Voice Round Completed.
        </h2>
        <p className="text-white/60">Please click on the Coding Round Button to proceed further </p>
      </div>

      {/* ONLY Next Button */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            const id = interviewId || (results && results.interview_id) || 'default';
            navigate(`/coding-instructions/${id}`);
          }}
          className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 
          rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 
          hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
        >
          <Code className="w-5 h-5 mr-2" />
          Next: Coding Round
        </button>
      </div>
    </div>
  );
};

export default VoiceInterviewResults;

 
