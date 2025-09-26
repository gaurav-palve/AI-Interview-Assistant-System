import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  MessageSquare,
  Code,
  TrendingUp,
  Clock,
  FileText,
  Download,
  CheckCircle,
  Brain,
  Heart,
  Zap
} from 'lucide-react';

const VoiceInterviewResults = ({
  results,
  onDownloadTranscript,
  interviewId,
  className = ''
}) => {
  const navigate = useNavigate();
  if (!results) {
    return (
      <div className={`bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl ${className}`}>
        <div className="text-center text-white/60">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No results available</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score) => {
    if (score >= 8.5) return 'from-green-400 to-emerald-500';
    if (score >= 7) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 8.5) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Average';
    return 'Needs Improvement';
  };

  const getScoreIcon = (score) => {
    if (score >= 8.5) return CheckCircle;
    if (score >= 7) return TrendingUp;
    return Award;
  };

  const formatTranscript = (transcript) => {
    if (!transcript) return "No transcript available";

    // If transcript is already a string, return it
    if (typeof transcript === 'string') {
      return transcript;
    }

    // If transcript is an array of objects, format it
    if (Array.isArray(transcript)) {
      return transcript.map(entry => {
        if (!entry || typeof entry !== 'object') return '';

        const speaker = entry.role === 'user' ? 'Candidate' : 'AI Interviewer';

        // Handle different timestamp formats
        let timeString = '';
        if (entry.timestamp) {
          try {
            // If timestamp is a string, try to parse it
            if (typeof entry.timestamp === 'string') {
              const timestamp = new Date(entry.timestamp);
              timeString = timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
            } else {
              timeString = new Date(entry.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
            }
          } catch (e) {
            timeString = '[Time unknown]';
          }
        } else {
          timeString = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }

        return `[${timeString}] ${speaker}: ${entry.text || ''}`;
      }).join('\n\n');
    }

    // Fallback for any other data type
    return `Transcript data: ${JSON.stringify(transcript, null, 2)}`;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
          Interview Completed!
        </h2>
        <p className="text-white/60">Thank you for participating in the voice interview</p>
      </div>

      {/* Overall Score Card */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-r ${getScoreColor(results.overall_score || 0)} flex items-center justify-center shadow-2xl`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {results.overall_score ? results.overall_score.toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-white/80">Overall Score</div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              {React.createElement(getScoreIcon(results.overall_score || 0), {
                className: "w-4 h-4 text-white"
              })}
            </div>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getScoreColor(results.overall_score || 0)} text-white`}>
            {getScoreLabel(results.overall_score || 0)}
          </div>
        </div>
      </div>

      {/* Detailed Scores Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Brain className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-purple-400">
              {results.technical_score ? results.technical_score.toFixed(1) : '0.0'}
            </span>
          </div>
          <h3 className="font-semibold mb-2">Technical Skills</h3>
          <p className="text-white/60 text-sm">Strong problem-solving abilities and technical knowledge</p>
          <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000"
              style={{ width: `${(results.technical_score || 0) * 10}%` }}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">
              {results.communication_score ? results.communication_score.toFixed(1) : '0.0'}
            </span>
          </div>
          <h3 className="font-semibold mb-2">Communication</h3>
          <p className="text-white/60 text-sm">Excellent verbal communication and clarity</p>
          <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000"
              style={{ width: `${(results.communication_score || 0) * 10}%` }}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-8 h-8 text-pink-400" />
            <span className="text-2xl font-bold text-pink-400">
              {results.confidence_score ? results.confidence_score.toFixed(1) : '0.0'}
            </span>
          </div>
          <h3 className="font-semibold mb-2">Cultural Fit</h3>
          <p className="text-white/60 text-sm">Great alignment with company values and culture</p>
          <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-1000"
              style={{ width: `${(results.confidence_score || 0) * 10}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interview Stats */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-400" />
          Interview Statistics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {formatDuration(results.duration_seconds || 0)}
            </div>
            <div className="text-sm text-white/60">Duration</div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {results.word_count || 0}
            </div>
            <div className="text-sm text-white/60">Words</div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {results.response_count || 0}
            </div>
            <div className="text-sm text-white/60">Responses</div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-pink-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {results.sentence_count || 0}
            </div>
            <div className="text-sm text-white/60">Sentences</div>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      {results.feedback && (
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-indigo-500/30">
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-indigo-400 mr-3" />
            <h3 className="text-xl font-bold">Detailed Feedback</h3>
          </div>
          <p className="text-white/90 leading-relaxed text-lg">
            {results.feedback}
          </p>
        </div>
      )}

      {/* Transcript Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MessageSquare className="w-6 h-6 text-blue-400 mr-3" />
            <h3 className="text-xl font-bold">Interview Transcript</h3>
          </div>
          <button
            onClick={onDownloadTranscript}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </button>
        </div>
        <div className="bg-black/20 rounded-xl p-6 max-h-80 overflow-y-auto custom-scrollbar">
          <pre className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed">
            {formatTranscript(results.transcript) || "No transcript available"}
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-6">
        <button
          onClick={onDownloadTranscript}
          className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Results
        </button>
        <button className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
          Back to Dashboard
        </button>
        <button
          onClick={() => {
            // Use the interviewId from props, or fallback to a default value or extract from results if available
            const id = interviewId || (results && results.interview_id) || 'default';
            navigate(`/coding-instructions/${id}`);
          }}
          className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
        >
          <Code className="w-5 h-5 mr-2" />
          Next: Coding Round
        </button>
      </div>

      {/* Completion Date */}
      <div className="text-center text-white/50 text-sm">
        Completed on {new Date(results.completed_at || Date.now()).toLocaleString()}
      </div>
    </div>
  );
};

export default VoiceInterviewResults;
