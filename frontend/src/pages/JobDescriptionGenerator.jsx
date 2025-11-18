import { useState, useEffect } from 'react';
import jobDescriptionService from '../services/jobDescriptionService';
import { 
  Description as DescriptionIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Code as CodeIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

function JobDescriptionGenerator() {
  // Form state
  const [companyDescription, setCompanyDescription] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [skills, setSkills] = useState('');
  // Generated JD state
  const [generatedJD, setGeneratedJD] = useState('');
  const [showGeneratedJD, setShowGeneratedJD] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  
  // Saved JDs state
  const [savedJDs, setSavedJDs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Load saved JDs on component mount
  useEffect(() => {
    loadSavedJDs();
  }, []);
  
  // Load saved JDs from the database
  const loadSavedJDs = async () => {
    setIsLoading(true);
    try {
      const jds = await jobDescriptionService.getJobDescriptions();
      setSavedJDs(jds);
    } catch (err) {
      setError('Failed to load saved job descriptions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate job description
  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const requirements = {
        company_description: companyDescription,
        job_role: jobRole,
        location: location,
        experience: experience,
        qualifications: qualifications,
        skills: skills
      };
      
      // const response = await jobDescriptionService.generateJobDescription(requirements);
      setGeneratedJD(response.job_description);
      setShowGeneratedJD(true);
      setSuccess('Job description generated successfully!');
    } catch (err) {
      setError(err.detail || 'Failed to generate job description');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Save job description
  const handleSave = async () => {
    if (!generatedJD) {
      setError('Please generate a job description first');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const requirements = {
        company_description: companyDescription,
        job_role: jobRole,
        location: location,
        experience: experience,
        qualifications: qualifications,
        skills: skills,
        generated_description: generatedJD
      };
      
      await jobDescriptionService.saveJobDescription(requirements);
      setSuccess('Job description saved successfully!');
      
      // Hide the generated JD component after saving
      setShowGeneratedJD(false);
      
      // Reload saved JDs
      await loadSavedJDs();
    } catch (err) {
      setError(err.detail || 'Failed to save job description');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete job description
  const handleDelete = async (id) => {
    try {
      await jobDescriptionService.deleteJobDescription(id);
      
      // Reload saved JDs
      await loadSavedJDs();
      
      setSuccess('Job description deleted successfully!');
    } catch (err) {
      setError(err.detail || 'Failed to delete job description');
      console.error(err);
    }
  };
  
  // Copy job description to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Reset form
  const handleReset = () => {
    setCompanyDescription('');
    setJobRole('');
    setLocation('');
    setExperience('');
    setQualifications('');
    setSkills('');
    setGeneratedJD('');
    setShowGeneratedJD(false);
    setError(null);
    setSuccess(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <DescriptionIcon className="mr-2 text-primary-600" />
          Job Description Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Generate professional job descriptions by providing company and role details. Save and manage your job descriptions for future use.
        </p>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
            <ErrorIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{typeof error === 'string' ? error : 'An error occurred while processing your request'}</p>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mt-4 mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
            <CheckIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}
        
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Company Description */}
          <div>
            <label htmlFor="company_description" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <BusinessIcon className="h-4 w-4 mr-1" />
              Company Description
            </label>
            <textarea
              id="company_description"
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows="3"
              placeholder="Describe your company, its mission, and culture"
              required
            />
          </div>
          
          {/* Job Role */}
          <div>
            <label htmlFor="job_role" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <WorkIcon className="h-4 w-4 mr-1" />
              Job Role
            </label>
            <input
              type="text"
              id="job_role"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Senior Software Engineer, Product Manager"
              required
            />
          </div>
          
          {/* Job Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <WorkIcon className="h-4 w-4 mr-1" />
              Job Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., New York, NY; Remote; Hybrid - London"
              required
            />
          </div>
          
          {/* Experience */}
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <WorkIcon className="h-4 w-4 mr-1" />
              Required Experience
            </label>
            <textarea
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows="2"
              placeholder="e.g., 3+ years of experience in software development"
              required
            />
          </div>
          
          {/* Qualifications */}
          <div>
            <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <SchoolIcon className="h-4 w-4 mr-1" />
              Required Qualifications
            </label>
            <textarea
              id="qualifications"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows="2"
              placeholder="e.g., Bachelor's degree in Computer Science or related field"
              required
            />
          </div>
          
          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <CodeIcon className="h-4 w-4 mr-1" />
              Required Skills
            </label>
            <textarea
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows="2"
              placeholder="e.g., JavaScript, React, Node.js, SQL"
              required
            />
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <RefreshIcon className="h-4 w-4 mr-2" />
              Reset
            </button>
            
            <button
              type="submit"
              disabled={isGenerating}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <DescriptionIcon className="h-4 w-4 mr-2" />
                  Generate Job Description
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Generated JD Section */}
      {generatedJD && showGeneratedJD && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Generated Job Description</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleCopy(generatedJD)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ContentCopyIcon className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </button>
              
              {/* Close button */}
              <button
                onClick={() => setShowGeneratedJD(false)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ml-2"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
            {generatedJD}
          </div>
        </div>
      )}
      
      {/* Saved JDs Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Saved Job Descriptions</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : savedJDs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No saved job descriptions yet. Generate and save your first job description!
          </div>
        ) : (
          <div className="space-y-4">
            {savedJDs.map((jd) => (
              <div key={jd.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{jd.job_role}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopy(jd.generated_description)}
                      className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ContentCopyIcon className="h-3 w-3 mr-1" />
                      Copy
                    </button>
                    
                    <button
                      onClick={() => handleDelete(jd.id)}
                      className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <DeleteIcon className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-2">
                  Created: {new Date(jd.created_at).toLocaleString()}
                </p>
                
                <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {jd.generated_description.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDescriptionGenerator;