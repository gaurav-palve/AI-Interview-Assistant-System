import { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  School as ExperienceIcon,
  Category as DepartmentIcon,
  Code as SkillsIcon,
  Close as RemoveIcon
} from '@mui/icons-material';

/**
 * BasicInformation component
 * First step of the job posting creation form
 */
function BasicInformation({ formData, handleChange }) {
  const [errors, setErrors] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  // ----------------------------
  // Fetch skill suggestions API
  // ----------------------------
  const fetchSkillSuggestions = async (title) => {
    if (!title || title.trim() === '') {
      setSuggestions([]);
      setSuggestionsError(null);
      return;
    }

    try {
      setSuggestionsLoading(true);
      setSuggestionsError(null);

      const res = await api.post('/skills-suggestion', { job_role: title });

      const data = res.data;
      if (Array.isArray(data.skills)) {
        const filtered = data.skills.filter(s => !formData.required_skills.includes(s));
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error fetching suggestions', err);
      setSuggestionsError('Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // ----------------------------
  // Field validation
  // ----------------------------
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

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  // ----------------------------
  // Skills Management
  // ----------------------------
  const addRequiredSkill = () => {
    if (!newSkill.trim()) return;
    const updatedSkills = [...formData.required_skills, newSkill.trim()];
    handleChange('required_skills', updatedSkills);
    setNewSkill('');
  };

  const addSuggestedSkill = (skill) => {
    if (!skill) return;
    if (formData.required_skills.includes(skill)) return;
    const updatedSkills = [...formData.required_skills, skill];
    handleChange('required_skills', updatedSkills);
    setSuggestions(prev => prev.filter(s => s !== skill));
  };

  const addAllSuggested = () => {
    const merged = Array.from(new Set([...(formData.required_skills || []), ...suggestions]));
    handleChange('required_skills', merged);
    setSuggestions([]);
  };

  const removeRequiredSkill = (index) => {
    const updatedSkills = [...formData.required_skills];
    updatedSkills.splice(index, 1);
    handleChange('required_skills', updatedSkills);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRequiredSkill();
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  // ----------------------------
  // JSX
  // ----------------------------
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

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Title */}
          <div className="form-control group">
            <label className="label">
              <span className="label-text font-semibold text-gray-700 flex items-center">
                <WorkIcon className="h-4 w-4 mr-2 text-primary-500" />
                Job Title 
              </span>
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'job_title' ? 'text-primary-500' : 'text-gray-400'}`}>
                {/* <WorkIcon className="h-5 w-5" /> */}
              </div>
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleInputChange}
                onFocus={() => handleFocus('job_title')}
                onBlur={(e) => {
                  handleBlur();
                  fetchSkillSuggestions(e.target.value);
                }}
                placeholder="e.g. HR Executive"
                className={`input input-bordered w-full pl-12 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${errors.job_title ? 'input-error border-danger-500' : ''} ${focusedField === 'job_title' ? 'shadow-lg scale-105' : ''}`}
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
                Company Name
              </span>
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'company' ? 'text-primary-500' : 'text-gray-400'}`}>
                {/* <BusinessIcon className="h-5 w-5" /> */}
              </div>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                onFocus={() => handleFocus('company')}
                onBlur={handleBlur}
                placeholder="e.g. Neutrino Tech Systems"
                className={`input input-bordered w-full pl-12 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${errors.company ? 'input-error border-danger-500' : ''} ${focusedField === 'company' ? 'shadow-lg scale-105' : ''}`}
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
              className="select select-bordered w-full hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
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
              <span className="label-text font-semibold text-gray-700">Work Mode</span>
            </label>
            <select
              name="work_location"
              value={formData.work_location}
              onChange={handleSelectChange}
              className="select select-bordered w-full hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            >
              <option value="On-site">🏢 On-site</option>
              <option value="Remote">🏠 Remote</option>
              <option value="Hybrid">🏢🏠 Hybrid</option>
            </select>
          </div>

          {/* Physical Location */}
          <div className="form-control group">
            <label className="label">
              <span className="label-text font-semibold text-gray-700 flex items-center">
                <LocationIcon className="h-4 w-4 mr-2 text-primary-500" />
                Location *
              </span>
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'location' ? 'text-primary-500' : 'text-gray-400'}`}>
                <LocationIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                onFocus={() => handleFocus('location')}
                onBlur={handleBlur}
                placeholder="e.g. New York, NY"
                className={`input input-bordered w-full pl-12 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${errors.location ? 'input-error border-danger-500' : ''} ${focusedField === 'location' ? 'shadow-lg scale-105' : ''}`}
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

          {/* Experience level is now handled internally in the form data state */}
        </div>
      </div>

      {/* Skills Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.5s' }}>
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 px-6 py-4 border-b border-accent-100">
          <h3 className="text-lg font-semibold text-blue-700 flex items-center">
            <SkillsIcon className="h-5 w-5 mr-2 text-accent-600" />
            Required Skills
          </h3>
        </div>

        <div className="p-6">
          {suggestionsLoading && <p className="text-sm text-gray-500 mb-2">Loading suggestions...</p>}
          {suggestionsError && <p className="text-sm text-danger-600 mb-2">{suggestionsError}</p>}

          {suggestions.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Suggested Skills</h4>
                <button type="button" onClick={addAllSuggested} className="btn btn-sm bg-orange-400 hover:bg-orange-500 text-white">Add all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={s + idx}
                    type="button"
                    onClick={() => addSuggestedSkill(s)}
                    title={`Add ${s} to required skills`}
                    className="badge badge-lg rounded-full px-4 py-2 flex items-center justify-center text-primary-600 font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4 items-center flex-nowrap">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a skill"
              className="input input-bordered flex-1 min-w-0 pl-3 pr-3 py-2 text-sm hover:border-accent-300 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
            />
            <button
              type="button"
              onClick={addRequiredSkill}
              disabled={!newSkill.trim()}
              className="btn bg-orange-400 hover:bg-orange-500 text-white px-3 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add skill"
              title="Add skill"
            >
              <span className="font-medium">Add Skill</span>
            </button>
          </div>

          {formData.required_skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.required_skills.map((skill, index) => (
                <div
                  key={index}
                  className="inline-flex items-center bg-accent-100 text-accent-800 rounded-full h-7 min-w-[3.5rem] px-2 hover:scale-105 hover:shadow-sm group"
                >
                  <span className="text-xs font-medium truncate text-center w-full" title={skill}>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeRequiredSkill(index)}
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-transparent"
                    aria-label={`Remove ${skill}`}
                    title={`Remove ${skill}`}
                  >
                    <RemoveIcon className="h-2 w-2 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
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
