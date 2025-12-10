import React, { useEffect, useState } from 'react';
import { fetchScreeningResults } from '../../services/screeningService';

export default function ResumeScreeningResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScreeningResults();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // If you want auto-refresh, uncomment the interval below
    // const id = setInterval(load, 30_000);
    // return () => clearInterval(id);
  }, []);

  if (loading) return <div>Loading screening results...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!results || results.length === 0) return <div>No screening results found.</div>;

  return (
    <div>
      <h3>Resume Screening Results</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {results.map((r) => (
          <div key={r.candidate_email || r._id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{r.candidate_email || 'Unknown'}</strong>
              <span>ATS Score: {r.ATS_Score ?? r.ats_score ?? 'N/A'}</span>
            </div>
            {r.Strengths && <div><strong>Strengths:</strong> {Array.isArray(r.Strengths) ? r.Strengths.join(', ') : r.Strengths}</div>}
            {r.Weaknesses && <div><strong>Weaknesses:</strong> {Array.isArray(r.Weaknesses) ? r.Weaknesses.join(', ') : r.Weaknesses}</div>}
            {r.resume && <div style={{ marginTop: 8 }}><a href={r.resume} target="_blank" rel="noreferrer">View resume file</a></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
