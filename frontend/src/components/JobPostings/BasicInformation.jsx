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
function BasicInformation({ formData, handleChange, goNext  }) {
  const [errors, setErrors] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  // Handle form data changes
  const updateFormData = (name, value) => {
    handleChange(name, value);
  };

  // Handle next button click
  const handleNextClick = () => {
    const requiredFields = ['job_title', 'company', 'location'];
    const newErrors = {};

    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }

      // ✅ REQUIRED SKILLS VALIDATION
      if (!formData.required_skills || formData.required_skills.length === 0) {
        newErrors.required_skills = 'At least one skill is required';
      }
    });

    setErrors(newErrors);

    // 🔴 STOP HERE if errors exist
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // ✅ Move to next page ONLY if valid
    goNext();
  };

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
        const filtered = data.skills.filter(
            s => !(formData.required_skills || []).includes(s)
          );

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
    updateFormData(name, value);
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
    updateFormData('required_skills', updatedSkills);
    setNewSkill('');
    setErrors(prev => ({ ...prev, required_skills: null }));
  };

  const addSuggestedSkill = (skill) => {
    if (!skill) return;
    if (formData.required_skills.includes(skill)) return;
    const updatedSkills = [...formData.required_skills, skill];
    updateFormData('required_skills', updatedSkills);
    setSuggestions(prev => prev.filter(s => s !== skill));
    setErrors(prev => ({ ...prev, required_skills: null }));
  };

  const addAllSuggested = () => {
    const merged = Array.from(new Set([...(formData.required_skills || []), ...suggestions]));
    updateFormData('required_skills', merged);
    setSuggestions([]);
    setErrors(prev => ({ ...prev, required_skills: null }));
  };

  const removeRequiredSkill = (index) => {
    const updatedSkills = [...formData.required_skills];
    updatedSkills.splice(index, 1);
    updateFormData('required_skills', updatedSkills);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRequiredSkill();
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    updateFormData(name, value);
  };

  // useEffect(() => {
  //   if (onNext) {
  //     onNext.current = handleNextClick;
  //   }
  // }, []);


  // ----------------------------
  // JSX
  // ----------------------------
  return (
  <div>
    {/* Row 1: Job Title + Company */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Job Title */}
      <div className="form-control">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="job_title"
          value={formData.job_title}
          onChange={handleInputChange}
          onBlur={(e) => {
            handleBlur();
            fetchSkillSuggestions(e.target.value);
          }}
          placeholder="e.g. UX Writer"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.job_title && (
          <p className="text-xs text-red-600 mt-1">{errors.job_title}</p>
        )}
      </div>

      {/* Company */}
      <div className="form-control">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleInputChange}
          placeholder="e.g. NeutrinoTech Systems"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.company && (
          <p className="text-xs text-red-600 mt-1">{errors.company}</p>
        )}
      </div>
    </div>

    {/* Row 2: Job Type + Work Mode + Location */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {/* Job Type */}
      <div className="form-control">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Type <span className="text-red-500">*</span>
        </label>
        <select
          name="job_type"
          value={formData.job_type}
          onChange={handleSelectChange}
          
          className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md shadow-sm
             focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
          <option value="Contract">Contract</option>
          <option value="Temporary">Temporary</option>
          <option value="Internship">Internship</option>
        </select>
        
      </div>

      {/* Work Mode */}
      <div className="form-control">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Work Mode <span className="text-red-500">*</span>
        </label>
        <select
          name="work_location"
          value={formData.work_location}
          onChange={handleSelectChange}
          className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md shadow-sm
             focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="On Site">On Site</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      {/* Location */}
      <div className="form-control">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="e.g. Pune, India"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.location && (
          <p className="text-xs text-red-600 mt-1">{errors.location}</p>
        )}
      </div>
    </div>

    {/* Row 3: Required Skills */}
    <div className="mt-6">
      <div className="form-control">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Required Skills <span className="text-red-500">*</span>
        </label>
        
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onFocus={() => handleFocus('required_skill')}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            placeholder="e.g. Python, React, Leadership"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addRequiredSkill}
            disabled={!newSkill.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

          {errors.required_skills && (
            <p className="text-xs text-red-600 mt-1">
              {errors.required_skills}
            </p>
          )}

        {/* ✅ Selected skills FIRST */}
        {formData.required_skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.required_skills.map((skill, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center transition-all duration-200"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeRequiredSkill(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <RemoveIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Display loading state for suggestions */}
        {suggestionsLoading && (
          <div className="text-sm text-gray-500 mb-4">Loading skill suggestions...</div>
        )}

        {/* Display error for suggestions */}
        {suggestionsError && (
          <div className="text-sm text-red-500 mb-4">{suggestionsError}</div>
        )}

        {/* ✅ Suggested skills BELOW */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Suggested skills based on job title:
              </span>
              <button
                type="button"
                onClick={addAllSuggested}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Add all
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((skill, index) => (
                <span
                  key={index}
                  onClick={() => addSuggestedSkill(skill)}
                  className="px-3 py-1 bg-gray-200 text-blue-900 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-all duration-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    <button
  id="basic-info-next"
  type="button"
  onClick={handleNextClick}
  className="hidden"
/>

  </div>
);
}

export default BasicInformation;
