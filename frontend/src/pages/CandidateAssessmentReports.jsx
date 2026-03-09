import { useState, useEffect } from "react";
import {
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import pie_chart_outline from "@mui/icons-material/PieChartOutline";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import interviewService from "../services/interviewService";
import Tooltip from "@mui/material/Tooltip";

function CandidateAssessmentReports({ jobPostingId = null }) {
  const [candidateReports, setCandidateReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadId, setDownloadId] = useState(null);

  /* ------------------- DATA FETCH ------------------- */

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (jobPostingId) {
        response = await interviewService.getJobPostingCandidateReports(
          jobPostingId,
          page,
          pageSize
        );
      } else {
        response = await interviewService.getCandidateReports(
          page,
          pageSize
        );
      }

      const processedReports = response.reports.map((report) => {
        const mcqScore = calculateMcqScore(report.MCQ_data || []);
        const voiceScore = report.Voice_data?.overall_score * 10 || 0;
        const codingScore = calculateCodingScore(report.Coding_data || []);

        const overallScore = Math.round(
          (mcqScore + voiceScore + codingScore) / 3
        );

        // Extract strengths from all assessment types
        const mcqStrengths = extractMcqStrengths(report.MCQ_data || []);
        const voiceStrengths = extractVoiceStrengths(report.Voice_data);
        const codingStrengths = extractCodingStrengths(report.Coding_data || []);

        // Combine all strengths
        const allStrengths = [...mcqStrengths, ...voiceStrengths, ...codingStrengths];

        return {
          id: report.interview_id,
          name: report.candidate_name || "Unknown",
          email: report.candidate_email || "No email",
          position: report.job_role || "Unknown Role",

          mcq: {
            score: mcqScore,
            strengths: mcqStrengths,
          },

          voice: {
            score: voiceScore,
            strengths: voiceStrengths,
          },

          coding: {
            score: codingScore,
            strengths: codingStrengths,
          },

          overall: {
            score: overallScore,
            strengths: allStrengths,
          },
        };
      });

      setCandidateReports(processedReports);

      const pagination = response.pagination || {};
      setTotalPages(pagination.total_pages || 1);
      setTotalReports(pagination.total || processedReports.length);
    } catch (err) {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, jobPostingId]);

  /* ------------------- HELPERS ------------------- */

  const calculateMcqScore = (mcqData) => {
    if (!mcqData.length) return 0;
    const correct = mcqData.filter((q) => q.is_correct).length;
    return Math.round((correct / mcqData.length) * 100);
  };

  const calculateCodingScore = (codingData) => {
    if (!codingData.length) return 0;
    const total = codingData.reduce(
      (sum, item) => sum + (item.coding_marks || 0),
      0
    );
    return Math.round((total / (codingData.length * 10)) * 100);
  };

  const extractMcqStrengths = (mcqData) => {
    // Return dummy strengths for display
    return [
      "Data Pipeline Architecture",
      "ETL / ELT Expertise",
      "Big Data Processing",
      "SQL & Advanced Query Optimization",
      "API & Data Integration",
    ];
  };

  const extractVoiceStrengths = (voiceData) => {
    // Return empty for now - can be populated later
    return [];
  };

  const extractCodingStrengths = (codingData) => {
    // Return empty for now - can be populated later
    return [];
  };

  const handleDownloadPdf = async (id) => {
    try {
      setDownloadingPdf(true);
      setDownloadId(id);
      await interviewService.downloadReportPdf(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingPdf(false);
      setDownloadId(null);
    }
  };

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderCustomAngleTick = ({ payload, x, y }) => {
    const { value } = payload;

    let adjustedX = x;
    let adjustedY = y;

    // TOP label (MCQ)
    if (value.includes("MCQ")) {
      adjustedY = y - 3; // slightly higher
    }

    // BOTTOM LEFT (Coding)
    if (value.includes("Coding")) {
      adjustedX = x + 5;  // move more inside
      adjustedY = y + 15;  // move more down
    }

    // BOTTOM RIGHT (Voice)
    if (value.includes("Voice")) {
      adjustedX = x - 5;  // move more inside
      adjustedY = y + 15;  // move more down
    }

    return (
      <text
        x={adjustedX}
        y={adjustedY}
        textAnchor="middle"
        fontSize="14"
        fill="#374151"
      >
        {value}
      </text>
    );
  };

  /* ------------------- UI ------------------- */

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">

        {/* Header */}
        <h1 className="text-2xl font-bold flex items-center mb-6">
          <AssessmentIcon className="mr-2 text-blue-600" />
          Candidate Assessment Reports
        </h1>

        {error && (
          <div className="bg-red-50 p-4 text-red-600 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* GRID: 2 columns at larger widths (zoom ≤80%), 1 column at smaller widths (zoom >80%) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {candidateReports.map((candidate) => {

                const chartData = [
                  { subject: `MCQ (${candidate.mcq.score})`, value: candidate.mcq.score },
                  { subject: `Coding (${candidate.coding.score})`, value: candidate.coding.score },
                  { subject: `Voice (${candidate.voice.score})`, value: candidate.voice.score }
                ];


                return (
                  <div
                    key={candidate.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition"
                  >
                    {/* Top Section - Responsive Flex Layout */}
                    <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-6">

                      {/* LEFT SIDE - TEXT CONTENT */}
                      <div className="flex-1 w-full lg:w-auto">

                        {/* Profile Row */}
                        <div className="flex items-start gap-3">
                          {/* Initials Avatar */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-base sm:text-lg">
                              {getInitials(candidate.name)}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                              {candidate.name}
                            </h2>

                            <p className="text-xs sm:text-sm text-gray-500 truncate mb-1">
                              {candidate.email}
                            </p>

                            {/* Job Role and Overall Fit - Single Line */}
                            <div className="flex items-center gap-2 flex-nowrap">

                              <span className="text-blue-600 text-xs sm:text-sm font-medium">
                                {candidate.position}
                              </span>

                              <span className="text-gray-400">•</span>

                              <span className="text-green-600 text-xs sm:text-sm font-medium flex items-center gap-1 whitespace-nowrap">
                                <CheckCircleIcon sx={{ fontSize: 14, color: '#10B981' }} />
                                {candidate.overall.score}% Overall fit
                              </span>
                            </div>

                          </div>
                        </div>

                        {/* Strengths Section - Inline */}
                        <div className="mt-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700">
                              Top Strengths:
                            </span>
                            {candidate.mcq.strengths.map((skill, i) => (
                              <span
                                key={i}
                                className="bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* RIGHT SIDE - RADAR CHART */}
                      <div className="w-full lg:w-[240px] h-[220px] sm:h-[240px] flex-shrink-0 mx-auto lg:mx-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            data={chartData}
                            startAngle={90}
                            endAngle={-270}
                            outerRadius="65%"
                            margin={{ top: 25, right: 25, bottom: 25, left: 25 }}
                          >
                            <PolarGrid stroke="#d1d5db" />

                            <PolarAngleAxis
                              dataKey="subject"
                              tick={renderCustomAngleTick}
                            />

                            <PolarRadiusAxis
                              domain={[0, 100]}
                              tickCount={6}
                              angle={120}   // ✅ correct right edge angle
                              axisLine={false}
                              tick={({ x, y, payload }) => (
                                <text
                                  x={x + 55}
                                  y={y}
                                  fill="#9ca3af"
                                  fontSize={11}
                                  textAnchor="start"
                                // transform={`rotate(-30, ${x}, ${y})`}  // rotate same angle
                                >
                                  {payload.value}
                                </text>
                              )}
                            />

                            <Radar
                              dataKey="value"
                              stroke="#4f46e5"
                              strokeWidth={2}
                              fill="#4f46e5"
                              fillOpacity={0.35}
                            />
                          </RadarChart>

                        </ResponsiveContainer>
                      </div>
                    </div>


                    {/* Footer - Responsive */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-1 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <StarIcon className="text-yellow-400 text-base sm:text-sm" />
                        <span className="text-sm font-medium">
                          {(candidate.overall.score / 20).toFixed(1)} Rating
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">

                        <button
                          onClick={() => handleDownloadPdf(candidate.id)}
                          disabled={downloadingPdf && downloadId === candidate.id}
                          className="flex items-center text-sm bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex-1 sm:flex-initial justify-center"
                        >
                          <DownloadIcon className="text-sm mr-1" />
                          {downloadingPdf && downloadId === candidate.id
                            ? "Downloading..."
                            : "Download"}
                        </button>

                        <button
                          className="flex items-center justify-center text-sm bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Expand"
                        >
                          <OpenInFullIcon sx={{ fontSize: 20 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination - Responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, totalReports)} of{" "}
                {totalReports} candidates
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CandidateAssessmentReports;

