import React, { useEffect, useState } from 'react';
import { fetchScreeningResults } from '../../services/screeningService';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';


export default function ResumeScreeningResults({ jobPostId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ NEW: ATS filter
  const [minAtsScore, setMinAtsScore] = useState('');

  // ✅ NEW: Selected candidates
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // ✅ pass minAtsScore to backend
      const data = await fetchScreeningResults(effectiveJobPostId, minAtsScore);
      setResults(data);
      setSelectedCandidates([]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [minAtsScore, effectiveJobPostId]);


  // ✅ NEW: toggle checkbox
  const toggleSelect = (candidate) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidate)
        ? prev.filter((c) => c !== candidate)
        : [...prev, candidate]
    );
  };

  const params = useParams();
  const effectiveJobPostId = jobPostId || params.jobPostId;


  // if (loading) return <div>Loading screening results...</div>;
  // if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  // if (!results || results.length === 0)
  //   return <div>No screening results found.</div>;

  return (
  <div>
    <h3>Resume Screening Results</h3>

    {/* ✅ ATS FILTER – ALWAYS VISIBLE */}
    <div style={{ marginBottom: 16 }}>
      <input
        type="number"
        placeholder="Minimum ATS score"
        value={minAtsScore}
        onChange={(e) => setMinAtsScore(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <button onClick={load}>Apply Filter</button>
    </div>

    {loading && <div>Loading screening results...</div>}
    {error && <div style={{ color: 'red' }}>Error: {error}</div>}

    {!loading && !error && results.length === 0 && (
      <div>No screening results found.</div>
    )}

    {!loading && !error && results.length > 0 && (
      <div style={{ display: 'grid', gap: 12 }}>
        {results.map((r) => (
          <div
            key={r.candidate_email || r._id}
            style={{
              border: '1px solid #ddd',
              padding: 12,
              borderRadius: 6,
            }}
          >

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(r.candidate_email)}
                  onChange={() => toggleSelect(r.candidate_email)}
                />
                <strong style={{ marginLeft: 8 }}>
                  {r.candidate_email || 'Unknown'}
                </strong>
              </label>

              <span>
                ATS Score: {r.ATS_Score ?? r.ats_score ?? 'N/A'}
              </span>
            </div>

            {r.Strengths && (
              <div>
                <strong>Strengths:</strong>{' '}
                {Array.isArray(r.Strengths)
                  ? r.Strengths.join(', ')
                  : r.Strengths}
              </div>
            )}

            {r.Weaknesses && (
              <div>
                <strong>Weaknesses:</strong>{' '}
                {Array.isArray(r.Weaknesses)
                  ? r.Weaknesses.join(', ')
                  : r.Weaknesses}
              </div>
            )}

            {r.resume && (
              <div style={{ marginTop: 8 }}>
                <a href={r.resume} target="_blank" rel="noreferrer">
                  View resume file
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    )}

    {/* ✅ SCHEDULE INTERVIEW */}
    <div style={{ marginTop: 16 }}>
      <button
        disabled={selectedCandidates.length === 0}
        onClick={() =>
          navigate('/schedule-interview', {
            state: {
              candidates: selectedCandidates,
              jobPostId,
            },
          })
        }
      >
        Schedule Interview ({selectedCandidates.length})
      </button>
    </div>
  </div>
);

}
