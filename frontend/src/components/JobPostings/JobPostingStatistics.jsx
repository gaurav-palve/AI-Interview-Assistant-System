import { useEffect, useState } from 'react';
import jobPostingService from '../../services/jobPostingService';

/**
 * Enhanced statistics component with modern donut chart visualization
 */
export default function JobPostingStatistics({ jobPostingId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobPostingId) return;
    fetchStats(jobPostingId);
  }, [jobPostingId]);

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
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" strokeWidth="32" />
            
            {/* Segments */}
            {(() => {
              let currentAngle = 0;
              return segments.map((seg, idx) => {
                const angle = (seg.percentage / 100) * 360;
                const path = createArc(currentAngle, currentAngle + angle, 64, 96);
                currentAngle += angle;
                return (
                  <path
                    key={idx}
                    d={path}
                    fill={seg.color}
                    className="transition-all duration-300 hover:opacity-80"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                );
              });
            })()}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-4xl font-bold text-gray-900">{stats.total_interviews ?? computedTotal}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Total Interviews</div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="flex-1 w-full">
          <div className="grid gap-3">
            {segments.map((seg, idx) => (
              <div
                key={seg.key}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
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
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${seg.percentage}%`,
                            backgroundColor: seg.color 
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