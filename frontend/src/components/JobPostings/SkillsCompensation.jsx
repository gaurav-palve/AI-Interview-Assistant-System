import { useState } from 'react';
import {
  AttachMoney as CompensationIcon,
  Code as SkillsIcon,
  Add as AddIcon,
  Close as RemoveIcon,
  TrendingUp as LevelIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

/**
 * SkillsCompensation component
 * Second step of the job posting creation form
 */
function SkillsCompensation({ formData, handleChange }) {
  const [newRequiredSkill, setNewRequiredSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

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
    <div className="space-y-8 p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center mb-3 animate-fadeIn">
          <div className="bg-gradient-to-r from-accent-500 to-accent-600 p-2 rounded-lg mr-3 shadow-lg">
            <SkillsIcon className="h-7 w-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent font-serif">
            Skills & Compensation
          </span>
        </h2>
        <p className="text-gray-600 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Define the skills required and compensation details for your job posting
        </p>
      </div>

      {/* Skills Section - Combined Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.3s' }}>
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 px-6 py-4 border-b border-accent-100">
          <h3 className="text-lg font-semibold text-accent-800 flex items-center">
            <LevelIcon className="h-5 w-5 mr-2 text-accent-600" />
            Professional Skills
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Required Skills */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center">
                  <div className="w-2 h-2 bg-danger-500 rounded-full mr-2"></div>
                  Required Skills
                </span>
                <span className="label-text-alt text-accent-600 text-sm">Essential for the role</span>
              </label>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newRequiredSkill}
                    onChange={(e) => setNewRequiredSkill(e.target.value)}
                    onFocus={() => handleFocus('required_skill')}
                    onBlur={handleBlur}
                    onKeyPress={(e) => handleKeyPress(e, 'required')}
                    placeholder="e.g. Python, React, Leadership"
                    className={`input input-bordered w-full pl-4 pr-12 transition-all duration-200 hover:border-accent-300 focus:border-accent-500 focus:ring-2 focus:ring-accent-200 ${focusedField === 'required_skill' ? 'shadow-lg scale-105' : ''}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={addRequiredSkill}
                  disabled={!newRequiredSkill.trim()}
                  className="btn btn-accent transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AddIcon className="h-5 w-5" />
                </button>
              </div>

              {formData.required_skills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {formData.required_skills.map((skill, index) => (
                    <div
                      key={index}
                      className="badge badge-accent badge-lg gap-2 py-3 px-4 transition-all duration-200 hover:scale-105 hover:shadow-md group cursor-pointer"
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
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-accent-200 rounded-lg">
                  <SkillsIcon className="h-8 w-8 text-accent-300 mx-auto mb-2" />
                  <p className="text-accent-500 text-sm">No required skills added yet</p>
                  <p className="text-gray-400 text-xs mt-1">Add the essential skills for this position</p>
                </div>
              )}
            </div>

            {/* Preferred Skills */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center">
                  <div className="w-2 h-2 bg-warning-500 rounded-full mr-2"></div>
                  Preferred Skills
                </span>
                <span className="label-text-alt text-secondary-600 text-sm">Nice to have</span>
              </label>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newPreferredSkill}
                    onChange={(e) => setNewPreferredSkill(e.target.value)}
                    onFocus={() => handleFocus('preferred_skill')}
                    onBlur={handleBlur}
                    onKeyPress={(e) => handleKeyPress(e, 'preferred')}
                    placeholder="e.g. AWS, Docker, Agile"
                    className={`input input-bordered w-full pl-4 pr-12 transition-all duration-200 hover:border-secondary-300 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${focusedField === 'preferred_skill' ? 'shadow-lg scale-105' : ''}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={addPreferredSkill}
                  disabled={!newPreferredSkill.trim()}
                  className="btn btn-secondary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AddIcon className="h-5 w-5" />
                </button>
              </div>

              {formData.preferred_skills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {formData.preferred_skills.map((skill, index) => (
                    <div
                      key={index}
                      className="badge badge-secondary badge-lg gap-2 py-3 px-4 transition-all duration-200 hover:scale-105 hover:shadow-md group cursor-pointer"
                    >
                      <span className="font-medium">{skill}</span>
                      <button
                        type="button"
                        onClick={() => removePreferredSkill(index)}
                        className="btn btn-xs btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <RemoveIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-secondary-200 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-secondary-500 text-sm">No preferred skills added yet</p>
                  <p className="text-gray-400 text-xs mt-1">Add skills that would be a plus</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compensation Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn" style={{ animationDelay: '0.4s' }}>
        <div className="bg-gradient-to-r from-warning-50 to-warning-100 px-6 py-4 border-b border-warning-100">
          <h3 className="text-lg font-semibold text-warning-800 flex items-center">
            <Payment className="h-5 w-5 mr-2 text-warning-600" />
            Compensation Details
          </h3>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-4">Set the salary range for this position (optional)</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Salary Minimum */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700 flex items-center">
                    <CompensationIcon className="h-4 w-4 mr-2 text-warning-500" />
                    Minimum Salary
                  </span>
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === 'salary_min' ? 'text-warning-500' : 'text-gray-400'}`}>
                    <span className="text-sm font-medium">$</span>
                  </div>
                  <input
                    type="text"
                    name="salary_min"
                    value={formData.salary_min}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('salary_min')}
                    onBlur={handleBlur}
                    placeholder="e.g. 50000"
                    className={`input input-bordered w-full pl-12 transition-all duration-200 hover:border-warning-300 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 ${errors.salary_min ? 'input-error border-danger-500' : ''} ${focusedField === 'salary_min' ? 'shadow-lg scale-105' : ''}`}
                  />
                </div>
                {errors.salary_min && (
                  <p className="text-xs text-danger-600 mt-2 flex items-center animate-slideIn">
                    <div className="w-1 h-1 bg-danger-500 rounded-full mr-2"></div>
                    {errors.salary_min}
                  </p>
                )}
              </div>

              {/* Salary Maximum */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700 flex items-center">
                    <CompensationIcon className="h-4 w-4 mr-2 text-warning-500" />
                    Maximum Salary
                  </span>
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === 'salary_max' ? 'text-warning-500' : 'text-gray-400'}`}>
                    <span className="text-sm font-medium">$</span>
                  </div>
                  <input
                    type="text"
                    name="salary_max"
                    value={formData.salary_max}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('salary_max')}
                    onBlur={handleBlur}
                    placeholder="e.g. 75000"
                    className={`input input-bordered w-full pl-12 transition-all duration-200 hover:border-warning-300 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 ${errors.salary_max ? 'input-error border-danger-500' : ''} ${focusedField === 'salary_max' ? 'shadow-lg scale-105' : ''}`}
                  />
                </div>
                {errors.salary_max && (
                  <p className="text-xs text-danger-600 mt-2 flex items-center animate-slideIn">
                    <div className="w-1 h-1 bg-danger-500 rounded-full mr-2"></div>
                    {errors.salary_max}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Currency */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Currency</span>
                </label>
                <select
                  name="salary_currency"
                  value={formData.salary_currency}
                  onChange={handleInputChange}
                  className="select select-bordered w-full transition-all duration-200 hover:border-warning-300 focus:border-warning-500 focus:ring-2 focus:ring-warning-200"
                >
                  <option value="USD">🇺🇸 USD - US Dollar</option>
                  <option value="EUR">🇪🇺 EUR - Euro</option>
                  <option value="GBP">🇬🇧 GBP - British Pound</option>
                  <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                  <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                  <option value="INR">🇮🇳 INR - Indian Rupee</option>
                  <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                  <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                </select>
              </div>

              {/* Salary Period */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Salary Period</span>
                </label>
                <select
                  name="salary_period"
                  value={formData.salary_period}
                  onChange={handleInputChange}
                  className="select select-bordered w-full transition-all duration-200 hover:border-warning-300 focus:border-warning-500 focus:ring-2 focus:ring-warning-200"
                >
                  <option value="yearly">📅 Yearly</option>
                  <option value="monthly">📆 Monthly</option>
                  <option value="weekly">📊 Weekly</option>
                  <option value="hourly">⏱️ Hourly</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillsCompensation;
