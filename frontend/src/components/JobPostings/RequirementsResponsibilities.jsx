import { useState } from 'react';
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

  const handleQualificationsChange = (e) => {
    handleChange('qualifications', e.target.value);
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

          <div className="relative mb-1">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'requirement')}
              placeholder="e.g. 3+ years of experience in project management"
              className="w-full h-11 px-4 pr-24 text-sm border border-gray-300 rounded-md
                         focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={addRequirement}
              disabled={!newRequirement.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4
                         bg-blue-600 text-white rounded-md text-sm
                         hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
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