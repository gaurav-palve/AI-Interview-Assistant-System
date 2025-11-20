import { useState, useEffect } from 'react';
import {
  Description as DescriptionIcon,
  Lightbulb as AIIcon,
  Business as CompanyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as AlertIcon,
  Info as InfoIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import jobPostingService from '../../services/jobPostingService';

/**
 * JobDescription component
 * Fourth step of the job posting creation form
 * Includes AI-powered job description generator
 */
function JobDescription({ formData, handleChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiContext, setAiContext] = useState('');
  const [showAISuccess, setShowAISuccess] = useState(false);

  // Toggle AI generation
  const handleToggleAI = () => {
    handleChange('use_ai_generation', !formData.use_ai_generation);
  };

  // Handle company description change
  const handleCompanyDescriptionChange = (e) => {
    handleChange('company_description', e.target.value);
  };

  // Handle job description change
  const handleJobDescriptionChange = (e) => {
    handleChange('job_description', e.target.value);
  };

  // Handle AI context change
  const handleAiContextChange = (e) => {
    setAiContext(e.target.value);
  };

  // Generate job description using AI
  const generateJobDescription = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowAISuccess(false);

      const extractExperienceFromRequirements = () => {
        if (!Array.isArray(formData.requirements) || formData.requirements.length === 0) {
          return '';
        }
        return formData.requirements.join(', ');
      };

      const jobData = {
        job_title: formData.job_title,
        company: formData.company,
        job_type: formData.job_type,
        work_location: formData.work_location,
        required_skills: Array.isArray(formData.required_skills)
          ? formData.required_skills.join(', ')
          : '',
        experience_level: extractExperienceFromRequirements(),
        responsibilities:
          typeof formData.responsibilities === 'string'
            ? formData.responsibilities
            : Array.isArray(formData.responsibilities)
            ? formData.responsibilities.join('\n')
            : '',
        qualifications: formData.qualifications || '',
        job_description: formData.job_description || '',
        additional_context: aiContext
      };

      const response = await jobPostingService.generateJobDescription(jobData);
      handleChange('job_description', response.job_description);
      setShowAISuccess(true);
    } catch (err) {
      console.error('Error generating job description:', err);
      setError('Failed to generate job description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate job description when component mounts if AI generation is enabled
  useEffect(() => {
    if (
      formData.use_ai_generation &&
      !formData.job_description &&
      formData.job_title &&
      formData.company
    ) {
      generateJobDescription();
    }
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
        <DescriptionIcon className="h-6 w-6 mr-2 text-primary-600" />
        <span className="text-gray-800 font-serif">Job Description</span>
      </h2>

      {/* Toggle Switch */}
      <button
        onClick={handleToggleAI}
        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
          formData.use_ai_generation ? 'bg-white shadow-lg' : 'bg-white/30'
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300 ${
            formData.use_ai_generation
              ? 'translate-x-6 bg-gradient-to-r from-indigo-500 to-purple-600'
              : 'translate-x-0 bg-white'
          }`}
        ></div>
      </button>

      {/* AI Controls - Expandable */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          formData.use_ai_generation
            ? 'max-h-96 opacity-100'
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-6 space-y-4 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex items-start gap-2 text-sm text-indigo-900 bg-white/60 backdrop-blur-sm rounded-lg p-3">
            <InfoIcon className="w-4 h-4 mt-0.5 text-indigo-600 flex-shrink-0" />
            <p>
              Provide additional context to help AI generate a tailored job description based on your
              requirements.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={aiContext}
              onChange={handleAiContextChange}
              placeholder="e.g., We're a fast-growing startup focusing on AI solutions..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              rows="3"
            />
          </div>

          <button
            onClick={generateJobDescription}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating with AI...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Description
              </>
            )}
          </button>

          {showAISuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 ">
              <CheckIcon className="w-2 h-4" />
              Description generated successfully!
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertIcon className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Company Description */}
        <div className="form-control">
         
          
        </div>

        {/* Job Description */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700 flex items-center">
              <DescriptionIcon className="h-5 w-5 mr-1 text-gray-500" />
              Job Description
            </span>
          </label>
          <div className="border rounded-lg overflow-hidden">
            {/* Rich Text Editor Toolbar (simplified for this example) */}
            <div className="flex items-center bg-gray-50 border-b p-2 space-x-2">
              <select className="select select-sm select-bordered">
                <option>Normal</option>
                <option>Heading 1</option>
                <option>Heading 2</option>
                <option>Heading 3</option>
              </select>
              <div className="border-r h-6 mx-1"></div>
              <button className="btn btn-sm btn-ghost btn-square">•••</button>
              <button className="btn btn-sm btn-ghost btn-square">♥</button>
            </div>
            {/* Text Area for Job Description */}
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleJobDescriptionChange}
              placeholder="Enter a detailed job description..."
              className="textarea border-0 rounded-none h-64 w-full"
            ></textarea>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Provide a comprehensive description of the job role, responsibilities, and what a typical day looks like.
          </p>
        </div>
      </div>
    </div>
  );
}

export default JobDescription;