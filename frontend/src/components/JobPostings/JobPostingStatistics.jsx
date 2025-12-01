import { useEffect, useState } from 'react';
import jobPostingService from '../../services/jobPostingService';

/**
 * Simple pie-chart-like statistics component using CSS conic-gradient.
 * Avoids adding chart.js dependency and works with current setup.
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
      // Backend returns { total_interviews, scheduled_count, completed_count, draft_count, status_breakdown }
      setStats(data || {});
    } catch (err) {
      console.error('Failed to fetch job posting statistics', err);
      setError(err.detail || err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-600">Loading statistics...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-gray-600">No statistics available for this job posting.</p>;
  // Prefer explicit counts if provided by backend
  const total = Number(stats.total_interviews || 0);

  // Build breakdown with priority: explicit scheduled/completed/draft counts, else status_breakdown
  let breakdown = {};
  if (stats.scheduled_count !== undefined || stats.completed_count !== undefined || stats.draft_count !== undefined) {
    breakdown = {
      scheduled: Number(stats.scheduled_count || 0),
      completed: Number(stats.completed_count || 0),
      draft: Number(stats.draft_count || 0),
      // include any other statuses from status_breakdown that are not these three
      ...(stats.status_breakdown || {})
    };
  } else if (stats.status_breakdown) {
    breakdown = stats.status_breakdown;
  }

  if (!breakdown || Object.keys(breakdown).length === 0) {
    return <p className="text-sm text-gray-600">No statistics available for this job posting.</p>;
  }

  const entries = Object.entries(breakdown).map(([k, v]) => ({ key: k, value: v }));
  const computedTotal = entries.reduce((s, e) => s + (Number(e.value) || 0), 0) || total || 1;

  // Colors palette
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Build conic-gradient string
  let start = 0;
  const stops = entries.map((entry, idx) => {
    const pct = (Number(entry.value) / computedTotal) * 100;
    const color = colors[idx % colors.length];
    const seg = `${color} ${start}% ${start + pct}%`;
    start += pct;
    return seg;
  });

  const gradient = `conic-gradient(${stops.join(', ')})`;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div style={{ width: 220, height: 220 }} className="rounded-full shadow-sm bg-white flex items-center justify-center">
        <div
          aria-hidden
          className="rounded-full"
          style={{
            width: 180,
            height: 180,
            background: gradient,
            borderRadius: '50%'
          }}
        />
        <div className="absolute text-center pointer-events-none">
          <div className="text-lg font-semibold text-gray-900">{stats.total_interviews ?? computedTotal}</div>
          <div className="text-xs text-gray-500">Interviews</div>
        </div>
      </div>

      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Status Breakdown</h4>
        <ul className="space-y-2">
          {entries.map((entry, idx) => {
            const pct = ((Number(entry.value) / total) * 100).toFixed(1);
            return (
              <li key={entry.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span style={{ background: colors[idx % colors.length] }} className="w-3 h-3 rounded-full inline-block" />
                  <span className="text-sm text-gray-700 capitalize">{entry.key.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-sm text-gray-600">{entry.value} ({pct}%)</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
