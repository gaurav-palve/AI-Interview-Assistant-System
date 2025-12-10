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
    job_title: '',
    company: '',
    job_type: 'Full-time',
    work_location: 'On-site',
    location: '',
    experience_level: '',
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
    { id: 1, title: 'Basic Information', icon: <WorkIcon />, component: BasicInformation },
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

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setStepAnimation(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setStepAnimation(false);
      }, 200);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepAnimation(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setStepAnimation(false);
      }, 200);
    }
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const extractExperienceFromRequirements = () => {
    if (!Array.isArray(formData.requirements) || formData.requirements.length === 0) {
      return 'Not specified';
    }
    return formData.requirements.join(', ');
  };

  const buildJobPostingPayload = (status) => ({
    ...formData,
    status,
    location: formData.location || 'Not specified',
    experience_level: extractExperienceFromRequirements(),
    responsibilities: Array.isArray(formData.responsibilities)
      ? formData.responsibilities
      : formData.responsibilities
          .split('\n')
          .filter(item => item.trim() !== '')
  });

  // -----------------------------
  // Submit (single source of truth)
  // -----------------------------
  const submitJobPosting = async (status) => {
    try {
      setLoading(true);
      setError(null);

      const payload = buildJobPostingPayload(status);
      await jobPostingService.createJobPosting(payload);

      navigate('/job-postings');
    } catch (err) {
      console.error('Error saving job posting:', err);
      setError('Failed to save job posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsDraft = () => submitJobPosting('draft');
  const publishJobPosting = () => submitJobPosting('active');

  const CurrentStepComponent = steps[currentStep - 1].component;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-purple-50 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Create New Job Posting</h1>
            <p className="text-gray-600 mt-2">
              Fill in the details to create a new job opportunity
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/job-postings')}
              className="btn btn-outline"
            >
              <BackIcon className="mr-2" />
              Cancel
            </button>
            <button
              onClick={saveAsDraft}
              disabled={loading}
              className="btn btn-outline"
            >
              <SaveIcon className="mr-2" />
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded">
          <p className="text-danger-700">{error}</p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="flex-1 text-center">
              <div
                className={`h-12 w-12 mx-auto rounded-xl flex items-center justify-center
                  ${currentStep >= step.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-400'}
                `}
              >
                {currentStep > step.id ? <CheckIcon /> : step.icon}
              </div>
              <p className="mt-2 text-sm font-medium">{step.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Form */}
      <div className={`transition-all ${stepAnimation ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-white rounded-2xl shadow-lg border">
          <div className="p-8">
            <CurrentStepComponent
              formData={formData}
              handleChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
          className="btn btn-outline"
        >
          <BackIcon className="mr-2" />
          Previous
        </button>

        {currentStep < steps.length ? (
          <button
            onClick={handleNext}
            disabled={loading}
            className="btn btn-primary"
          >
            Next Step
            <NextIcon className="ml-2" />
          </button>
        ) : (
          <button
            onClick={publishJobPosting}
            disabled={loading}
            className="btn bg-green-600 text-white"
          >
            <CheckIcon className="mr-2" />
            Publish Job Posting
          </button>
        )}
      </div>
    </div>
  );
}

export default CreateJobPosting;
