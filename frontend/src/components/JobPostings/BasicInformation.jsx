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
  const [focusedField, setFocusedField] = useState(null);

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

  // Handle focus
  const handleFocus = (field) => {
    setFocusedField(field);
  };

  // Handle blur
  const handleBlur = () => {
    setFocusedField(null);
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
    <div className="space-y-8 p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center mb-3 animate-fadeIn">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-lg mr-3 shadow-lg">
            <WorkIcon className="h-7 w-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent font-serif">
            Job Details
          </span>
        </h2>
        <p className="text-gray-600 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Provide the essential information for your job posting
        </p>
      </div>

      {/* Primary Information Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.3s' }}>
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-100">
          <h3 className="text-lg font-semibold text-primary-800 flex items-center">
            <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
            Primary Information
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Title */}
            <div className="form-control group">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center">
                  <WorkIcon className="h-4 w-4 mr-2 text-primary-500" />
                  Job Title *
                </span>
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === 'job_title' ? 'text-primary-500' : 'text-gray-400'}`}>
                  <WorkIcon className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('job_title')}
                  onBlur={handleBlur}
                  placeholder="e.g. HR Executive"
                  className={`input input-bordered w-full pl-12 transition-all duration-200 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${errors.job_title ? 'input-error border-danger-500' : ''} ${focusedField === 'job_title' ? 'shadow-lg scale-105' : ''}`}
                  required
                />
              </div>
              {errors.job_title && (
                <p className="text-xs text-danger-600 mt-2 flex items-center animate-slideIn">
                  <div className="w-1 h-1 bg-danger-500 rounded-full mr-2"></div>
                  {errors.job_title}
                </p>
              )}
            </div>

            {/* Company */}
            <div className="form-control group">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center">
                  <BusinessIcon className="h-4 w-4 mr-2 text-primary-500" />
                  Company *
                </span>
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === 'company' ? 'text-primary-500' : 'text-gray-400'}`}>
                  <BusinessIcon className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('company')}
                  onBlur={handleBlur}
                  placeholder="e.g. Trayarunya Ventures LLC"
                  className={`input input-bordered w-full pl-12 transition-all duration-200 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${errors.company ? 'input-error border-danger-500' : ''} ${focusedField === 'company' ? 'shadow-lg scale-105' : ''}`}
                  required
                />
              </div>
              {errors.company && (
                <p className="text-xs text-danger-600 mt-2 flex items-center animate-slideIn">
                  <div className="w-1 h-1 bg-danger-500 rounded-full mr-2"></div>
                  {errors.company}
                </p>
              )}
            </div>

            {/* Job Type */}
            <div className="form-control group">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Job Type</span>
              </label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleSelectChange}
                className="select select-bordered w-full transition-all duration-200 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              >
                <option value="Full-time">📅 Full-time</option>
                <option value="Part-time">⏰ Part-time</option>
                <option value="Contract">📋 Contract</option>
                <option value="Temporary">🕒 Temporary</option>
                <option value="Internship">🎓 Internship</option>
                <option value="Volunteer">🤝 Volunteer</option>
              </select>
            </div>

            {/* Work Location Type */}
            <div className="form-control group">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Work Location</span>
              </label>
              <select
                name="work_location_type"
                value={formData.work_location_type}
                onChange={handleSelectChange}
                className="select select-bordered w-full transition-all duration-200 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              >
                <option value="On-site">🏢 On-site</option>
                <option value="Remote">🏠 Remote</option>
                <option value="Hybrid">🏢🏠 Hybrid</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Additional Info Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.4s' }}>
        <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 px-6 py-4 border-b border-secondary-100">
          <h3 className="text-lg font-semibold text-secondary-800 flex items-center">
            <LocationIcon className="h-5 w-5 mr-2 text-secondary-600" />
            Location & Experience
          </h3>
        </div>

        <div className="p-6">
          {/* Location */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold text-gray-700 flex items-center">
                <LocationIcon className="h-4 w-4 mr-2 text-secondary-500" />
                Location *
              </span>
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === 'location' ? 'text-secondary-500' : 'text-gray-400'}`}>
                <LocationIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                onFocus={() => handleFocus('location')}
                onBlur={handleBlur}
                placeholder="e.g. New York, NY or Remote"
                className={`input input-bordered w-full pl-12 transition-all duration-200 hover:border-secondary-300 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${errors.location ? 'input-error border-danger-500' : ''} ${focusedField === 'location' ? 'shadow-lg scale-105' : ''}`}
                required
              />
            </div>
            {errors.location && (
              <p className="text-xs text-danger-600 mt-2 flex items-center animate-slideIn">
                <div className="w-1 h-1 bg-danger-500 rounded-full mr-2"></div>
                {errors.location}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Experience Level */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center">
                  <ExperienceIcon className="h-4 w-4 mr-2 text-secondary-500" />
                  Experience Level
                </span>
              </label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleSelectChange}
                className="select select-bordered w-full transition-all duration-200 hover:border-secondary-300 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
              >
                <option value="">Select experience level...</option>
                <option value="Entry Level">🌱 Entry Level</option>
                <option value="Mid Level">📈 Mid Level</option>
                <option value="Senior Level">⭐ Senior Level</option>
                <option value="Executive">👔 Executive</option>
                <option value="Internship">🎓 Internship</option>
              </select>
            </div>

            {/* Department */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center">
                  <DepartmentIcon className="h-4 w-4 mr-2 text-secondary-500" />
                  Department
                </span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleSelectChange}
                className="select select-bordered w-full transition-all duration-200 hover:border-secondary-300 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
              >
                <option value="">Select department...</option>
                <option value="Engineering">⚙️ Engineering</option>
                <option value="Product">🎯 Product</option>
                <option value="Design">🎨 Design</option>
                <option value="Marketing">📢 Marketing</option>
                <option value="Sales">💼 Sales</option>
                <option value="Customer Support">🎧 Customer Support</option>
                <option value="Human Resources">👥 Human Resources</option>
                <option value="Finance">💰 Finance</option>
                <option value="Legal">⚖️ Legal</option>
                <option value="Operations">🚀 Operations</option>
                <option value="IT">💻 IT</option>
                <option value="Other">🔄 Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.5s' }}>
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 px-6 py-4 border-b border-accent-100">
          <h3 className="text-lg font-semibold text-accent-800 flex items-center">
            <SkillsIcon className="h-5 w-5 mr-2 text-accent-600" />
            Required Skills
          </h3>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">Add technical skills, soft skills, or tools required for this position</p>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a skill and press Enter or click Add"
                className="input input-bordered w-full pl-4 pr-12 transition-all duration-200 hover:border-accent-300 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
              />
            </div>
            <button
              type="button"
              onClick={addRequiredSkill}
              disabled={!newSkill.trim()}
              className="btn btn-accent transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AddIcon className="h-5 w-5" />
              Add Skill
            </button>
          </div>

          {formData.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {formData.required_skills.map((skill, index) => (
                <div
                  key={index}
                  className="badge badge-accent badge-lg gap-2 py-3 px-4 transition-all duration-200 hover:scale-105 hover:shadow-md group"
                >
                  <span className="font-medium">{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeRequiredSkill(index)}
                    className="btn btn-xs btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <RemoveIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {formData.required_skills.length === 0 && (
            <div className="text-center py-8">
              <SkillsIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No skills added yet. Add your first skill above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BasicInformation;
