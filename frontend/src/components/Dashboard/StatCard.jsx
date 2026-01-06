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
      // style={{ backgroundColor: bgColor }}
      // onMouseEnter={() => setBgColor(hoverBackgroundColor)}
      // onMouseLeave={() => {setBgColor(backgroundColor);console.log(backgroundColor);}}
      // onMouseDown={() => setBgColor(backgroundColor)}
      className={`rounded-lg p-4 flex flex-col justify-between h-full shadow--sm transition-colors duration-300 cursor-pointer border border-transparent hover:border-2 hover:border-blue-500 ${backgroundColor || "bg-white"} ${hoverBackgroundColor || "hover:bg-blue-500"}`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-md ${iconColor}`}>
          {icon}
        </div>

        {hasArrow && (
          <ArrowForward
            className={`${textColor} cursor-pointer hover:opacity-80`}
            onClick={onClick}
          />
        )}
      </div>

      <div className="mt-4">
        <h2 className={`text-3xl font-bold ${textColor}`}>
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

        <p className={`text-sm ${textColor} opacity-80`}>{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
