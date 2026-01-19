import React, { useRef, useEffect } from "react";

/**
 * StatusChangeMenu component
 * Provides a dropdown menu for changing job posting status
 */
const StatusChangeMenu = ({ job, onStatusChange, onClose }) => {

  const dropdownRef = useRef(null); // ✅ inside component

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

  const getAvailableStatuses = () => {
    switch (job.status) {
      case 'draft':
        return ['active', 'archived'];
      case 'active':
        return ['draft', 'closed', 'archived'];
      case 'closed':
        return ['active', 'archived'];
      case 'archived':
        return ['active'];
      default:
        return ['draft', 'active', 'closed', 'archived']
          .filter(s => s !== job.status);
    }
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(job.id, newStatus);
    onClose(); // close after select
  };

  // ✅ Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        onClose(); // close dropdown
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div  
      ref={dropdownRef}
      className="absolute top-0 right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-slideInDown mt-8"
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
        Change status to:
      </div>

      {getAvailableStatuses().map((status) => (
        <button
          key={status}
          onClick={() => handleStatusChange(status)}
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
  );
};

export default StatusChangeMenu;
