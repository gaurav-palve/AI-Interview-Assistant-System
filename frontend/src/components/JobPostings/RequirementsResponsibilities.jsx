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
    <div className="space-y-8 p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center mb-3 animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg mr-3 shadow-lg">
            <ChecklistIcon className="h-7 w-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent font-serif">
            Requirements & Responsibilities
          </span>
        </h2>
        <p className="text-gray-600 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Define what candidates need to qualify and what they'll be responsible for
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Requirements */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <div className="bg-blue-500 text-white p-1 rounded mr-2">
                <RequirementsIcon className="h-4 w-4" />
              </div>
              Candidate Requirements
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">What qualifications or experience does the candidate need?</p>
            <div className="relative mb-6">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onFocus={() => handleFocus('requirement')}
                onBlur={handleBlur}
                onKeyPress={(e) => handleKeyPress(e, 'requirement')}
                placeholder="e.g. 3+ years of experience in project management"
                className={`w-full h-12 px-4 pr-24 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 ${focusedField === 'requirement' ? 'shadow-lg scale-105' : ''}`}
              />
              <button
                type="button"
                onClick={addRequirement}
                disabled={!newRequirement.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center gap-1 transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AddIcon className="h-4 w-4" />
                Add
              </button>
            </div>
            {formData.requirements.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400 group hover:bg-blue-50 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium">{req}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="btn btn-xs btn-circle btn-ghost text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-100"
                      >
                        <RemoveIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <div className="bg-blue-500 text-white p-1 rounded mr-2">
                <DescriptionIcon className="h-4 w-4" />
              </div>
              Job Responsibilities
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">What tasks will the candidate be responsible for?</p>
            <div className="relative mb-6">
              <input
                type="text"
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                onFocus={() => handleFocus('responsibility')}
                onBlur={handleBlur}
                onKeyPress={(e) => handleKeyPress(e, 'responsibility')}
                placeholder="e.g. Leading project teams and ensuring deadlines"
                className={`w-full h-12 px-4 pr-24 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 ${focusedField === 'responsibility' ? 'shadow-lg scale-105' : ''}`}
              />
              <button
                type="button"
                onClick={addResponsibility}
                disabled={!newResponsibility.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center gap-1 transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AddIcon className="h-4 w-4" />
                Add
              </button>
            </div>
            {formData.responsibilities.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.responsibilities.map((resp, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400 group hover:bg-blue-50 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium">{resp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeResponsibility(index)}
                                                className="btn btn-xs btn-circle btn-ghost text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-100"
                      >
                        <RemoveIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Qualifications Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center">
            <div className="bg-blue-500 text-white p-1 rounded mr-2">
              <QualificationsIcon className="h-4 w-4" />
            </div>
            Additional Qualifications
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">Provide any extra qualifications or notes for candidates.</p>
          <textarea
            value={formData.qualifications}
            onChange={handleQualificationsChange}
            placeholder="e.g. Strong communication skills, ability to work independently"
            rows={4}
            className="w-full h-32 px-4 py-3 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
}

export default RequirementsResponsibilities;