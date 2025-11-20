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
  const [stepAnimation, setStepAnimation] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information - match field names with backend expectations
    job_title: '',
    company: '',
    job_type: 'Full-time',
    work_location: 'On-site',
    location: '',  // Added missing required field for physical job location
    experience_level: '', // Changed from experience to experience_level to match backend
    department: '',
    
    // Skills
    required_skills: [], // Will be converted to string when sent to backend
    
    // Requirements & Responsibilities
    requirements: [],
    responsibilities: [], // Changed to array format to match backend
    qualifications: '',  // Changed from qualification_details to match backend
    
    // Job Description
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

  // Handle next step with animation
  const handleNext = () => {
    if (currentStep < steps.length) {
      setStepAnimation(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setStepAnimation(false);
      }, 200);
    }
  };

  // Handle previous step with animation
  const handleBack = () => {
    if (currentStep > 1) {
      setStepAnimation(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setStepAnimation(false);
      }, 200);
    }
  };

  // Save job posting as draft
  const saveAsDraft = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Format data to ensure it matches backend expectations
      // Extract experience from requirements
      const extractExperienceFromRequirements = () => {
        if (!Array.isArray(formData.requirements) || formData.requirements.length === 0) {
          return 'Not specified';
        }
        // Join all requirements that might contain experience information
        return formData.requirements.join(', ');
      };

      const jobPostingData = {
        ...formData,
        status: 'draft',
        // Ensure all required fields are present
        location: formData.location || 'Not specified',
        experience_level: extractExperienceFromRequirements(), // Use requirements as experience
        responsibilities: Array.isArray(formData.responsibilities)
          ? formData.responsibilities
          : formData.responsibilities.split('\n').filter(item => item.trim() !== '')
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
      
      // Extract experience from requirements
      const extractExperienceFromRequirements = () => {
        if (!Array.isArray(formData.requirements) || formData.requirements.length === 0) {
          return 'Not specified';
        }
        // Join all requirements that might contain experience information
        return formData.requirements.join(', ');
      };

      // Format data to ensure it matches backend expectations
      const jobPostingData = {
        ...formData,
        status: 'active',
        // Ensure all required fields are present
        location: formData.location || 'Not specified',
        experience_level: extractExperienceFromRequirements(), // Use requirements as experience
        responsibilities: Array.isArray(formData.responsibilities)
          ? formData.responsibilities
          : formData.responsibilities.split('\n').filter(item => item.trim() !== '')
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-purple-50 rounded-2xl p-6 shadow-sm animate-slideInDown">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 font-serif tracking-tight animate-slideInLeft">
              Create New Job Posting
            </h1>
            <p className="text-gray-600 mt-2 animate-slideInLeft animation-delay-100">
              Fill in the details to create a new job opportunity
            </p>
          </div>
          <div className="flex space-x-3 animate-slideInRight">
            <button
              onClick={() => navigate('/job-postings')}
              className="btn btn-outline group hover:bg-gray-50"
            >
              <BackIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Cancel
            </button>
            <button
              onClick={saveAsDraft}
              disabled={loading}
              className="btn btn-outline group hover:bg-primary-50 hover:border-primary-500"
            >
              <SaveIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Save as Draft
            </button>
          </div>
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

      {/* Enhanced Progress Steps */}
      <div className="bg-white rounded-2xl shadow-sm p-6 animate-slideInUp animation-delay-100">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    flex items-center justify-center h-14 w-14 rounded-2xl font-semibold text-lg
                    transition-all duration-500 transform
                    ${currentStep === step.id 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-110 ring-4 ring-primary-200' 
                      : currentStep > step.id 
                        ? 'bg-green-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }
                    animate-slideInDown
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {currentStep > step.id ? (
                    <CheckIcon className="h-6 w-6 animate-scale-bounce" />
                  ) : (
                    <span className="transform transition-transform duration-300 group-hover:scale-110">
                      {step.icon}
                    </span>
                  )}
                </div>
                <div className={`
                  text-sm mt-3 text-center font-medium transition-colors duration-300
                  ${currentStep === step.id ? 'text-primary-600' : 
                    currentStep > step.id ? 'text-green-600' : 'text-gray-500'}
                `}>
                  {step.title}
                </div>
              </div>
              
              {/* Progress Line */}
              {step.id < steps.length && (
                <div className="absolute top-7 left-1/2 w-full h-1 -z-10">
                  <div className="h-full bg-gray-200 rounded-full">
                    <div 
                      className={`
                        h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full
                        transition-all duration-700 ease-out
                      `}
                      style={{
                        width: currentStep > step.id ? '100%' : '0%',
                        transitionDelay: currentStep > step.id ? '300ms' : '0ms'
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Current Step Form */}
      <div className={`
        transition-all duration-300 transform
        ${stepAnimation ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
      `}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-slideInUp animation-delay-200">
          {/* Step Header */}
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 px-8 py-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-white rounded-xl shadow-sm mr-4">
                {steps[currentStep - 1].icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Step {currentStep} of {steps.length}
                </h2>
                <p className="text-sm text-gray-600">
                  {steps[currentStep - 1].title}
                </p>
              </div>
            </div>
          </div>
          
          {/* Form Content */}
          <div className="p-8">
            <CurrentStepComponent 
              formData={formData} 
              handleChange={handleChange} 
            />
          </div>
        </div>
      </div>

{/* Enhanced Navigation Buttons */}
<div>
<div className="flex justify-between items-center">
{/* Previous button */}
<button
onClick={handleBack}
disabled={currentStep === 1 || loading}
className={`
btn group transition-all duration-300
${currentStep === 1
? 'btn-disabled opacity-50 cursor-not-allowed'
: 'btn-outline hover:bg-gray-50 hover:-translate-x-1'
}
`}
>
<BackIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
Previous
</button>

{/* Progress Indicator */}
<div className="flex items-center space-x-2">
{steps.map((_, index) => (
<div
key={index}
className={`
h-2 rounded-full transition-all duration-300
${index < currentStep
? 'w-8 bg-gradient-to-r from-primary-400 to-primary-500'
: 'w-2 bg-gray-200'
}
`}
></div>
))}
</div>

{/* Next / Publish button */}
{currentStep < steps.length ? (
<button
onClick={handleNext}
disabled={loading}
className="btn btn-primary group hover:translate-x-1 transition-all duration-300"
>
Next Step
<NextIcon className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
</button>
) : (
<button
onClick={submitJobPosting}
disabled={loading}
className="btn bg-gradient-to-r from-green-500 to-green-600 text-white
hover:from-green-600 hover:to-green-700 group transition-all duration-300"
>
{loading ? (
<>
<div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2"></div>
Publishing...
</>
) : (
<>
<CheckIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
Publish Job Posting
</>
)}
</button>
)}
</div>
</div>
         
        </div>
     
  );
}

export default CreateJobPosting;
