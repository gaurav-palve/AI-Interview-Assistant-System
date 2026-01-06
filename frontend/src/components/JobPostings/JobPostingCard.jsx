import React from 'react';
import { Link } from 'react-router-dom';
import JobPostingActions from './JobPostingActions';
import Tooltip from '@mui/material/Tooltip';
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import CompanyLogo from "../../assets/Nts_logo/CompanyLogo.png";
import Popover from "@mui/material/Popover";




// MUI Icons
import {
  Work as WorkIcon,
  LocationOnOutlined as LocationIcon,
  AccessTime as TimeIcon,
  GroupOutlined as GroupIcon,
  CalendarToday as CalendarIcon,
  Folder as FolderIcon,
  Check as CheckIcon,
  Close as CrossIcon,
} from '@mui/icons-material';

const JobPostingCard = ({
  job,
  onDelete,
  onAssign,
  onChangeStatus,
  canEdit,
  canDelete,
  canChangeStatus,
  canAssign,
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString || Date.now());
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getStatusConfig = (status) => {
    const statusConfigs = {
      active: { label: 'Active', textColor: 'text-green-600' },
      draft: { label: 'Draft', textColor: 'text-yellow-700' },
      closed: { label: 'Closed', textColor: 'text-red-700' },
      archived: { label: 'Archived', textColor: 'text-gray-700' },
    };
    return statusConfigs[status] || statusConfigs.active;
  };

  const statusConfig = getStatusConfig(job.status);

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleEnter = (event) => setAnchorEl(event.currentTarget);
  const handleLeave = () => setAnchorEl(null);

  const open = Boolean(anchorEl);


  return (
    <Link
      to={`/job-postings/${job.id}`}
      className="group relative bg-white border border-gray-100 rounded-lg
                 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl
                 animate-slideInUp cursor-pointer w-full h-full block animate-slideInUp cursor-pointer w-full h-full block overflow-visible"
    >
      <div className="p-2 h-full flex flex-col relative">

        {/* Header */}
        <div className="flex items-start justify-between ">
          <div className="flex items-start">
            <div className="flex-shrink-0 rounded-lg p-2.5 mr-3 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-200 ">
              <img
                src={CompanyLogo}
                alt="Company Logo"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div>
             

              <Tooltip
                title={job.job_title || 'Job Posting Name'}
                placement="top"
                arrow={false}   // no arrow = no border feel
                sx={{
                  '& .MuiTooltip-tooltip': {
                    backgroundColor: '#111827',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
                    border: 'none', // explicitly no border
                  },
                }}
              >
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1 cursor-pointer">
                  {job.job_title || 'Job Posting Name'}
                </h3>
              </Tooltip>



              <div className="flex items-center">
                <Tooltip
                  title={job.company || "Name of the org"}
                  placement="right"
                  arrow={false}
                  sx={{
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <span className="text-xs text-blue-500 whitespace-nowrap cursor-pointer">
                    {(job.company || "Name of the org").length > 15
                      ? `${job.company.slice(0, 15)}...`
                      : job.company}
                  </span>
                </Tooltip>

            



                <div className={`flex items-center ml-2 ${statusConfig.textColor} text-[12px]`}>
                  {statusConfig.label === 'Active' ? (
                    <CheckIcon
                      className="mr-0.5"
                      sx={{
                        border: '2px solid #16A34A ',
                        borderRadius: '50%',
                        fontSize: 12,
                      }}
                    />
                  ) : (
                    <CrossIcon
                      className="mr-0.5"
                      sx={{
                        border: '2px solid',
                        borderRadius: '50%',
                        fontSize: 12,
                      }}
                    />
                  )}
                  {statusConfig.label}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="relative z-[9999]"
          >
            <JobPostingActions
              job={job}
              onDelete={onDelete}
              onAssign={onAssign}
              onChangeStatus={onChangeStatus}
              canEdit={canEdit}
              canDelete={canDelete}
              canChangeStatus={canChangeStatus}
              canAssign={canAssign}
            />
          </div>
        </div>

        {/* Job Details */}
        <div className="flex items-center mt-2 mb-2 w-full justify-start gap-0 pr-8">


          <div className="flex items-center whitespace-nowrap">
            <BusinessCenterOutlinedIcon sx={{ fontSize: 18 }}className="text-gray-500 mr-1" />
            <span className="text-xs text-gray-600">
              {job.experience && String(job.experience).trim() !== ""
                ? `${job.experience} Yrs`
                : "Not Defined"}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-gray-400 mx-3 flex-shrink-0" />

          <div className="flex items-center whitespace-nowrap">
            <TimeIcon sx={{ fontSize: 18 }} className="text-gray-500 mr-1" />
            <span className="text-xs text-gray-600">
              {job.job_type}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-gray-400 mx-3 flex-shrink-0" />

          <div className="flex items-center whitespace-nowrap">
            <LocationIcon sx={{ fontSize: 18 }}className="text-gray-500 mr-1" />
            <span className="text-xs text-gray-600">
              {job.work_location}
            </span>
          </div>

        </div>



        {/* Skills */}
        <div className="flex items-center gap-2 mb-2 flex-nowrap overflow-hidden" >
          {job.skills?.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-[10px] bg-gray-100 text-gray-700 rounded-lg whitespace-nowrap flex-shrink-0"
            >
              {skill}
            </span>
          ))}

          {job.skills?.length > 3 && (
            <span className="px-2 py-1 text-[10px] bg-gray-100 text-gray-700 rounded-lg whitespace-nowrap flex-shrink-0" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
              +{job.skills.length - 3} more
            </span>
          )}
        </div>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleLeave}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          disableRestoreFocus
          sx={{
            pointerEvents: "none",
          }}
        >
          <div className="p-3 max-w-xs">
            <p className="text-xs font-semibold mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {job.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-[10px] bg-gray-100 text-gray-700 rounded-lg"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </Popover>


        {/* Bottom Section */}
        <div className="mt-auto w-full">
          <div className="border-t border-gray-200" />

          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <div className="flex items-center text-gray-600">
              <GroupIcon sx={{ fontSize: 18 }} className="mr-1 text-gray-500" />
              <span className="font-medium text-gray-600">{job.applicants_count || 0}</span>
              &nbsp;Applicants 
            </div>

            <div className="flex items-center text-gray-600">
              <CalendarIcon sx={{ fontSize: 16 }}className="mr-1 text-gray-500" />
              {formatDate(job.created_at)}
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default JobPostingCard;
