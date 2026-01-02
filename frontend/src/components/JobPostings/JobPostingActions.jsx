import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusChangeMenu from './StatusChangeMenu';

// MUI Icons
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as AssignIcon,
  SwapHoriz as StatusIcon
} from '@mui/icons-material';

/**
 * JobPostingActions component
 * Provides a dropdown menu with actions for job postings:
 * - Edit Post
 * - Delete Post
 * - Assign
 * - Change Status
 */
const JobPostingActions = ({ 
  job, 
  onDelete, 
  onAssign, 
  onChangeStatus,
  canEdit,
  canDelete,
  canChangeStatus,
  canAssign
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Handle edit post
  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    navigate(`/job-postings/${job.id}/edit`);
  };

  // Handle delete post
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    if (onDelete) {
      onDelete(job.id);
    }
  };

  // Handle assign users
  const handleAssign = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    if (onAssign) {
      onAssign(job);
    }
  };

  // Handle change status
  const handleChangeStatus = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setShowStatusMenu(true);
  };

  // Handle status selection
  const handleStatusSelection = (jobId, newStatus) => {
    if (onChangeStatus) {
      onChangeStatus(jobId, newStatus);
    }
    setShowStatusMenu(false);
  };

  // Close status menu
  const closeStatusMenu = () => {
    setShowStatusMenu(false);
  };

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowStatusMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" style={{zIndex:50}} ref={menuRef}>
      {/* Action button (three dots) */}
      {(canEdit || canDelete || canChangeStatus || canAssign) && (
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors duration-300"
        aria-label="Job posting actions"
      >
        <MoreIcon className="h-5 w-5" />
      </button>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-0 right-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn mt-8">
          {canEdit && (
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left flex items-center hover:bg-primary-50 transition-colors"
            >
              <EditIcon className="h-4 w-4 mr-2 text-primary-500" />
              <span>Edit Post</span>
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left flex items-center hover:bg-red-50 transition-colors"
            >
              <DeleteIcon className="h-4 w-4 mr-2 text-red-500" />
              <span>Delete Post</span>
            </button>
          )}

          {/* {canAssign && ( */}
          <button
            onClick={handleAssign}
            className="w-full px-4 py-2 text-left flex items-center hover:bg-primary-50 transition-colors"
          >
            <AssignIcon className="h-4 w-4 mr-2 text-primary-500" />
            <span>Assign</span>
          </button>
          {/* )} */}

          {canChangeStatus && (
          <button
            onClick={handleChangeStatus}
            className="w-full px-4 py-2 text-left flex items-center hover:bg-primary-50 transition-colors"
          >
            <StatusIcon className="h-4 w-4 mr-2 text-primary-500" />
            <span>Change Status</span>
          </button>
          )}
        </div>
      )}

      {/* Status Change Menu */}
      {showStatusMenu && (
        <StatusChangeMenu
          job={job}
          onStatusChange={handleStatusSelection}
          onClose={closeStatusMenu}
        />
      )}
    </div>
  );
};

export default JobPostingActions;