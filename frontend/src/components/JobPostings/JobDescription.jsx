import { useState, useEffect } from 'react';
import {
  ContentCopy as CopyIcon,
  RefreshOutlined as RefreshIcon,
} from '@mui/icons-material';
import jobPostingService from '../../services/jobPostingService';

/**
 * JobDescription component
 * Step 3 of the job posting creation form
 * Includes AI-powered job description generator
 */
function JobDescription({ formData, handleChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiContext, setAiContext] = useState('');
  const [showAISuccess, setShowAISuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animated JD lines
  const [animatedLines, setAnimatedLines] = useState([]);

  const handleAiContextChange = (e) => {
    setAiContext(e.target.value);
  };

  // Line-by-line typing effect
  const typeTextLineByLine = (text, callback, speed = 300) => {
    const lines = text.split('\n').filter(Boolean);
    let index = 0;
    callback([]);

    const interval = setInterval(() => {
      callback((prev) => [...prev, lines[index]]);
      index++;
      if (index >= lines.length) clearInterval(interval);
    }, speed);
  };

  // Copy JD
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formData.job_description || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate JD
  const generateJobDescription = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowAISuccess(false);
      setAnimatedLines([]);

      const jobData = {
        job_title: formData.job_title,
        company: formData.company,
        job_type: formData.job_type,
        work_location: formData.work_location,
        required_skills: Array.isArray(formData.required_skills)
          ? formData.required_skills.join(', ')
          : '',
        experience_level: Array.isArray(formData.requirements)
          ? formData.requirements.join(', ')
          : '',
        responsibilities: Array.isArray(formData.responsibilities)
          ? formData.responsibilities.join('\n')
          : '',
        qualifications: formData.qualifications || '',
        job_description: formData.job_description || '',
        additional_context: aiContext
      };

      const response = await jobPostingService.generateJobDescription(jobData);

      handleChange('job_description', response.job_description);

      // Animate line-by-line
      typeTextLineByLine(response.job_description, setAnimatedLines);

      setShowAISuccess(true);
    } catch (err) {
      console.error('Error generating job description:', err);
      setError('Access Denied.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on load
  useEffect(() => {
    if (
      formData.use_ai_generation &&
      formData.job_title &&
      formData.company &&
      !formData.job_description
    ) {
      generateJobDescription();
    }
  }, []);

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-6 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Job Description
        </h2>

        <div className="flex gap-2 items-center">
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            onClick={copyToClipboard}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            <CopyIcon className="w-5 h-5" />
          </button>

          <button
            className="px-3 py-1 text-xs border rounded"
            onClick={() => handleChange('currentStep', 1)}
          >
            ← Back
          </button>

          <button
            className="px-3 py-1 text-xs border rounded"
            onClick={() =>
              handleChange('use_ai_generation', !formData.use_ai_generation)
            }
          >
            ✎ Edit
          </button>
        </div>
      </div>

      {/* Preview Box (same size, no labels, no dummy text) */}
      <div className="border border-gray-300 rounded-lg p-6 mx-6 mb-4 h-[320px]">
        <div className="h-full overflow-y-auto">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-500 italic animate-pulse">
                Generating job description...
              </p>
            </div>
          )}

          {!loading && animatedLines.length > 0 && (
            <div className="space-y-3 text-sm text-gray-800 whitespace-pre-wrap">
              {animatedLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Input */}
      <div className="px-6 pb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add additional context for AI"
            className="flex-1 px-4 py-2 border rounded text-sm"
            value={aiContext}
            onChange={handleAiContextChange}
            disabled={loading}
          />

          <button
            onClick={generateJobDescription}
            disabled={loading}
            className="px-6 py-2 bg-gray-700 text-white rounded disabled:bg-gray-400 flex items-center gap-2"
          >
            <RefreshIcon
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Generate
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {showAISuccess && (
          <div className="mt-3 p-3 bg-green-50 border text-green-700 text-sm rounded">
            ✓ Job description generated successfully!
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDescription;
