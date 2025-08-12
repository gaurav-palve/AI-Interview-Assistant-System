import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import interviewService from '../services/interviewService';

// Material UI Icons
import {
  QuestionAnswer as MCQIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon
} from '@mui/icons-material';

/**
 * MCQGeneration page component
 * Generates and displays MCQs based on resume and job description
 */
function MCQGeneration() {
  const [candidateEmail, setCandidateEmail] = useState('');
  const [mcqs, setMcqs] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  // Extract candidate email from query parameters if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    if (email) {
      setCandidateEmail(email);
    }
  }, [location]);

  /**
   * Generate MCQs for the candidate
   */
  const handleGenerateMCQs = async () => {
    if (!candidateEmail) {
      setError('Candidate email is required');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setMcqs('');

    try {
      const response = await interviewService.generateMCQs(candidateEmail);
      setMcqs(response);
    } catch (err) {
      console.error('Error generating MCQs:', err);
      setError(err.detail || 'Failed to generate MCQs. Please ensure resume and job description are uploaded for this candidate.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copy MCQs to clipboard
   */
  const handleCopyMCQs = () => {
    navigator.clipboard.writeText(mcqs).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  /**
   * Download MCQs as a text file
   */
  const handleDownloadMCQs = () => {
    const element = document.createElement('a');
    const file = new Blob([mcqs], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `mcqs_${candidateEmail.replace('@', '_at_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  /**
   * Format MCQs for display with syntax highlighting
   */
  const formatMCQs = (text) => {
    if (!text) return '';

    // Split by lines
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      // Question line (starts with a number followed by a period)
      if (/^\d+\./.test(line)) {
        return (
          <div key={index} className="font-bold text-gray-900 dark:text-white mt-4 mb-2">
            {line}
          </div>
        );
      }
      // Options (starts with a letter followed by a parenthesis or period)
      else if (/^[a-d][\)\.]/.test(line.toLowerCase())) {
        return (
          <div key={index} className="pl-4 text-gray-700 dark:text-gray-300">
            {line}
          </div>
        );
      }
      // Answer line
      else if (/^answer:/i.test(line)) {
        return (
          <div key={index} className="pl-4 text-green-600 dark:text-green-400 font-medium mt-1 mb-4">
            {line}
          </div>
        );
      }
      // Other lines
      else {
        return <div key={index} className="text-gray-700 dark:text-gray-300">{line}</div>;
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generate MCQs</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4">
          <div className="flex">
            <ErrorIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label htmlFor="candidate_email" className="form-label">
                <PersonIcon className="h-5 w-5 mr-1 text-gray-500 inline-block" />
                Candidate Email
              </label>
              <input
                type="email"
                id="candidate_email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="Enter candidate email"
                className="form-input"
                required
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleGenerateMCQs}
                disabled={isGenerating || !candidateEmail}
                className="btn btn-primary w-full md:w-auto"
              >
                {isGenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <MCQIcon className="h-5 w-5 mr-1" />
                    Generate MCQs
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4">
            <div className="flex">
              <InfoIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Make sure you've uploaded both the resume and job description for this candidate before generating MCQs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MCQ Results */}
      {mcqs && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <MCQIcon className="h-5 w-5 mr-2 text-primary-600" />
              Generated MCQs
            </h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleCopyMCQs}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <CopyIcon className="h-4 w-4 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleDownloadMCQs}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <DownloadIcon className="h-4 w-4 mr-1" />
                Download
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[600px]">
            <div className="font-mono text-sm whitespace-pre-wrap">
              {formatMCQs(mcqs)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MCQGeneration;