import { useState } from 'react';
import { 
  Assignment as RequirementsIcon,
  Add as AddIcon,
  Close as RemoveIcon,
  School as QualificationsIcon
} from '@mui/icons-material';

/**
 * RequirementsResponsibilities component
 * Third step of the job posting creation form
 */
function RequirementsResponsibilities({ formData, handleChange }) {
  const [newRequirement, setNewRequirement] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');

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
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
        <RequirementsIcon className="h-6 w-6 mr-2 text-primary-600" />
        <span className="text-gray-800 font-serif">Requirements & Responsibilities</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requirements */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Requirements</span>
          </label>
          <div className="flex">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'requirement')}
              placeholder="e.g. 3+ years of experience in HR"
              className="input input-bordered flex-grow"
            />
            <button 
              type="button" 
              onClick={addRequirement}
              className="btn btn-primary ml-2"
            >
              <AddIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3">
            {formData.requirements.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {formData.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start group">
                    <span className="flex-grow">{requirement}</span>
                    <button 
                      type="button" 
                      onClick={() => removeRequirement(index)}
                      className="btn btn-xs btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RemoveIcon className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No requirements added yet.</p>
            )}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Responsibilities</span>
          </label>
          <div className="flex">
            <input
              type="text"
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'responsibility')}
              placeholder="e.g. Manage employee onboarding process"
              className="input input-bordered flex-grow"
            />
            <button 
              type="button" 
              onClick={addResponsibility}
              className="btn btn-primary ml-2"
            >
              <AddIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3">
            {formData.responsibilities.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {formData.responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start group">
                    <span className="flex-grow">{responsibility}</span>
                    <button 
                      type="button" 
                      onClick={() => removeResponsibility(index)}
                      className="btn btn-xs btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RemoveIcon className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No responsibilities added yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
          <QualificationsIcon className="h-6 w-6 mr-2 text-primary-600" />
          <span className="text-gray-800 font-serif">Qualifications</span>
        </h3>

        {/* Qualifications */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Education & Certifications</span>
          </label>
          <textarea
            name="qualifications"
            value={formData.qualifications}
            onChange={handleQualificationsChange}
            placeholder="e.g. Bachelor's degree in Human Resources or related field. SHRM certification preferred."
            className="textarea textarea-bordered h-32"
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            Enter any educational requirements, certifications, or other qualifications needed for this position.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RequirementsResponsibilities;