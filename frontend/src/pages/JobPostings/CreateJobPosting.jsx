import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobPostingService from '../../services/jobPostingService';

// Material UI Icons
import {
  Work as WorkIcon,
  AttachMoney as CompensationIcon,
  Assignment as RequirementsIcon,
  Description as DescriptionIcon,
  CardGiftcard as BenefitsIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Save as SaveIcon,
  Check as CheckIcon
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
    // Basic Information
    job_title: '',
    company: '',
    job_type: 'Full-time',
    work_location_type: 'On-site',
    location: '',
    experience_level: '',
    department: '',
    
    // Skills
    required_skills: [],
    
    // Requirements & Responsibilities
    requirements: [],
    responsibilities: [],
    qualifications: '',
    
    // Job Description
    company_description: '',
    job_description: '',
    use_ai_generation: true,
    
    status: 'draft'
  });

  // Steps configuration
  const steps = [
    { 
      id: 1, 
      title: 'Basic Information', 
      icon: <WorkIcon className="h-6 w-6" />,
      component: BasicInformation
    },
    {
      id: 2,
      title: 'Requirements & Responsibilities',
      icon: <RequirementsIcon className="h-6 w-6" />,
      component: RequirementsResponsibilities
    },
    {
      id: 3,
      title: 'Job Description',
      icon: <DescriptionIcon className="h-6 w-6" />,
      component: JobDescription
    }
  ];

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Save job posting as draft
  const saveAsDraft = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const jobPostingData = {
        ...formData,
        status: 'draft'
      };
      
      const response = await jobPostingService.createJobPosting(jobPostingData);
      navigate('/job-postings');
    } catch (err) {
      console.error('Error saving job posting:', err);
      setError('Failed to save job posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit job posting
  const submitJobPosting = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const jobPostingData = {
        ...formData,
        status: 'active'
      };
      
      const response = await jobPostingService.createJobPosting(jobPostingData);
      navigate('/job-postings');
    } catch (err) {
      console.error('Error submitting job posting:', err);
      setError('Failed to submit job posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render current step component
  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Create New Job</h1>
        <div className="flex space-x-4">
          <button
            onClick={saveAsDraft}
            disabled={loading}
            className="btn btn-outline"
          >
            <SaveIcon className="h-5 w-5 mr-2" />
            Save as Draft
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-md animate-slideIn">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex justify-between items-center">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <div 
              className={`flex items-center justify-center h-12 w-12 rounded-full ${
                currentStep === step.id 
                  ? 'bg-primary-500 text-white' 
                  : currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
              } transition-all duration-300`}
            >
              {currentStep > step.id ? <CheckIcon className="h-6 w-6" /> : step.icon}
            </div>
            <div className="text-xs mt-2 text-center font-medium text-gray-700">{step.title}</div>
            {step.id < steps.length && (
              <div className="w-24 h-1 bg-gray-200 mt-2">
                <div 
                  className={`h-full bg-primary-500 transition-all duration-500 ${
                    currentStep > step.id ? 'w-full' : 'w-0'
                  }`}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current Step Form */}
      <div className="card shadow-lg border-t-4 border-primary-500 animate-fadeIn">
        <CurrentStepComponent 
          formData={formData} 
          handleChange={handleChange} 
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
          className={`btn ${currentStep === 1 ? 'btn-disabled' : 'btn-outline'}`}
        >
          <BackIcon className="h-5 w-5 mr-2" />
          Back
        </button>
        
        {currentStep < steps.length ? (
          <button
            onClick={handleNext}
            disabled={loading}
            className="btn btn-primary"
          >
            Next
            <NextIcon className="h-5 w-5 ml-2" />
          </button>
        ) : (
          <button
            onClick={submitJobPosting}
            disabled={loading}
            className="btn btn-success"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            Publish Job
          </button>
        )}
      </div>
    </div>
  );
}

export default CreateJobPosting;