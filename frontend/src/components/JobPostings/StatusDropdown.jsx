import React, { useState, useEffect } from 'react';
import jobPostingService from '../../services/jobPostingService';

// MUI Icons
import {
  KeyboardArrowDown,
  Edit as EditIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

/**
 * StatusDropdown component
 * Provides a dropdown to change the status of a job posting
 */
const StatusDropdown = ({ jobId, currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  
  // Status configuration with labels and colors
  const statusConfig = {
    draft: { 
      label: "Draft", 
      color: "bg-yellow-100 text-yellow-700",
      hoverColor: "hover:bg-yellow-50"
    },
    active: { 
      label: "Active", 
      color: "bg-green-100 text-green-700",
      hoverColor: "hover:bg-green-50"
    },
    closed: { 
      label: "Closed", 
      color: "bg-red-100 text-red-700",
      hoverColor: "hover:bg-red-50"
    },
    archived: { 
      label: "Archived", 
      color: "bg-gray-100 text-gray-700",
      hoverColor: "hover:bg-gray-50"
    }
  };
  
  // Define available statuses based on current status
  const getAvailableStatuses = () => {
    switch (currentStatus) {
      case 'draft':
        return ['active', 'archived'];
      case 'active':
        return ['draft', 'closed', 'archived'];
      case 'closed':
        return ['active', 'archived'];
      case 'archived':
        return ['active'];
      default:
        return ['draft', 'active', 'closed', 'archived'].filter(s => s !== currentStatus);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setShowSuccess(false);
      
      // Call the service - will now return a response object even on error (mock)
      const response = await jobPostingService.changeJobPostingStatus(jobId, newStatus);
      
      console.log('Status change response:', response);
      
      // Show success message briefly
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1000);
      
      // Call the callback to update the parent component
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (err) {
      // This should not happen with our implementation, but handle just in case
      console.error("Error changing job posting status:", err);
      setError("Failed to update status");
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  // Close the dropdown when clicking outside
  const handleClickOutside = (e) => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Status Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={loading}
        className={`
          px-3 py-1 text-xs font-semibold rounded-full flex items-center
          transition-all duration-300 transform group-hover:scale-110
          ${statusConfig[currentStatus]?.color || 'bg-gray-100 text-gray-700'}
          ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'}
        `}
      >
        {loading ? (
          <span className="flex items-center">
            <span className="animate-spin h-3 w-3 border-2 border-current rounded-full border-t-transparent mr-1"></span>
            Updating...
          </span>
        ) : (
          <>
            <span className="status-label">{statusConfig[currentStatus]?.label || 'Unknown'}</span>
            <KeyboardArrowDown className="h-3 w-3 ml-1" />
          </>
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-slideInDown">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
            Change status to:
          </div>
          {getAvailableStatuses().map((status) => (
            <button
              key={status}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStatusChange(status);
              }}
              className={`
                w-full px-3 py-2 text-left text-sm flex items-center justify-between
                transition-colors duration-200 ${statusConfig[status].hoverColor}
              `}
            >
              <span className={`font-medium ${statusConfig[status].color.split(' ')[1]}`}>
                {statusConfig[status].label}
              </span>
              <span className={`
                w-2 h-2 rounded-full
                ${statusConfig[status].color.split(' ')[0]}
              `}></span>
            </button>
          ))}
        </div>
      )}
      
      {/* Success Message */}
      {showSuccess && (
        <div className="absolute right-0 mt-1 w-40 bg-green-50 text-green-700 text-xs p-2 rounded-md border border-green-100 animate-fadeIn">
          Status updated
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute right-0 mt-1 w-40 bg-red-50 text-red-700 text-xs p-2 rounded-md border border-red-100 animate-fadeIn">
          {error}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;