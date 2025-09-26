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

  // Handle focus
  const handleFocus = (field) => {
    setFocusedField(field);
  };

  // Handle blur
  const handleBlur = () => {
    setFocusedField(null);
  };

  // Add a requirement
  const addRequirement = () => {
    if (!newRequirement.trim()) return;
    
    const updatedRequirements = [...formData.requirements, newRequirement.trim()];
    handleChange('requirements', updatedRequirements);
    setNewRequirement('');
  };

  // Remove a requirement
  const removeRequirement = (index) => {
    const updatedRequirements = [...formData.requirements];
    updatedRequirements.splice(index, 1);
    handleChange('requirements', updatedRequirements);
  };

  // Add a responsibility
  const addResponsibility = () => {
    if (!newResponsibility.trim()) return;
    
    const updatedResponsibilities = [...formData.responsibilities, newResponsibility.trim()];
    handleChange('responsibilities', updatedResponsibilities);
    setNewResponsibility('');
  };

  // Remove a responsibility
  const removeResponsibility = (index) => {
    const updatedResponsibilities = [...formData.responsibilities];
    updatedResponsibilities.splice(index, 1);
    handleChange('responsibilities', updatedResponsibilities);
  };

  // Handle key press for adding items
  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'requirement') {
        addRequirement();
      } else {
        addResponsibility();
      }
    }
  };

  // Handle qualifications text area change
  const handleQualificationsChange = (e) => {
    handleChange('qualifications', e.target.value);
  };

  return (
    <div className="space-y-8 p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center mb-3 animate-fadeIn">
          <div className="bg-gradient-to-r from-danger-500 to-danger-600 p-2 rounded-lg mr-3 shadow-lg">
            <ChecklistIcon className="h-7 w-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-danger-600 to-danger-700 bg-clip-text text-transparent font-serif">
            Requirements & Responsibilities
          </span>
        </h2>
        <p className="text-gray-600 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Define what candidates need to qualify and what they'll be responsible for
        </p>
      </div>

      {/* Requirements & Responsibilities Side by Side Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Requirements Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <div className="bg-gradient-to-r from-danger-50 to-danger-100 px-6 py-4 border-b border-danger-100">
            <h3 className="text-lg font-semibold text-danger-800 flex items-center">
              <div className="bg-danger-500 text-white p-1 rounded mr-2">
                <RequirementsIcon className="h-4 w-4" />
              </div>
              Candidate Requirements
            </h3>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">What qualifications or experience does the candidate need?</p>

            {/* Add Requirement Input */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onFocus={() => handleFocus('requirement')}
                  onBlur={handleBlur}
                  onKeyPress={(e) => handleKeyPress(e, 'requirement')}
                  placeholder="e.g. 3+ years of experience in project management"
                  className={`input input-bordered w-full pl-4 pr-12 transition-all duration-200 hover:border-danger-300 focus:border-danger-500 focus:ring-2 focus:ring-danger-200 ${focusedField === 'requirement' ? 'shadow-lg scale-105' : ''}`}
                />
              </div>
              <button
                type="button"
                onClick={addRequirement}
                disabled={!newRequirement.trim()}
                className="btn btn-danger transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AddIcon className="h-5 w-5" />
                Add
              </button>
            </div>

            {/* Requirements List */}
            {formData.requirements.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.requirements.map((requirement, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border-l-4 border-danger-400 group hover:bg-danger-50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-danger-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium">{requirement}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="btn btn-xs btn-circle btn-ghost text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-danger-100"
                      >
                        <RemoveIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-danger-200 rounded-lg">
                <RequirementsIcon className="h-10 w-10 text-danger-300 mx-auto mb-2" />
                <p className="text-danger-500 text-sm font-medium">No requirements added yet</p>
                <p className="text-gray-400 text-xs mt-1">Add the key qualifications candidates need</p>
              </div>
            )}
          </div>
        </div>

        {/* Responsibilities Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <div className="bg-gradient-to-r from-info-50 to-info-100 px-6 py-4 border-b border-info-100">
            <h3 className="text-lg font-semibold text-info-800 flex items-center">
              <div className="bg-info-500 text-white p-1 rounded mr-2">
                <ChecklistIcon className="h-4 w-4" />
              </div>
              Role Responsibilities
            </h3>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">What will the successful candidate be doing?</p>

            {/* Add Responsibility Input */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  onFocus={() => handleFocus('responsibility')}
                  onBlur={handleBlur}
                  onKeyPress={(e) => handleKeyPress(e, 'responsibility')}
                  placeholder="e.g. Lead cross-functional development teams"
                  className={`input input-bordered w-full pl-4 pr-12 transition-all duration-200 hover:border-info-300 focus:border-info-500 focus:ring-2 focus:ring-info-200 ${focusedField === 'responsibility' ? 'shadow-lg scale-105' : ''}`}
                />
              </div>
              <button
                type="button"
                onClick={addResponsibility}
                disabled={!newResponsibility.trim()}
                className="btn btn-info transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AddIcon className="h-5 w-5" />
                Add
              </button>
            </div>

            {/* Responsibilities List */}
            {formData.responsibilities.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.responsibilities.map((responsibility, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border-l-4 border-info-400 group hover:bg-info-50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-info-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium">{responsibility}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeResponsibility(index)}
                        className="btn btn-xs btn-circle btn-ghost text-info-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-info-100"
                      >
                        <RemoveIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-info-200 rounded-lg">
                <ChecklistIcon className="h-10 w-10 text-info-300 mx-auto mb-2" />
                <p className="text-info-500 text-sm font-medium">No responsibilities added yet</p>
                <p className="text-gray-400 text-xs mt-1">Add what the candidate will be responsible for</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Qualifications Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.5s' }}>
        <div className="bg-gradient-to-r from-success-50 to-success-100 px-6 py-4 border-b border-success-100">
          <h3 className="text-lg font-semibold text-success-800 flex items-center">
            <QualificationsIcon className="h-5 w-5 mr-2 text-success-600" />
            Education & Certifications
          </h3>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">Specify any formal education, degrees, or certifications required</p>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-gray-700 flex items-center">
                <QualificationsIcon className="h-4 w-4 mr-2 text-success-500" />
                Qualifications Details
              </span>
              <span className="label-text-alt text-success-600 text-sm">Optional but helpful for filtering</span>
            </label>
            <div className="relative">
              <textarea
                name="qualifications"
                value={formData.qualifications}
                onChange={handleQualificationsChange}
                onFocus={() => handleFocus('qualifications')}
                onBlur={handleBlur}
                placeholder="e.g. Bachelor's degree in Computer Science or related field. PMP certification preferred. Master's degree advantageous."
                className={`textarea textarea-bordered w-full transition-all duration-200 hover:border-success-300 focus:border-success-500 focus:ring-2 focus:ring-success-200 min-h-32 ${focusedField === 'qualifications' ? 'shadow-lg scale-105' : ''}`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Mention degrees, certifications, licenses, or other formal qualifications needed for this position.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequirementsResponsibilities;
