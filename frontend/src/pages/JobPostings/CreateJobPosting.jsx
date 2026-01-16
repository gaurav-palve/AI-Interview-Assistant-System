import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import jobPostingService from '../../services/jobPostingService';
import { useRef } from 'react';


// Material UI Icons
import {
  Work as WorkIcon,
  Assignment as RequirementsIcon,
  Description as DescriptionIcon,
  ArrowForward as NextIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  ArrowBack as BackIcon
  
} from '@mui/icons-material';

// Form Steps Components
import BasicInformation from '../../components/JobPostings/BasicInformation';
import RequirementsResponsibilities from '../../components/JobPostings/RequirementsResponsibilities';
import JobDescription from '../../components/JobPostings/JobDescription';

/**
 * CreateJobPosting component
 * Multi-step form for creating a new job posting
 */
function CreateJobPosting() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    job_title: '',
    company: '',
    job_type: 'Full Time',
    work_location: 'On Site',
    location: '',
    experience_level: '',
    experience: { type: 'fixed', value: '' }, // New field for experience dropdown
    department: '',
    required_skills: [],
    requirements: [],
    responsibilities: [],
    qualifications: '',
    company_description: '',
    job_description: '',
    use_ai_generation: true,
    additional_context: '',
    status: 'draft'
  });

  // Steps configuration
  const steps = [
    {
      id: 1,
      title: 'Basic Details',
      icon: <WorkIcon />,
      component: BasicInformation
    },
    {
      id: 2,
      title: 'Requirements & Responsibilities',
      icon: <RequirementsIcon />,
      component: RequirementsResponsibilities
    },
    {
      id: 3,
      title: 'Job Description',
      icon: <DescriptionIcon />,
      component: JobDescription
    }
  ];

  // Handlers
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Helpers
  const formatExperience = () => {
    if (!formData.experience || !formData.experience.type) {
      return 'N/A';
    }
    
    if (formData.experience.type === 'fixed') {
      return formData.experience.value ? `${formData.experience.value} years` : 'N/A';
    } else if (formData.experience.type === 'range') {
      return (formData.experience.min && formData.experience.max)
        ? `${formData.experience.min}-${formData.experience.max} years`
        : 'N/A';
    }
    
    return 'N/A';
  };

  const buildJobPostingPayload = (status) => ({
    ...formData,
    status,
    location: formData.location || 'N/A',
    experience: formData.experience, // Include the raw experience data
    experience_level: formatExperience(),
    responsibilities: Array.isArray(formData.responsibilities)
      ? formData.responsibilities
      : formData.responsibilities
          .split('\n')
          .filter(item => item.trim() !== '')
  });

  // Submit handler
  const submitJobPosting = async (status) => {
    try {
      setLoading(true);
      setError(null);

      const payload = buildJobPostingPayload(status);
      await jobPostingService.createJobPosting(payload);

      navigate('/job-postings');
    } catch (err) {
      console.error('Error saving job posting:', err);
      
      if (err.isPermissionError) {
        setError(err.detail || 'You do not have permission to create job postings.');
      } else {
        setError(err.detail || 'Failed to save job posting. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const basicInfoNextRef = useRef(null);

  const saveAsDraft = () => submitJobPosting('draft');
  const publishJobPosting = () => submitJobPosting('active');

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="w-full  px-2 sm:px-6 md:px-2">
      {/* Header Section */}
      <div className="border-b border-gray-300 pb-5">
        <div className="max-w-7xl mx-auto">
          {/* Title and Buttons Row */}
          <div className="flex items-center justify-between mb-2">
            {/* Left content – takes only needed width */}
            <span className="flex flex-shrink-0">
              <div className="border-r border-black pr-3">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-none animate-slideInLeft">
                  Create Job Posting
                </h1>
              </div>

              <div className="pl-2 max-w-[300px]">
                <p className="text-gray-600 mt-1 animate-slideInLeft animation-delay-100 pr-1">
                  Fill in the details to create a new job opportunity.
                </p>
              </div>
            </span>

            <div className="flex items-center space-x-3">
              <button
                onClick={saveAsDraft}
                disabled={loading}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save as Draft
              </button>

              <button
                onClick={publishJobPosting}
                disabled={loading}
                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Create Job
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="text-xs text-gray-500">
            <Link to="/" className="text-gray-600 hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/job-postings" className="text-blue-600 hover:underline">
              Total Job Posting
            </Link>
          </div>
        </div>
      </div>


      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto py-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 ">
        <div className="flex gap-8">
          {/* Left Sidebar - Steps */}
          <div className="w-56 flex-shrink-0">
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-5 top-12 h-14 w-0.5 bg-gray-300"></div>
                  )}

                  {/* Step Item */}
                  <div className="flex items-start gap-4 pb-2">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        currentStep > step.id
                          ? 'bg-green-500 text-white'
                          : currentStep === step.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-medium text-gray-500">Step {step.id}</p>
                      <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                      {currentStep > step.id && (
                        <p className="text-xs text-green-600 mt-1 font-medium">Completed</p>
                      )}
                      {currentStep === step.id && (
                        <p className="text-xs mt-1" style={{ color: '#FBBF24' }}>In progress</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-r border-gray-300 pb-5" style={{marginTop:-33 ,marginLeft:-20 , marginBottom:-135}}></div>
          {/* Right Content - Form */}
            <div className="flex-1 min-w-0">

            {currentStep === 1 ? (
              <BasicInformation
                formData={formData}
                handleChange={handleChange}
                goNext={handleNext}
              />
            ) : (
              <CurrentStepComponent
                formData={formData}
                handleChange={handleChange}
                goNext={handleNext}
              />

            )}


              {/* Form Navigation */}
              <div className="mt-10 flex justify-end items-center gap-3" >
                <div >
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      disabled={loading}
                      className="flex items-center px-6 py-2 rounded-lg text-sm font-medium text-white bg-gray-400 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <>
                      <BackIcon className="mr-2 h-4 w-4" />      Back 
                    </>
                    </button>
                  )}
                </div>
              <button
                onClick={() => {
                  if (currentStep === 1) {
                    document.getElementById('basic-info-next')?.click();
                  } else if (currentStep < steps.length) {
                    handleNext();
                  } else {
                    publishJobPosting();
                  }
                }}


                  disabled={loading}
                  className="flex items-center px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {currentStep < steps.length ? (
                    <>
                      Next <NextIcon className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <CheckIcon className="mr-2 h-4 w-4" />
                      Create Job
                    </>
                  )}
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default CreateJobPosting;