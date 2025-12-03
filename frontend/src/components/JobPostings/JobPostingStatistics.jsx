import { useEffect, useState, useRef } from 'react';
import jobPostingService from '../../services/jobPostingService';

/**
 * Enhanced statistics component with modern donut chart visualization
 * Now with animated segments
 */
export default function JobPostingStatistics({ jobPostingId }) {
  const [stats, setStats] = useState(null);
  const [chartAnimated, setChartAnimated] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobPostingId) return;
    fetchStats(jobPostingId);
  }, [jobPostingId]);

  // Trigger chart animation after component mounts and data is loaded
  useEffect(() => {
    if (stats) {
      // Add a small delay before starting the animation
      const timer = setTimeout(() => {
        setChartAnimated(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [stats]);

  const fetchStats = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobPostingService.getJobPostingStatistics(id);
      setStats(data || {});
    } catch (err) {
      console.error('Failed to fetch job posting statistics', err);
      setError(err.detail || err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert polar coordinates to cartesian
  const polarToCartesian = (centerX, centerY, radius, angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad)
    };
  };

  // Helper function to create SVG arc path
  const createArc = (startAngle, endAngle, innerRadius, outerRadius) => {
    const start = polarToCartesian(100, 100, outerRadius, endAngle);
    const end = polarToCartesian(100, 100, outerRadius, startAngle);
    const innerStart = polarToCartesian(100, 100, innerRadius, endAngle);
    const innerEnd = polarToCartesian(100, 100, innerRadius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    
    return `M ${start.x} ${start.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y} Z`;
  };

  if (loading) return <p className="text-sm text-gray-600">Loading statistics...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-gray-600">No statistics available for this job posting.</p>;

  const total = Number(stats.total_interviews || 0);
  
  let breakdown = {};
  if (stats.scheduled_count !== undefined || stats.completed_count !== undefined || stats.draft_count !== undefined) {
    // Use explicit counts only
    breakdown = {
      scheduled: Number(stats.scheduled_count || 0),
      completed: Number(stats.completed_count || 0),
      draft: Number(stats.draft_count || 0)
    };
  } else if (stats.status_breakdown) {
    // Use status_breakdown only if explicit counts are not provided
    breakdown = stats.status_breakdown;
  }

  if (!breakdown || Object.keys(breakdown).length === 0) {
    return <p className="text-sm text-gray-600">No statistics available for this job posting.</p>;
  }

  const entries = Object.entries(breakdown).map(([k, v]) => ({ key: k, value: v }));
  const computedTotal = entries.reduce((s, e) => s + (Number(e.value) || 0), 0) || total || 1;
  
  // Find the only non-zero segment if there's just one
  const nonZeroEntries = entries.filter(entry => Number(entry.value) > 0);
  const hasOnlySingleNonZeroValue = nonZeroEntries.length === 1 && entries.length > 1;
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Calculate segments with percentages
  const segments = entries.map((entry, idx) => {
    const percentage = (Number(entry.value) / computedTotal) * 100;
    return {
      ...entry,
      percentage,
      color: colors[idx % colors.length],
      count: Number(entry.value)
    };
  });

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        Interview Statistics
      </h3>
      
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Enhanced Donut Chart */}
        <div className="relative" style={{ width: 240, height: 240 }}>
          {/* No tooltip box - counts will be shown directly on segments */}
         {/* Container div without spinning animation */}
         <div className="absolute inset-0">
           <svg
             viewBox="0 0 200 200"
             className={`w-full h-full transition-all duration-700 ${
               hoveredSegment !== null ? 'hover:scale-105' : 'animate-subtle-pulse'
             }`}
             style={{
               filter: hoveredSegment !== null ? 'drop-shadow(0 0 15px rgba(99,102,241,0.4))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
               transformOrigin: 'center',
               transition: 'filter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
             }}
         >
           {/* Only render the default background when we don't have a single segment */}
           {!hasOnlySingleNonZeroValue && (
             <circle
               cx="100"
               cy="100"
               r="80"
               fill="none"
               stroke="#f3f4f6"
               strokeWidth="32"
               strokeDasharray={hoveredSegment !== null ? "1, 8" : "0"}
               className={`${hoveredSegment !== null ? 'animate-pulse-slow' : ''}`}
               style={{
                 transformOrigin: 'center',
                 transition: 'stroke-dasharray 0.8s ease'
               }}
             />
           )}
           
           {/* Segments */}
           {(() => {
             // If there's only a single non-zero segment, render a donut with that color
             if (hasOnlySingleNonZeroValue) {
               // Find the segment with a value
               const activeSegment = segments.find(seg => seg.count > 0);
               const activeIdx = segments.indexOf(activeSegment);
               
               return (
                 <>
                   {/* Outer circle with the segment's color */}
                   <circle
                     cx="100"
                     cy="100"
                     r="96"
                     fill={activeSegment.color}
                     className={`transition-all cursor-pointer ${chartAnimated ? 'animate-segment-entrance' : 'opacity-0'}`}
                     style={{
                       transformOrigin: 'center',
                       filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                       animation: 'none' // Ensure no spinning
                     }}
                     onMouseEnter={() => setHoveredSegment(activeIdx)}
                     onMouseLeave={() => setHoveredSegment(null)}
                   />
                   {/* Inner white circle to create the donut hole */}
                   <circle
                     cx="100"
                     cy="100"
                     r="64"
                     fill="white"
                     className={chartAnimated ? 'animate-fadeIn' : 'opacity-0'}
                     style={{
                       transformOrigin: 'center',
                       animationDelay: '150ms',
                       animation: 'none' // Ensure no spinning
                     }}
                   />
                 </>
               );
             }
             
             // Normal multi-segment rendering
             let currentAngle = 0;
             return segments.map((seg, idx) => {
               // Skip segments with 0 value
               if (seg.count === 0) return null;
               
               const angle = (seg.percentage / 100) * 360;
               const path = createArc(currentAngle, currentAngle + angle, 64, 96);
               currentAngle += angle;
               
               return (
                 <path
                   key={idx}
                   d={path}
                   fill={seg.color}
                   className={`transition-all cursor-pointer ${
                     chartAnimated ? 'animate-fadeIn' : 'opacity-0'
                   } ${hoveredSegment === idx ? 'segment-hover' : ''}`}
                   style={{
                     filter: hoveredSegment === idx
                       ? 'drop-shadow(0 0 12px rgba(0,0,0,0.4))'
                       : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                     animationDelay: `${idx * 180}ms`, // Staggered animation
                     transformOrigin: 'center',
                     animation: 'none', // Ensure no spinning
                     transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                     opacity: hoveredSegment !== null && hoveredSegment !== idx ? 0.5 : 1
                   }}
                   onMouseEnter={() => setHoveredSegment(idx)}
                   onMouseLeave={() => setHoveredSegment(null)}
                 />
               );
             });
           })()}
           </svg>
         </div>
         
         {/* Dynamic center text - not affected by the rotation */}
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ animation: 'none' }}>
           <div
             className={`text-4xl font-bold transition-all duration-500 ${chartAnimated ? 'animate-fadeIn' : 'opacity-0'}`}
             style={{
               animationDelay: `${segments.length * 180 + 200}ms`,
               color: hoveredSegment !== null ? segments[hoveredSegment].color : '#1f2937',
               textShadow: hoveredSegment !== null ? `0 0 10px ${segments[hoveredSegment].color}50` : 'none',
               transform: hoveredSegment !== null ? 'scale(1.1)' : 'scale(1)',
               transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.4s ease, text-shadow 0.4s ease',
             }}
           >
             {hoveredSegment !== null ? segments[hoveredSegment].count : (stats.total_interviews ?? computedTotal)}
           </div>
           <div
             className={`text-sm font-medium mt-1 transition-all duration-300 ${chartAnimated ? 'animate-fadeIn' : 'opacity-0'}`}
             style={{
               animationDelay: `${segments.length * 180 + 300}ms`,
               color: hoveredSegment !== null ? segments[hoveredSegment].color : '#6b7280',
               letterSpacing: hoveredSegment !== null ? '0.05em' : 'normal',
               fontWeight: hoveredSegment !== null ? '600' : '500',
               transition: 'all 0.4s ease'
             }}
           >
             {hoveredSegment !== null ? segments[hoveredSegment].key.replace(/_/g, ' ') : 'Total Interviews'}
           </div>
         </div>
       </div>

        {/* Enhanced Legend */}
        <div className="flex-1 w-full">
          <div className="grid gap-3">
            {segments.map((seg, idx) => (
              <div
                key={seg.key}
                className={`bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg ${
                  chartAnimated ? 'animate-slideIn' : 'opacity-0'
                } ${hoveredSegment === idx ? 'ring-2 ring-offset-2 animate-pulse-slow shadow-lg' : 'shadow-sm'}`}
                style={{
                  animationDelay: `${(idx * 100) + 600}ms`,
                  borderColor: hoveredSegment === idx ? seg.color : '',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: hoveredSegment === idx ? 'translateX(5px)' : 'none'
                }}
                onMouseEnter={() => setHoveredSegment(idx)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-2"
                      style={{ 
                        backgroundColor: seg.color,
                        ringColor: `${seg.color}40`
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {seg.key.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{seg.count}</div>
                      <div className="text-xs text-gray-500">interviews</div>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <div className="text-sm font-medium" style={{ color: seg.color }}>
                        {seg.percentage.toFixed(1)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            hoveredSegment === idx ? 'animate-pulse-slow' : ''
                          }`}
                          style={{
                            width: chartAnimated ? `${seg.percentage}%` : '0%',
                            backgroundColor: seg.color,
                            transition: 'width 1s ease-in-out, box-shadow 0.3s ease',
                            transitionDelay: `${(idx * 100) + 400}ms`,
                            boxShadow: hoveredSegment === idx ? `0 0 8px ${seg.color}, 0 0 15px ${seg.color}` : 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}