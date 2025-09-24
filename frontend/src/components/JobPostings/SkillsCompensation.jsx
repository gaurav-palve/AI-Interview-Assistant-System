import { useState } from 'react';
import { 
  AttachMoney as CompensationIcon,
  Code as SkillsIcon,
  Add as AddIcon,
  Close as RemoveIcon
} from '@mui/icons-material';

/**
 * SkillsCompensation component
 * Second step of the job posting creation form
 */
function SkillsCompensation({ formData, handleChange }) {
  const [newRequiredSkill, setNewRequiredSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [errors, setErrors] = useState({});

  // Add a required skill
  const addRequiredSkill = () => {
    if (!newRequiredSkill.trim()) return;
    
    const updatedSkills = [...formData.required_skills, newRequiredSkill.trim()];
    handleChange('required_skills', updatedSkills);
    setNewRequiredSkill('');
  };

  // Remove a required skill
  const removeRequiredSkill = (index) => {
    const updatedSkills = [...formData.required_skills];
    updatedSkills.splice(index, 1);
    handleChange('required_skills', updatedSkills);
  };

  // Add a preferred skill
  const addPreferredSkill = () => {
    if (!newPreferredSkill.trim()) return;
    
    const updatedSkills = [...formData.preferred_skills, newPreferredSkill.trim()];
    handleChange('preferred_skills', updatedSkills);
    setNewPreferredSkill('');
  };

  // Remove a preferred skill
  const removePreferredSkill = (index) => {
    const updatedSkills = [...formData.preferred_skills];
    updatedSkills.splice(index, 1);
    handleChange('preferred_skills', updatedSkills);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate salary inputs to ensure they're numbers
    if (['salary_min', 'salary_max'].includes(name)) {
      if (value && !/^\d+$/.test(value)) {
        setErrors(prev => ({ ...prev, [name]: 'Please enter a valid number' }));
        return;
      } else {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    }
    
    handleChange(name, value);
  };

  // Handle key press for adding skills
  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'required') {
        addRequiredSkill();
      } else {
        addPreferredSkill();
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
        <SkillsIcon className="h-6 w-6 mr-2 text-primary-600" />
        <span className="text-gray-800 font-serif">Skills & Qualifications</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Skills */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Required Skills</span>
          </label>
          <div className="flex">
            <input
              type="text"
              value={newRequiredSkill}
              onChange={(e) => setNewRequiredSkill(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'required')}
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

        {/* Preferred Skills */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Preferred Skills</span>
          </label>
          <div className="flex">
            <input
              type="text"
              value={newPreferredSkill}
              onChange={(e) => setNewPreferredSkill(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'preferred')}
              placeholder="e.g. React"
              className="input input-bordered flex-grow"
            />
            <button 
              type="button" 
              onClick={addPreferredSkill}
              className="btn btn-primary ml-2"
            >
              <AddIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.preferred_skills.map((skill, index) => (
              <div 
                key={index} 
                className="badge badge-secondary badge-lg gap-2 py-3"
              >
                {skill}
                <button 
                  type="button" 
                  onClick={() => removePreferredSkill(index)}
                  className="btn btn-xs btn-circle btn-ghost"
                >
                  <RemoveIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
          <CompensationIcon className="h-6 w-6 mr-2 text-primary-600" />
          <span className="text-gray-800 font-serif">Compensation</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Salary Range */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Minimum Salary</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CompensationIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleInputChange}
                placeholder="e.g. 50000"
                className={`input input-bordered w-full pl-10 ${errors.salary_min ? 'input-error' : ''}`}
              />
            </div>
            {errors.salary_min && <p className="text-xs text-error mt-1">{errors.salary_min}</p>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Maximum Salary</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CompensationIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleInputChange}
                placeholder="e.g. 70000"
                className={`input input-bordered w-full pl-10 ${errors.salary_max ? 'input-error' : ''}`}
              />
            </div>
            {errors.salary_max && <p className="text-xs text-error mt-1">{errors.salary_max}</p>}
          </div>

          {/* Salary Currency */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Currency</span>
            </label>
            <select
              name="salary_currency"
              value={formData.salary_currency}
              onChange={handleInputChange}
              className="select select-bordered w-full"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CNY">CNY - Chinese Yuan</option>
            </select>
          </div>

          {/* Salary Period */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Period</span>
            </label>
            <select
              name="salary_period"
              value={formData.salary_period}
              onChange={handleInputChange}
              className="select select-bordered w-full"
            >
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillsCompensation;