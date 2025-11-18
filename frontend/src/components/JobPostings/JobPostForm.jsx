import React, { useState } from 'react';
import BasicInformation from './BasicInformation';
import RequirementsResponsibilities from './RequirementsResponsibilities';
import JobDescription from './JobDescription';

const JobPostForm = () => {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    // Basic Information - match field names with backend expectations
    job_title: '',
    company: '',
    job_type: '',
    work_location: '',
    required_skills: [], // Will be converted to string when sent to backend
    experience: '',
    
    // Requirements & Responsibilities
    requirements: [],
    responsibilities: '', // String format for backend
    qualifications: '',
    
    // Job Description
    company_description: '',
    job_description: '',
    additional_context: '',
    use_ai_generation: true
  });

  const handleNext = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(step + 1);
  };

  const handleBack = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    console.log('Final data sent to backend:', formData);
    
    // Format data to match backend expectations
    const jobPostingData = {
      job_title: formData.job_title,
      company: formData.company,
      job_type: formData.job_type,
      work_location: formData.work_location,
      location: formData.location || '',
      // Convert array to string for backend
      required_skills: Array.isArray(formData.required_skills)
      ? formData.required_skills
      : formData.required_skills.split(',').map(s => s.trim()), 
      experience_level: formData.experience || '',
      // Handle responsibilities as string or array
      responsibilities: typeof formData.responsibilities === 'string' ? formData.responsibilities :
                       (Array.isArray(formData.responsibilities) ? formData.responsibilities.join('\n') : ''),
      qualifications: formData.qualifications || '',
      job_description: formData.job_description || '',
      additional_context: formData.additional_context || ''
    };
    
    try {
      await fetch('/api/generate-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPostingData),
      });
    } catch (error) {
      console.error('Error submitting job posting:', error);
    }
  };

  return (
    <>
      {step === 1 && <BasicInformation data={formData} onNext={handleNext} />}
      {step === 2 && <RequirementsResponsibilities data={formData} onNext={handleNext} onBack={handleBack} />}
      {step === 3 && <JobDescription data={formData} onBack={handleBack} onSubmit={handleSubmit} />}
    </>
  );
};

export default JobPostForm; 