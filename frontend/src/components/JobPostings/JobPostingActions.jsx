import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusChangeMenu from './StatusChangeMenu';
import Popover from "@mui/material/Popover";

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
  // const [isOpen, setIsOpen] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  // const menuRef = useRef(null);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);


  // Handle edit post
  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
    navigate(`/job-postings/${job.id}/edit`);
  };

  // Handle delete post
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
    if (onDelete) {
      onDelete(job.id);
    }
  };

  // Handle assign users
  const handleAssign = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
    if (onAssign) {
      onAssign(job);
    }
  };

  // Handle change status
  const handleChangeStatus = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
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
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (menuRef.current && !menuRef.current.contains(event.target)) {
  //       setIsOpen(false);
  //       setShowStatusMenu(false);
  //     }
  //   };
    
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);

  return (
    <div className="relative">
      {/* Action button (three dots) */}
      {(canEdit || canDelete || canChangeStatus || canAssign) && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-200"
        >
          <MoreIcon />
        </button>

      )}

      {/* Dropdown menu */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        disablePortal={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: 200,
            boxShadow: 6,
          },
        }}
      >
        {canEdit && (
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 flex items-center hover:bg-gray-100"
          >
            <EditIcon className="mr-2 text-primary-500" />
            Edit Post
          </button>
        )}

        {canDelete && (
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 flex items-center hover:bg-red-50"
          >
            <DeleteIcon className="mr-2 text-red-500" />
            Delete Post
          </button>
        )}

        <button
          onClick={handleAssign}
          className="w-full px-4 py-2 flex items-center hover:bg-gray-100"
        >
          <AssignIcon className="mr-2 text-primary-500" />
          Assign
        </button>

        {canChangeStatus && (
          <button
            onClick={handleChangeStatus}
            className="w-full px-4 py-2 flex items-center hover:bg-gray-100"
          >
            <StatusIcon className="mr-2 text-primary-500" />
            Change Status
          </button>
        )}
      </Popover>

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