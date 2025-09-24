import { useState, useEffect } from 'react';
import { 
  Description as DescriptionIcon,
  Lightbulb as AIIcon,
  Business as CompanyIcon,
  Refresh as RefreshIcon
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
      
      // Prepare data for AI generation
      const jobData = {
        company_description: formData.company_description,
        job_role: formData.job_title,
        location: formData.location,
        experience: formData.experience_level,
        qualifications: formData.qualifications,
        skills: formData.required_skills.join(', '),
        additional_context: aiContext
      };
      
      // Call the API to generate job description
      const response = await jobPostingService.generateJobDescription(jobData);
      
      // Update the job description in the form
      handleChange('job_description', response.job_description);
    } catch (err) {
      console.error('Error generating job description:', err);
      setError('Failed to generate job description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate job description when component mounts if AI generation is enabled
  useEffect(() => {
    if (formData.use_ai_generation && !formData.job_description && 
        formData.job_title && formData.company) {
      generateJobDescription();
    }
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
        <DescriptionIcon className="h-6 w-6 mr-2 text-primary-600" />
        <span className="text-gray-800 font-serif">Job Description</span>
      </h2>

      {/* AI Generation Toggle */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <AIIcon className="h-6 w-6 text-primary-600 mr-2" />
          <span className="text-gray-800 font-medium">Use AI to generate description</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={formData.use_ai_generation}
            onChange={handleToggleAI}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {formData.use_ai_generation && (
        <div className="card bg-primary-50 border border-primary-200 p-4 rounded-lg animate-fadeIn">
          <h3 className="text-lg font-semibold text-primary-800 flex items-center mb-3">
            <AIIcon className="h-5 w-5 mr-2 text-primary-600" />
            AI-Powered Job Description Generator
          </h3>
          <p className="text-sm text-primary-700 mb-4">
            Provide additional context about the company or role, and our AI will generate a comprehensive job description based on the information you've already provided.
          </p>
          
          {/* Additional Context for AI */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium text-primary-700">Additional Context (Optional)</span>
            </label>
            <textarea
              value={aiContext}
              onChange={handleAiContextChange}
              placeholder="Add any additional details about the company, team, or specific requirements for this role..."
              className="textarea textarea-bordered border-primary-200 bg-white h-24"
            ></textarea>
          </div>
          
          <button
            type="button"
            onClick={generateJobDescription}
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Generating...
              </>
            ) : (
              <>
                <RefreshIcon className="h-5 w-5 mr-2" />
                Generate with AI
              </>
            )}
          </button>
          
          {error && (
            <div className="mt-3 text-sm text-error">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Company Description */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700 flex items-center">
              <CompanyIcon className="h-5 w-5 mr-1 text-gray-500" />
              Company Description
            </span>
          </label>
          <textarea
            name="company_description"
            value={formData.company_description}
            onChange={handleCompanyDescriptionChange}
            placeholder="Describe your company, culture, and values..."
            className="textarea textarea-bordered h-32"
          ></textarea>
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
              <button className="btn btn-sm btn-ghost btn-square">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </button>
              <button className="btn btn-sm btn-ghost btn-square">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
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