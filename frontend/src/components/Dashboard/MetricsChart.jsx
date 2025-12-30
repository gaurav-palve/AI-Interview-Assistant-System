import React from 'react';

/**
 * MetricsChart component for displaying a circular chart with metrics
 * @param {Object} props - Component props
 * @param {Array} props.metrics - Array of metric objects to display
 */
const MetricsChart = ({ metrics = [] }) => {
  // Default metrics if none provided
  const defaultMetrics = [
    { label: 'Metrics', value: 1 },
    { label: 'Metrics', value: 2 },
    { label: 'Metrics', value: 3 },
    { label: 'Metrics', value: 4 },
    { label: 'Metrics', value: 5 }
  ];

  const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Metrics</h3>
      </div>
      
      <div className="relative flex justify-center items-center">
        {/* Large circular background */}
        <div className="w-64 h-64 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-8xl font-light text-gray-300">C</span>
        </div>
        
        {/* Metrics positioned around the circle */}
        <div className="absolute grid grid-cols-1 gap-4 w-full max-w-xs">
          {displayMetrics.map((metric, index) => {
            // Position metrics at different locations around the circle
            const positions = [
              "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "top-1/4 right-0 translate-x-1/2",
              "bottom-1/4 right-0 translate-x-1/2",
              "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
              "top-1/4 left-0 -translate-x-1/2"
            ];
            
            const position = positions[index % positions.length];
            
            return (
              <div 
                key={index} 
                className={`absolute bg-gray-50 p-3 rounded flex items-center ${position}`}
              >
                <div className="w-3 h-3 bg-gray-200 rounded-sm mr-2"></div>
                <span className="text-sm text-gray-600">{metric.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MetricsChart;