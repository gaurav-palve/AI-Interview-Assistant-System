import React from 'react';
import { ArrowForward } from '@mui/icons-material';

const StatCard = ({
  icon,
  count,
  label,
  backgroundColor = '#ffffffff',
  hoverBackgroundColor = '#95b1d9ff', // dark gray example
  textColor = 'text-white',
  iconColor = 'text-black',
  hasArrow = true,
  onClick = null
}) => {
  const [bgColor, setBgColor] = React.useState(backgroundColor);

  return (
    <div
      className={`
        rounded-lg
        p-4
        h-full
        shadow--sm
        transition-colors
        duration-300
        cursor-pointer
        border-2 border-transparent
        hover:border-2 hover:border-[#2563EB]

        /* 👇 ADDED */
        flex flex-row items-center justify-between
        min-h-[96px]

        ${backgroundColor || "bg-white"}
        ${hoverBackgroundColor || "hover:bg-blue-500"}
      `}
    >
      {/* LEFT CONTENT */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <div className={`p-0 rounded-md ${iconColor}`}>
            {icon}
          </div>

          <h2 className={`text-2xl font-bold ${textColor}`}>
            {String(count).includes('/') ? (
              <>
                {count.split('/')[0]}{'/'}
                <span className="text-[#E0E0E0] font-medium">
                  {count.split('/')[1]}
                </span>
              </>
            ) : (
              count
            )}
          </h2>
        </div>

        <p className={`text-sm mt-1 ${textColor} opacity-80`}>
          {label}
        </p>
      </div>

      {/* RIGHT ARROW */}
      {hasArrow && (
        <ArrowForward
          className={`${textColor} cursor-pointer hover:opacity-80`}
          onClick={onClick}
        />
      )}
    </div>
  );
};

export default StatCard;
