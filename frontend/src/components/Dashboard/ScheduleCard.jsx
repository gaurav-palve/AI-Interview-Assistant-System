import React, { useState } from 'react';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

/**
 * ScheduleCard component for displaying a calendar with scheduled events
 * @param {Object} props - Component props
 * @param {Array} props.events - Array of event objects to display
 * @param {Date} props.currentDate - Current date to display (default: new Date())
 */
const ScheduleCard = ({ events = [], currentDate = new Date() }) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [notifications, setNotifications] = useState([]);
  
  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      day: '2-digit',
      month: 'short'
    });
  };

  // Format date range for display
  const formatDateRange = () => {
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday of current week
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // Sunday of current week
    
    const startMonth = startDate.toLocaleString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = endDate.getFullYear().toString().substr(-2); // Last 2 digits of year
    
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} '${year}`;
  };

  // Generate days for the week
  const generateWeekDays = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => (
      <div key={day} className="text-center text-xs">
        {day}
      </div>
    ));
  };

  // Generate dates for the week
  const generateWeekDates = () => {
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday of current week
    
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const hasNotification = events.some(event => new Date(event.date).toDateString() === date.toDateString());
      
      return (
        <div key={index} className="text-center">
          <div 
            className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full cursor-pointer
              ${isSelected ? 'bg-blue-500 text-white' : 
                isToday ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}
              ${hasNotification ? 'ring-2 ring-blue-300' : ''}
              transition-all duration-200`}
            onClick={() => setSelectedDate(date)}
          >
            {date.getDate()}
          </div>
        </div>
      );
    });
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  // Default events if none provided
  const defaultEvents = [
    { 
      id: 1, 
      title: 'Frontend Developer', 
      candidate: 'Gaurav Palve', 
      time: '11:00AM - 12:00PM', 
      date: new Date(),
      day: 'Wed'
    },
    { 
      id: 2, 
      title: 'UX/UI Designer', 
      candidate: 'Sumeet Patil', 
      time: '11:00AM - 12:00PM', 
      date: new Date(),
      day: 'Wed'
    }
  ];

  // Filter events for the selected date
  const filteredEvents = events.length > 0 
    ? events.filter(event => new Date(event.date).toDateString() === selectedDate.toDateString())
    : defaultEvents;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Schedule</h3>
        <div className="flex items-center">
          <ArrowBack 
            className="text-gray-400 cursor-pointer hover:text-gray-600" 
            onClick={goToPreviousWeek}
          />
          <span className="mx-2 text-sm">{formatDateRange()}</span>
          <ArrowForward 
            className="text-gray-400 cursor-pointer hover:text-gray-600" 
            onClick={goToNextWeek}
          />
        </div>
      </div>
      
      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {generateWeekDays()}
      </div>
      
      {/* Calendar dates */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {generateWeekDates()}
      </div>
      
      {/* Date indicator */}
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">
          Selected: <span className="font-semibold">{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </p>
      </div>
      
      {/* Events */}
      <div className="space-y-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-xs text-blue-500">{event.candidate}</p>
                </div>
                <p className="text-xs text-gray-500">{event.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No events scheduled for this date</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;