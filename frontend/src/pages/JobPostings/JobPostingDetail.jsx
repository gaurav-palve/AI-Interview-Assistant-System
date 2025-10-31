import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import jobPostingService from '../../services/jobPostingService';
import { useAuth } from '../../contexts/AuthContext';

// Material UI Icons
import {
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  School as ExperienceIcon,
  Category as DepartmentIcon,
  Description as DescriptionIcon,
  AttachMoney as SalaryIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Publish as PublishIcon,
  ArrowBack as BackIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  Group as GroupIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

/**
 * JobPostingDetail component
 * Displays details of a job posting and allows resume screening
 */
function JobPostingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, sessionToken } = useAuth();
  const [jobPosting, setJobPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [tabAnimation, setTabAnimation] = useState(false);
  
  // Resume screening state
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [screeningResults, setScreeningResults] = useState([]);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [screeningError, setScreeningError] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [interviewDateTime, setInterviewDateTime] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [schedulingError, setSchedulingError] = useState(null);
  const [schedulingSuccess, setSchedulingSuccess] = useState(false);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [emailAttachments, setEmailAttachments] = useState([]);

  // Fetch job posting on component mount
  useEffect(() => {
    const fetchJobPosting = async () => {
      try {
        setLoading(true);
        const response = await jobPostingService.getJobPosting(id);
        console.log("Job posting response:", response); // Add logging to see the response
        // The backend returns the job posting directly, not wrapped in a job_posting field
        setJobPosting(response || {});
        setError(null);
      } catch (err) {
        console.error('Error fetching job posting:', err);
        setError('Failed to load job posting. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobPosting();
    
    // Fetch scheduled interviews if on interviews tab
    if (activeTab === 'interviews') {
      fetchScheduledInterviews();
    }
  }, [id, activeTab]);
  
  // Fetch scheduled interviews
  const fetchScheduledInterviews = async () => {
    try {
      const response = await fetch(`http://localhost:8000/interviews/job-posting/${id}`);
      
      if (!response.ok) {
        console.error('Failed to fetch scheduled interviews');
        return;
      }
      
      const data = await response.json();
      setScheduledInterviews(data.interviews || []);
    } catch (err) {
      console.error('Error fetching scheduled interviews:', err);
    }
  };

  // Handle resume file change
  const handleResumeFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  // Handle JD file change
  const handleJdFileChange = (e) => {
    setJdFile(e.target.files[0]);
  };

  // Handle resume screening
  const handleScreenResumes = async () => {
    if (!jdFile) {
      setScreeningError('Please upload a job description PDF file.');
      return;
    }
    
    if (!resumeFile) {
      setScreeningError('Please upload a zip file containing resumes.');
      return;
    }

    try {
      setScreeningLoading(true);
      setScreeningError(null);
      
      // Create FormData object
      const formData = new FormData();
      formData.append('zip_file', resumeFile);
      formData.append('jd_file', jdFile);
      
      // Use the axios instance with the correct baseURL
      const response = await fetch('http://localhost:8000/resume-screening', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to screen resumes: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setScreeningResults(data.results || []);
      setSelectedCandidates([]);
    } catch (err) {
      console.error('Error screening resumes:', err);
      setScreeningError('Failed to screen resumes. Please try again later.');
    } finally {
      setScreeningLoading(false);
    }
  };

  // Handle select all candidates
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCandidates(screeningResults.map(candidate => candidate.resume));
    } else {
      setSelectedCandidates([]);
    }
  };

  // Handle select individual candidate
  const handleSelectCandidate = (resume, isChecked) => {
    if (isChecked) {
      setSelectedCandidates([...selectedCandidates, resume]);
    } else {
      setSelectedCandidates(selectedCandidates.filter(r => r !== resume));
    }
  };

  // Handle email attachment file selection
  const handleEmailAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Validate file size (max 5MB per file)
      const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setSchedulingError(`Some attachments exceed the 5MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
        e.target.value = null;
        return;
      }
      
      // Add the files to the attachments array
      setEmailAttachments(prev => [...prev, ...files]);
      setSchedulingError(null);
    }
  };

  // Remove an attachment from the list
  const removeAttachment = (index) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle scheduling interviews for selected candidates
  const handleScheduleInterviews = async () => {
    if (selectedCandidates.length === 0) {
      setSchedulingError('Please select at least one candidate.');
      return;
    }

    if (!interviewDateTime) {
      setSchedulingError('Please select a date and time for the interviews.');
      return;
    }

    try {
      setSchedulingLoading(true);
      setSchedulingError(null);
      setSchedulingSuccess(false);
      
      // Get selected candidate details
      const selectedCandidateDetails = screeningResults.filter(
        candidate => selectedCandidates.includes(candidate.resume)
      );
      
      // Create interview data
      const interviewData = {
        job_posting_id: id,
        interview_datetime: interviewDateTime,
        candidates: selectedCandidateDetails.map(candidate => ({
          name: candidate.resume.replace('.pdf', ''),
          email: candidate.candidate_email || 'unknown@example.com',
          resume: candidate.resume
        })),
        job_description: jdFile ? jdFile.name : 'job_description.pdf',
        attachments: [] // Add this line
      };
      
      // Process attachments if any
      if (emailAttachments.length > 0) {
        // Convert attachments to base64
        const attachmentPromises = emailAttachments.map(async (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64content = reader.result.split(',')[1];
              resolve({
                filename: file.name,
                content: base64content,
                content_type: file.type
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
        
        // Wait for all attachments to be processed
        interviewData.attachments = await Promise.all(attachmentPromises);
      }
      
      // Call API to schedule interviews
      const url = new URL('http://localhost:8000/interviews/bulk-schedule');
      if (sessionToken) {
        url.searchParams.append('session_token', sessionToken);
      }
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to schedule interviews: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Clear selected candidates and set success message
      setSelectedCandidates([]);
      setSchedulingSuccess(true);
      
      // Switch to interviews tab and fetch updated interviews
      setActiveTab('interviews');
      fetchScheduledInterviews();
      
    } catch (err) {
      console.error('Error scheduling interviews:', err);
      setSchedulingError('Failed to schedule interviews. Please try again later.');
    } finally {
      setSchedulingLoading(false);
    }
  };

  // Generate company initial
  const getCompanyInitial = (company) => {
    return company ? company.charAt(0).toUpperCase() : 'C';
  };

  // Get random color for company avatar
  const getCompanyColor = (company) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    // Use company name to deterministically select a color
    const index = company ? company.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // Handle tab change with animation
  const handleTabChange = (tab) => {
    setTabAnimation(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTabAnimation(false);
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fadeIn">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-600 absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-500 animate-pulse">Loading job posting details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl animate-slideInUp">
          <div className="flex items-center">
            <CloseIcon className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Job Posting</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/job-postings')}
            className="mt-4 btn btn-outline btn-sm"
          >
            <BackIcon className="h-4 w-4 mr-1" />
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Gradient Background */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-purple-50 rounded-2xl p-8 shadow-sm animate-slideInDown">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate('/job-postings')}
            className="mr-4 p-2 rounded-lg hover:bg-white/50 transition-all duration-200 group"
          >
            <BackIcon className="h-5 w-5 text-gray-600 group-hover:text-primary-600 transition-colors" />
          </button>
          <span className="text-sm text-gray-500">Back to Job Postings</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center animate-slideInLeft">
            <div className={`
              flex-shrink-0 h-20 w-20 rounded-2xl ${getCompanyColor(jobPosting.company)} 
              text-white flex items-center justify-center font-bold text-3xl
              shadow-lg transform transition-all duration-300 hover:scale-110
              bg-gradient-to-br from-opacity-80 to-opacity-100
            `}>
              {getCompanyInitial(jobPosting.company)}
            </div>
            <div className="ml-6">
              <h1 className="text-4xl font-bold text-gray-900 font-serif tracking-tight">
                {jobPosting.job_posting_name || jobPosting.job_title || "Job Posting"}
              </h1>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <BusinessIcon className="h-4 w-4 mr-1" />
                  {jobPosting.company}
                </span>
                <span className="flex items-center">
                  <LocationIcon className="h-4 w-4 mr-1" />
                  {jobPosting.location}
                </span>
                <span className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Posted {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
         
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { icon: GroupIcon, label: 'Applicants', value: '0' },
            { icon: ViewIcon, label: 'Views', value: '0' },
            { icon: ScheduleIcon, label: 'Interviews', value: scheduledInterviews.length },
            { icon: StarIcon, label: 'Status', value: jobPosting.status || 'Active' },
          ].map((stat, index) => (
            <div 
              key={index}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-3 animate-slideInUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center space-x-3">
                <stat.icon className="h-5 w-5 text-primary-500" />
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 animate-slideInUp">
        <nav className="flex space-x-2">
          {[
            { id: 'details', label: 'Details', icon: DescriptionIcon },
            { id: 'screening', label: 'Resume Screening', icon: AssessmentIcon },
            { id: 'interviews', label: 'Interviews', icon: GroupIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium
                transition-all duration-300 transform
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              <span>{tab.label}</span>
              {tab.id === 'screening' && screeningResults.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20">
                  {screeningResults.length}
                </span>
              )}
              {tab.id === 'interviews' && scheduledInterviews.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20">
                  {scheduledInterviews.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content with Animation */}
      <div className={`tab-content transition-all duration-300 ${tabAnimation ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
        {activeTab === 'details' && (
          <div className="space-y-8">
            {/* Job Details */}
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                  <WorkIcon className="h-6 w-6 mr-2 text-primary-600" />
                  <span className="text-gray-800 font-serif">Job Details</span>
                </h2>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-700">
                      <WorkIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Job Type:</span>
                      <span>{jobPosting.job_type}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <LocationIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Location:</span>
                      <span>{jobPosting.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <ExperienceIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Experience Level:</span>
                      <span>{jobPosting.experience_level}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <DepartmentIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Department:</span>
                      <span>{jobPosting.department}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobPosting.required_skills && jobPosting.required_skills.map((skill, index) => (
                      <span key={index} className="badge badge-primary badge-lg py-3">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Job Description */}
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                  <DescriptionIcon className="h-6 w-6 mr-2 text-primary-600" />
                  <span className="text-gray-800 font-serif">Job Description</span>
                </h2>
                
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: jobPosting.job_description }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'screening' && (
          <div className="space-y-8">
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                  <AssignmentIcon className="h-6 w-6 mr-2 text-primary-600" />
                  <span className="text-gray-800 font-serif">Resume Screening</span>
                </h2>
                
                <p className="text-gray-700 mb-6">
                  Upload a job description PDF and a zip file containing candidate resumes to screen them against this job posting.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* JD Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Job Description (PDF)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <DescriptionIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="jd-file" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Upload a file</span>
                            <input
                              id="jd-file"
                              name="jd-file"
                              type="file"
                              accept=".pdf"
                              className="sr-only"
                              onChange={handleJdFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF file containing job description
                        </p>
                      </div>
                    </div>
                    {jdFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected file: {jdFile.name}
                      </p>
                    )}
                  </div>
                  
                  {/* Resumes Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Resumes (ZIP file)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="resume-file" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Upload a file</span>
                            <input
                              id="resume-file"
                              name="resume-file"
                              type="file"
                              accept=".zip"
                              className="sr-only"
                              onChange={handleResumeFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          ZIP file containing PDF resumes
                        </p>
                      </div>
                    </div>
                    {resumeFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected file: {resumeFile.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleScreenResumes}
                    disabled={!jdFile || !resumeFile || screeningLoading}
                    className="btn btn-primary w-full md:w-auto"
                  >
                    {screeningLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Screening...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-5 w-5 mr-2" />
                        Screen Resumes
                      </>
                    )}
                  </button>
                </div>
                
                {screeningError && (
                  <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-md mb-6 mt-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-danger-700">{screeningError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Email Attachments */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Email Attachments (Optional)
  </label>
  <div className="mt-1 flex justify-center px-6 pt-3 pb-3 border-2 border-gray-300 border-dashed rounded-md">
    <div className="space-y-1 text-center">
      <div className="flex flex-col items-center">
        <EmailIcon className="mx-auto h-8 w-8 text-gray-400" />
        <div className="flex text-sm text-gray-600">
          <label
            htmlFor="attachment-upload"
            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
          >
            <span>Upload attachments</span>
            <input
              id="attachment-upload"
              name="attachment-upload"
              type="file"
              className="sr-only"
              multiple
              onChange={handleEmailAttachmentChange}
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">
          Any file type up to 5MB each
        </p>
      </div>
    </div>
  </div>
  
  {/* Attachment List */}
  {emailAttachments.length > 0 && (
    <div className="mt-2">
      <p className="text-sm font-medium text-gray-700 mb-1">Selected Attachments:</p>
      <ul className="border rounded-md divide-y">
        {emailAttachments.map((file, index) => (
          <li key={index} className="pl-3 pr-4 py-2 flex items-center justify-between text-sm">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex-1 w-0 truncate">{file.name}</span>
              <span className="ml-2 flex-shrink-0 text-gray-400">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="font-medium text-red-600 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>

                {/* Schedule Interviews Section */}
                {selectedCandidates.length > 0 && (
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Schedule Interviews for Selected Candidates</h4>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date and Time
                      </label>
                      <input
                        type="datetime-local"
                        value={interviewDateTime}
                        onChange={(e) => setInterviewDateTime(e.target.value)}
                        className="input input-bordered w-full"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    
                    {/* Email Attachments */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Attachments (Optional)
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-3 pb-3 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <div className="flex flex-col items-center">
                            <EmailIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="attachment-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                              >
                                <span>Upload attachments</span>
                                <input
                                  id="attachment-upload"
                                  name="attachment-upload"
                                  type="file"
                                  className="sr-only"
                                  multiple
                                  onChange={handleEmailAttachmentChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              Any file type up to 5MB each
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Attachment List */}
                      {emailAttachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Selected Attachments:</p>
                          <ul className="border rounded-md divide-y">
                            {emailAttachments.map((file, index) => (
                              <li key={index} className="pl-3 pr-4 py-2 flex items-center justify-between text-sm">
                                <div className="w-0 flex-1 flex items-center">
                                  <span className="flex-1 w-0 truncate">{file.name}</span>
                                  <span className="ml-2 flex-shrink-0 text-gray-400">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="font-medium text-red-600 hover:text-red-500"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleScheduleInterviews}
                        disabled={!interviewDateTime || schedulingLoading}
                        className="btn btn-primary"
                      >
                        {schedulingLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Scheduling...
                          </>
                        ) : (
                          <>
                            Schedule Interviews ({selectedCandidates.length})
                          </>
                        )}
                      </button>
                    </div>
                    
                    {schedulingError && (
                      <div className="mt-4 bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-md">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-danger-700">{schedulingError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {schedulingSuccess && (
                      <div className="mt-4 bg-success-50 border-l-4 border-success-500 p-4 rounded-r-md">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-success-700">
                              Interviews scheduled successfully! Candidates will receive confirmation emails.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Screening Results */}
                {screeningResults.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Screening Results</h3>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={selectedCandidates.length === screeningResults.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="select-all" className="ml-2 text-sm text-gray-700">
                          Select All Candidates
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {screeningResults.map((candidate, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={selectedCandidates.includes(candidate.resume)}
                                onChange={(e) => handleSelectCandidate(candidate.resume, e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 flex-grow">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                    <PersonIcon className="h-5 w-5 mr-2 text-gray-500" />
                                    {candidate.resume}
                                  </h4>
                                  {candidate.candidate_email && (
                                    <p className="text-sm text-gray-600 ml-7">{candidate.candidate_email}</p>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <StarIcon className="h-5 w-5 text-yellow-500 mr-1" />
                                  <span className="font-semibold">{candidate.ATS_Score}/100</span>
                                </div>
                              </div>
                              
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                                    <StarIcon className="h-4 w-4 mr-1 text-green-500" />
                                    Strengths
                                  </h5>
                                  <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                                    {candidate.Strengths.map((strength, i) => (
                                      <li key={i}>{strength}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                                    <WarningIcon className="h-4 w-4 mr-1 text-orange-500" />
                                    Weaknesses
                                  </h5>
                                  <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                                    {candidate.Weaknesses.map((weakness, i) => (
                                      <li key={i}>{weakness}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'interviews' && (
          <div className="card bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                <PersonIcon className="h-6 w-6 mr-2 text-primary-600" />
                <span className="text-gray-800 font-serif">Scheduled Interviews</span>
              </h2>
              
              {scheduledInterviews.length === 0 ? (
                <p className="text-gray-700">
                  No interviews scheduled yet. Select candidates from the Resume Screening tab to schedule interviews.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interview Link
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scheduledInterviews.map((interview, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{interview.candidate_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{interview.candidate_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(interview.scheduled_datetime).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {interview.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                            <a href={interview.interview_link} target="_blank" rel="noopener noreferrer">
                              Open Interview
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobPostingDetail;
