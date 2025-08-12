import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import interviewService from '../services/interviewService';

// Material UI Icons
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Description as FileIcon,
  Work as JobIcon,
  Person as PersonIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

/**
 * FileUpload page component
 * Allows uploading resume and job description files for a candidate
 */
function FileUpload() {
  const [candidateEmail, setCandidateEmail] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);
  const resumeInputRef = useRef(null);
  const jdInputRef = useRef(null);
  const navigate = useNavigate();
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
   * Handle resume file selection
   * @param {Event} e - Change event
   */
  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
        setError('Resume must be a PDF or DOCX file');
        setResumeFile(null);
        e.target.value = null;
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume file size must be less than 5MB');
        setResumeFile(null);
        e.target.value = null;
        return;
      }
      
      setResumeFile(file);
      setError(null);
    }
  };

  /**
   * Handle job description file selection
   * @param {Event} e - Change event
   */
  const handleJdChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
        setError('Job description must be a PDF or DOCX file');
        setJdFile(null);
        e.target.value = null;
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Job description file size must be less than 5MB');
        setJdFile(null);
        e.target.value = null;
        return;
      }
      
      setJdFile(file);
      setError(null);
    }
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!candidateEmail) {
      setError('Candidate email is required');
      return;
    }
    
    if (!resumeFile) {
      setError('Resume file is required');
      return;
    }
    
    if (!jdFile) {
      setError('Job description file is required');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Upload files
      await interviewService.uploadFiles(candidateEmail, jdFile, resumeFile);
      
      // Set success state
      setUploadSuccess(true);
      
      // Clear form
      setResumeFile(null);
      setJdFile(null);
      
      // Reset file inputs
      if (resumeInputRef.current) resumeInputRef.current.value = null;
      if (jdInputRef.current) jdInputRef.current.value = null;
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.detail || 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Navigate to MCQ generation page
   */
  const handleGenerateMCQs = () => {
    navigate(`/mcq?email=${encodeURIComponent(candidateEmail)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Files</h1>
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

      {uploadSuccess && (
        <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700 dark:text-green-400">
                Files uploaded successfully! You can now generate MCQs for this candidate.
              </p>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleGenerateMCQs}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Generate MCQs
                  <ArrowIcon className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Candidate Email */}
            <div>
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
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter the email of the candidate for whom you're uploading files
              </p>
            </div>

            {/* Resume Upload */}
            <div>
              <label htmlFor="resume" className="form-label">
                <FileIcon className="h-5 w-5 mr-1 text-gray-500 inline-block" />
                Resume
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                <div className="space-y-1 text-center">
                  <div className="flex flex-col items-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="resume-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload resume</span>
                        <input
                          id="resume-upload"
                          name="resume-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.docx"
                          onChange={handleResumeChange}
                          ref={resumeInputRef}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF or DOCX up to 5MB
                    </p>
                  </div>
                  {resumeFile && (
                    <div className="mt-2 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                      <FileIcon className="h-5 w-5 mr-1 text-gray-500" />
                      <span className="text-gray-900 dark:text-white font-medium">{resumeFile.name}</span>
                      <span className="ml-2 text-gray-500">({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description Upload */}
            <div>
              <label htmlFor="jd" className="form-label">
                <JobIcon className="h-5 w-5 mr-1 text-gray-500 inline-block" />
                Job Description
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                <div className="space-y-1 text-center">
                  <div className="flex flex-col items-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="jd-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload job description</span>
                        <input
                          id="jd-upload"
                          name="jd-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.docx"
                          onChange={handleJdChange}
                          ref={jdInputRef}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF or DOCX up to 5MB
                    </p>
                  </div>
                  {jdFile && (
                    <div className="mt-2 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                      <FileIcon className="h-5 w-5 mr-1 text-gray-500" />
                      <span className="text-gray-900 dark:text-white font-medium">{jdFile.name}</span>
                      <span className="ml-2 text-gray-500">({(jdFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading || !candidateEmail || !resumeFile || !jdFile}
              className="btn btn-primary"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <UploadIcon className="h-5 w-5 mr-1" />
                  Upload Files
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FileUpload;