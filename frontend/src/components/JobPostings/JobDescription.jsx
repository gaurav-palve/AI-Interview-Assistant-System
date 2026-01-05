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

  // Handle AI context change
  const handleAiContextChange = (e) => {
    setAiContext(e.target.value);
  };

  // Copy job description to clipboard
  const copyToClipboard = async () => {
    try {
      const textToCopy = `${formData.job_title || 'UI/UX Designer (Senior) – B2B SaaS Products'}

Experience:
${formData.experience_level || '4+ years of relevant UI/UX design experience'}

Location:
${formData.work_location ? `${formData.work_location}${formData.location ? ' / ' + formData.location : ''}` : 'Hybrid / Onsite / Remote (as applicable)'}

About the Role:
${formData.job_description || `We are looking for a Senior UI/UX Designer to design intuitive, scalable, and high-impact user experiences for our B2B SaaS platform in the Talent Acquisition / HR Tech space. The role involves working on complex workflows, data-heavy dashboards, and enterprise user journeys while balancing usability, aesthetics, and business goals.\n\nYou will collaborate closely with Product Managers, Engineering, and Business stakeholders to translate requirements into meaningful user experiences.`}

Key Responsibilities:
${formData.responsibilities && Array.isArray(formData.responsibilities) && formData.responsibilities.length > 0
        ? formData.responsibilities.map((r) => `• ${r}`).join('\n')
        : `• Own end-to-end UX design for product modules—from discovery to delivery
• Conduct user research, stakeholder interviews, and usability testing
• Translate complex business requirements into simple, intuitive user flows
• Create wireframes, user journeys, information architecture, and prototypes
• Design high-fidelity UI aligned with brand and design system guidelines`}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
      setAiContext('');
    } catch (err) {
      console.error('Error generating job description:', err);
      setError('Access Denied.');
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
    <div className="bg-white rounded-lg">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 px-6 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
        <div className="flex gap-2 items-center">
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            onClick={copyToClipboard}
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            <CopyIcon className="w-5 h-5" />
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            onClick={() => handleChange('currentStep', 1)}
          >
            ← Back
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            onClick={() => handleChange('use_ai_generation', !formData.use_ai_generation)}
          >
            ✎ Edit
          </button>
        </div>
      </div>

      {/* Job Description Preview Box */}
      <div className="border border-gray-300 rounded-lg p-6 mx-6 mb-4 bg-white">
        {/* Job Title Section */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-1">Job Title</h3>
          <p className="text-sm text-gray-900 font-medium">
            {formData.job_title || 'UI/UX Designer (Senior) – B2B SaaS Products'}
          </p>
        </div>

        {/* Experience Section */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-1">Experience</h3>
          <p className="text-sm text-gray-900">
            {formData.experience_level || '4+ years of relevant UI/UX design experience'}
          </p>
        </div>

        {/* Location Section */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-1">Location</h3>
          <p className="text-sm text-gray-900">
            {formData.work_location
              ? `${formData.work_location}${formData.location ? ' / ' + formData.location : ''}`
              : 'Hybrid / Onsite / Remote (as applicable)'}
          </p>
        </div>

        {/* About the Role Section */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">About the Role</h3>
          <p className="text-sm text-gray-800 leading-relaxed">
            {formData.job_description ||
              `We are looking for a Senior UI/UX Designer to design intuitive, scalable, and high-impact user experiences for our B2B SaaS platform in the Talent Acquisition / HR Tech space. The role involves working on complex workflows, data-heavy dashboards, and enterprise user journeys while balancing usability, aesthetics, and business goals.

You will collaborate closely with Product Managers, Engineering, and Business stakeholders to translate requirements into meaningful user experiences.`}
          </p>
        </div>

        {/* Key Responsibilities Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Key Responsibilities</h3>
          <ul className="space-y-1 text-sm text-gray-800">
            {formData.responsibilities && Array.isArray(formData.responsibilities) && formData.responsibilities.length > 0 ? (
              formData.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-3 text-gray-600">•</span>
                  <span>{responsibility}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-start">
                  <span className="mr-3 text-gray-600">•</span>
                  <span>Own end-to-end UX design for product modules—from discovery to delivery</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-gray-600">•</span>
                  <span>Conduct user research, stakeholder interviews, and usability testing</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-gray-600">•</span>
                  <span>Translate complex business requirements into simple, intuitive user flows</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-gray-600">•</span>
                  <span>Create wireframes, user journeys, information architecture, and prototypes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-gray-600">•</span>
                  <span>Design high-fidelity UI aligned with brand and design system guidelines</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* AI Generation Input Section */}
      <div className="px-6 pb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Add we are fast growing startup focusing on AI solutions"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            value={aiContext}
            onChange={handleAiContextChange}
            disabled={loading}
          />
          <button
            className="px-6 py-2 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={generateJobDescription}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshIcon className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                <RefreshIcon className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {showAISuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
            ✓ Job description generated successfully!
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDescription;