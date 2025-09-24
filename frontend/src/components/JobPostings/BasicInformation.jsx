import { useState } from 'react';
import { 
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  School as ExperienceIcon,
  Category as DepartmentIcon,
  Code as SkillsIcon,
  Add as AddIcon,
  Close as RemoveIcon
} from '@mui/icons-material';

/**
 * BasicInformation component
 * First step of the job posting creation form
 */
function BasicInformation({ formData, handleChange }) {
  const [errors, setErrors] = useState({});
  const [newSkill, setNewSkill] = useState('');

  // Validate required fields
  const validateField = (field, value) => {
    if (!value && ['job_title', 'company', 'location'].includes(field)) {
      setErrors(prev => ({ ...prev, [field]: 'This field is required' }));
      return false;
    } else {
      setErrors(prev => ({ ...prev, [field]: null }));
      return true;
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleChange(name, value);
    validateField(name, value);
  };
  
  // Add a required skill
  const addRequiredSkill = () => {
    if (!newSkill.trim()) return;
    
    const updatedSkills = [...formData.required_skills, newSkill.trim()];
    handleChange('required_skills', updatedSkills);
    setNewSkill('');
  };

  // Remove a required skill
  const removeRequiredSkill = (index) => {
    const updatedSkills = [...formData.required_skills];
    updatedSkills.splice(index, 1);
    handleChange('required_skills', updatedSkills);
  };
  
  // Handle key press for adding skills
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRequiredSkill();
    }
  };

  // Handle select change
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
        <WorkIcon className="h-6 w-6 mr-2 text-primary-600" />
        <span className="text-gray-800 font-serif">Job Details</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Job Title *</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <WorkIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              placeholder="e.g. HR Executive"
              className={`input input-bordered w-full pl-10 ${errors.job_title ? 'input-error' : ''}`}
              required
            />
          </div>
          {errors.job_title && <p className="text-xs text-error mt-1">{errors.job_title}</p>}
        </div>

        {/* Company */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Company *</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BusinessIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="e.g. Trayarunya Ventures LLC"
              className={`input input-bordered w-full pl-10 ${errors.company ? 'input-error' : ''}`}
              required
            />
          </div>
          {errors.company && <p className="text-xs text-error mt-1">{errors.company}</p>}
        </div>

        {/* Job Type */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Job Type</span>
          </label>
          <select
            name="job_type"
            value={formData.job_type}
            onChange={handleSelectChange}
            className="select select-bordered w-full"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Internship">Internship</option>
            <option value="Volunteer">Volunteer</option>
          </select>
        </div>

        {/* Work Location Type */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Work Location Type</span>
          </label>
          <select
            name="work_location_type"
            value={formData.work_location_type}
            onChange={handleSelectChange}
            className="select select-bordered w-full"
          >
            <option value="On-site">On-site</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
          <LocationIcon className="h-6 w-6 mr-2 text-primary-600" />
          <span className="text-gray-800 font-serif">Location</span>
        </h3>

        {/* Location */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Location *</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LocationIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g. New York, NY"
              className={`input input-bordered w-full pl-10 ${errors.location ? 'input-error' : ''}`}
              required
            />
          </div>
          {errors.location && <p className="text-xs text-error mt-1">{errors.location}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Experience Level */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Experience Level</span>
          </label>
          <div className="relative">
            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleSelectChange}
              className="select select-bordered w-full"
            >
              <option value="">Select the experience level required for this position</option>
              <option value="Entry Level">Entry Level</option>
              <option value="Mid Level">Mid Level</option>
              <option value="Senior Level">Senior Level</option>
              <option value="Executive">Executive</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
              <SkillsIcon className="h-6 w-6 mr-2 text-primary-600" />
              <span className="text-gray-800 font-serif">Required Skills</span>
            </h3>
    
            {/* Required Skills */}
            <div className="form-control">
              <div className="flex">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. JavaScript"
                  className="input input-bordered flex-grow"
                />
                <button
                  type="button"
                  onClick={addRequiredSkill}
                  className="btn btn-primary ml-2"
                >
                  <AddIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.required_skills.map((skill, index) => (
                  <div
                    key={index}
                    className="badge badge-primary badge-lg gap-2 py-3"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeRequiredSkill(index)}
                      className="btn btn-xs btn-circle btn-ghost"
                    >
                      <RemoveIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Department */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Department</span>
          </label>
          <div className="relative">
            <select
              name="department"
              value={formData.department}
              onChange={handleSelectChange}
              className="select select-bordered w-full"
            >
              <option value="">Select the department for this position</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
              <option value="Operations">Operations</option>
              <option value="IT">IT</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BasicInformation;