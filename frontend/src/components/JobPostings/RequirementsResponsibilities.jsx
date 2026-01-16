import { useState, useEffect } from 'react';
import {
  Assignment as RequirementsIcon,
  Add as AddIcon,
  Close as RemoveIcon,
  School as QualificationsIcon,
  Checklist as ChecklistIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

/**
 * RequirementsResponsibilities component
 * Third step of the job posting creation form
 */
function RequirementsResponsibilities({ formData, handleChange }) {
  const [newRequirement, setNewRequirement] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [experienceType, setExperienceType] = useState('fixed'); // 'fixed' or 'range'
  const [fixedExperience, setFixedExperience] = useState('0');
  const [minExperience, setMinExperience] = useState('0');
  const [maxExperience, setMaxExperience] = useState('5');

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  const addRequirement = () => {
    if (!newRequirement.trim()) return;
    const updated = [...formData.requirements, newRequirement.trim()];
    handleChange('requirements', updated);
    setNewRequirement('');
  };

  const removeRequirement = (index) => {
    const updated = [...formData.requirements];
    updated.splice(index, 1);
    handleChange('requirements', updated);
  };

  const addResponsibility = () => {
    if (!newResponsibility.trim()) return;
    const updated = [...formData.responsibilities, newResponsibility.trim()];
    handleChange('responsibilities', updated);
    setNewResponsibility('');
  };

  const removeResponsibility = (index) => {
    const updated = [...formData.responsibilities];
    updated.splice(index, 1);
    handleChange('responsibilities', updated);
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      type === 'requirement' ? addRequirement() : addResponsibility();
    }
  };

  // Initialize experience in formData when component mounts
  useEffect(() => {
    if (experienceType === 'fixed') {
      handleChange('experience', { type: 'fixed', value: fixedExperience || '0' });
    } else {
      handleChange('experience', {
        type: 'range',
        min: minExperience || '0',
        max: maxExperience || '5'
      });
    }
  }, []);

  const handleQualificationsChange = (e) => {
    handleChange('qualifications', e.target.value);
  };

  const handleExperienceTypeChange = (e) => {
    const newType = e.target.value;
    setExperienceType(newType);
    
    // Update formData with the new experience type
    if (newType === 'fixed') {
      handleChange('experience', { type: 'fixed', value: fixedExperience || '0' });
    } else {
      // Ensure maximum experience is greater than or equal to minimum experience
      const minValue = parseInt(minExperience || '0');
      const maxValue = parseInt(maxExperience || '5');
      
      const newMax = maxValue < minValue ? minValue : maxValue;
      setMaxExperience(String(newMax));
      
      handleChange('experience', {
        type: 'range',
        min: minExperience || '0',
        max: String(newMax)
      });
    }
  };

  const handleFixedExperienceChange = (e) => {
    const value = e.target.value;
    setFixedExperience(value);
    // Update formData with the new value
    handleChange('experience', { type: 'fixed', value: value });
  };

  const handleRangeExperienceChange = (min, max) => {
  const minVal =
    min !== undefined ? parseInt(min) : parseInt(minExperience);

  let maxVal =
    max !== undefined ? parseInt(max) : parseInt(maxExperience);

  // Ensure max is always greater than min
  if (maxVal <= minVal) {
    maxVal = minVal + 1;
  }

  // Update local state
  setMinExperience(String(minVal));
  setMaxExperience(String(maxVal));

  // ✅ Send FINAL values to backend
  handleChange('experience', {
    type: 'range',
    min: String(minVal),
    max: String(maxVal),
  });
};

  return (
  <div className="p-4 space-y-0 pt-1">
    

    {/* Requirements & Responsibilities */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Requirements */}
      <div className="bg-gray">
        <div className="px-2 py-0">
          <h3 className="text-sm font-semibold text-gray-800">
            Overall Experience
          </h3>
        </div>

        <div className="p-2">
          {/* Experience Type Selector */}
          <div className="mb-3">
            <select
              value={experienceType}
              onChange={handleExperienceTypeChange}
              className="w-full h-11 px-4 text-sm border border-gray-300 rounded-md
                        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fixed">Fixed Experience</option>
              <option value="range">Range Experience</option>
            </select>
          </div>

          {/* Experience Input Fields */}
          {experienceType === 'fixed' ? (
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Select years of experience</label>
              <select
                value={fixedExperience}
                onChange={handleFixedExperienceChange}
                size="1"
                className="w-full h-11 px-4 py-2 text-sm border border-gray-300 rounded-md
                          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 21 }, (_, i) => (
                  <option key={i} value={i}>{i} {i === 1 ? 'year' : 'years'}</option>
                ))}
                <option value="21">21+ years</option>
              </select>
            </div>
          ) : (
            <div className="mb-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Minimum experience</label>
                  <select
                    value={minExperience}
                    onChange={(e) => handleRangeExperienceChange(e.target.value, undefined)}
                    size="1"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md
                              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 21 }, (_, i) => (
                      <option key={i} value={i}>{i} {i === 1 ? 'year' : 'years'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Maximum experience</label>
                  <select
                    value={maxExperience}
                    onChange={(e) => handleRangeExperienceChange(undefined, e.target.value)}
                    size="1"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md
                              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 21 }, (_, i) => {
                      if (i > parseInt(minExperience)) {
                        return (
                          <option key={i} value={i}>
                            {i} {i === 1 ? 'year' : 'years'}
                          </option>
                        );
                      }
                      return null;
                    })}
                    <option value="21">21+ years</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Display selected experience */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
            <span className="text-sm text-gray-800">
              {experienceType === 'fixed'
                ? `${fixedExperience || 0} years of experience required`
                : `${minExperience || 0}-${maxExperience || 20} years of experience required`}
            </span>
          </div>

          

          {formData.requirements.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between bg-gray-50 border border-gray-200 rounded-md p-3"
                >
                  <span className="text-sm text-gray-800">{req}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <RemoveIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsibilities */}
      <div className="bg-gray">
        <div className="px-2 py-0">
          <h3 className="text-sm font-semibold text-gray-800">
            Job Responsibilities
          </h3>
        </div>

        <div className="p-2">

          <div className="relative mb-1">
            <input
              type="text"
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'responsibility')}
              placeholder="e.g. Leading project teams and ensuring deadlines"
              className="w-full h-11 px-4 pr-24 text-sm border border-gray-300 rounded-md
                         focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={addResponsibility}
              disabled={!newResponsibility.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4
                         bg-blue-600 text-white rounded-md text-sm
                         hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {formData.responsibilities.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.responsibilities.map((resp, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between bg-gray-50 border border-gray-200 rounded-md p-3"
                >
                  <span className="text-sm text-gray-800">{resp}</span>
                  <button
                    type="button"
                    onClick={() => removeResponsibility(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <RemoveIcon className="h-2 w-2" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Additional Qualifications */}
    <div className="bg-gray ">
      <div className="px-2 py-0">
        <h3 className="text-sm font-semibold text-gray-800">
          Additional Qualifications
        </h3>
      </div>

      <div className="p-2">

        <textarea
          value={formData.qualifications}
          onChange={handleQualificationsChange}
          placeholder="e.g. Strong communication skills, ability to work independently"
          rows={4}
          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md
                     focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
);

}

export default RequirementsResponsibilities;