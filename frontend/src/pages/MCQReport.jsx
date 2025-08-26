import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import interviewService from '../services/interviewService';

// Material UI Icons
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

/**
 * MCQReport page component
 * Displays MCQ report for a specific interview
 */
function MCQReport() {
  const { interviewId } = useParams();
  const [mcqData, setMcqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    percentage: 0
  });

  // Fetch MCQ report data on component mount
  useEffect(() => {
    const fetchMCQReport = async () => {
      try {
        setLoading(true);
        const response = await interviewService.getMCQReport(interviewId);
        if (response && response.mcq_answers) {
          console.log("MCQ Report Data:", response.mcq_answers);
          setMcqData(response.mcq_answers);
          
          
          // Filter out the first item which only contains candidate_name
          const mcqItems = response.mcq_answers.filter(item => item.question);
          
          // Calculate statistics
          const total = mcqItems.length;
          const correct = mcqItems.filter(item => item.is_correct).length;
          const incorrect = total - correct;
          const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
          
          setStats({
            total,
            correct,
            incorrect,
            percentage
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching MCQ report:', err);
        setError(err.detail || 'Failed to load MCQ report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchMCQReport();
    }
  }, [interviewId]);

  // Get candidate info from the MCQ data
  const getCandidateInfo = () => {
    if (mcqData.length > 0) {
      console.log("Full MCQ data:", mcqData);
      console.log("First item:", mcqData[0]);
      
      // The first item in the array contains the candidate name
      if (mcqData[0].candidate_name !== undefined) {
        console.log("Using first item - name:", mcqData[0].candidate_name);
        console.log("Using first item - email:", mcqData[0].candidate_email);
        
        return {
          name: mcqData[0].candidate_name || 'Candidate',
          email: mcqData[0].candidate_email || 'N/A'
        };
      }
      
      // If we have MCQ data but not the candidate name in the first item
      if (mcqData.length > 1) {
        console.log("Using second item - name:", mcqData[1].candidate_name);
        console.log("Using second item - email:", mcqData[1].candidate_email);
        
        return {
          name: mcqData[1].candidate_name || 'Candidate',
          email: mcqData[1].candidate_email || 'N/A'
        };
      }
    }
    return { email: 'N/A', name: 'Candidate' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/interviews"
            className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowBackIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MCQ Report</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Candidate Info Card */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <PersonIcon className="mr-2 text-primary-600" />
              {getCandidateInfo().name}
            </h2>
            <div className="flex items-center mb-4">
              <EmailIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-700 dark:text-gray-300">{getCandidateInfo().email}</span>
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Questions</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
                <div className="text-sm text-green-600 dark:text-green-400">Correct Answers</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.correct}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-700">
                <div className="text-sm text-red-600 dark:text-red-400">Incorrect Answers</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.incorrect}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="text-sm text-blue-600 dark:text-blue-400">Score Percentage</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.percentage}%</div>
              </div>
            </div>
          </div>

          {/* MCQ Questions and Answers */}
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <AssignmentIcon className="mr-2 text-primary-600" />
                MCQ Questions and Answers
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {mcqData.filter(item => item.question).length > 0 ? (
                mcqData.filter(item => item.question).map((item, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {item.question}
                        </h3>
                        
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Correct Answer:
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-green-800 dark:text-green-200 border border-green-100 dark:border-green-800">
                            {item.answer}
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Candidate's Answer:
                          </div>
                          <div className={`p-3 rounded-md border ${
                            item.is_correct 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-100 dark:border-green-800' 
                              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-100 dark:border-red-800'
                          }`}>
                            {item.candidate_answer || 'No answer provided'}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center">
                          {item.is_correct ? (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <CorrectIcon className="h-5 w-5 mr-1" />
                              <span>Correct</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600 dark:text-red-400">
                              <IncorrectIcon className="h-5 w-5 mr-1" />
                              <span>Incorrect</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No MCQ data available for this interview.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MCQReport;