import { Check as CheckMuiIcon } from "@mui/icons-material";

const ProblemDescription = ({ question, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm animate-pulse">Loading problem details...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-8 text-center bg-white/5 rounded-xl border border-white/10">
        <p className="text-gray-400">No problem selected. Please pick a question to begin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 text-gray-300">
      {/* Description Context */}
      <div className="space-y-2">
        <p className="text-[15px] leading-relaxed text-gray-200">
          {question.description}
        </p>
      </div>

      {/* Constraints Section */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-[16px] tracking-tight">Constraints</h3>
        <div className="bg-[#0B1E2D] p-1 rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[10px] border border-[#1E3A4C] shadow-inner">
          <div className="space-y-1 italic text-[13px] text-gray-300 leading-relaxed font-mono">
            {question.constraints && question.constraints.length > 0 ? (
              question.constraints.map((constraint, idx) => (
                <p key={idx}>• {constraint}</p>
              ))
            ) : (
              <>
                <p>• {question.difficulty === 'hard' ? '10^5' : '10^4'} ≤ nums.length ≤ {question.difficulty === 'hard' ? '10^6' : '10^5'}</p>
                <p>• -10^9 ≤ nums[i] ≤ 10^9</p>
                <p>• Only one valid answer exists.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-[16px] tracking-tight">Examples</h3>
        <div className="space-y-2">
          {question.testCases && question.testCases.length > 0 ? (
            question.testCases.slice(0, 2).map((testCase, index) => (
              <div
                key={index}
                className="bg-[#0B1E2D] p-2 rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[10px] border border-[#1E3A4C] shadow-lg group hover:border-[#2563EB40] transition-colors"
              >
                <p className="italic text-gray-100 font-semibold text-sm mb-2">Example {index + 1}:</p>
                <div className="space-y-1 font-medium text-[13px] text-gray-200">
                  <p><span className="text-gray-400 font-bold mr-1 text-[11px] tracking-wider">Input:</span> {testCase.input}</p>
                  <p><span className="text-gray-400 font-bold mr-1 text-[11px] tracking-wider">Output:</span> {testCase.expectedOutput}</p>
                  <div className="flex items-start gap-1 pt-0 border-t border-white/5 mt-3">
                    <span className="text-gray-400 font-bold mr-2 text-[11px] tracking-wider mt-0.5">Reason:</span>
                    <div className="flex-1 flex items-center gap-1">
                      <p className="text-gray-300 italic">{testCase.explanation}</p>
                      <CheckMuiIcon sx={{ fontSize: 16, color: '#00FF88', opacity: 0.8 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 border border-dashed border-white/10 rounded-md text-center">
              <p className="text-gray-500 text-xs italic text-[13px]">No examples available for this question.</p>
            </div>
          )}
        </div>
      </div>

      {/* Difficulty & Type Badge - Small Footer */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${question.difficulty === 'easy' ? 'text-green-400 border-green-400/20 bg-green-400/5' :
            question.difficulty === 'medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5' :
              'text-red-400 border-red-400/20 bg-red-400/5'
          }`}>
          {question.difficulty}
        </span>
        {question.topic && (
          <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-blue-400 border border-blue-400/20 bg-blue-400/5">
            {question.topic}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProblemDescription;