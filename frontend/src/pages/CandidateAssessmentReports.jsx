import { useState, useEffect } from 'react';
import {
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Mic as MicIcon,
  Code as CodeIcon,
  BarChart as BarChartIcon,
  Star as StarIcon,
  StarHalf as StarHalfIcon,
  StarBorder as StarBorderIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import interviewService from '../services/interviewService';

function CandidateAssessmentReports() {
  // State for real data from API
  const [candidateReports, setCandidateReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  
  // State for filters
  const [filters, setFilters] = useState({
    candidate_name: '',
    candidate_email: '',
    job_role: '',
    interview_id: ''
  });
  
  // State for PDF download
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadId, setDownloadId] = useState(null);
  // Function to fetch reports from API
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await interviewService.getCandidateReports(
        page,
        pageSize,
        // Only include non-empty filters
        Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      );
      
      // Process the reports data
      const processedReports = response.reports.map(report => {
        // Calculate overall score based on MCQ, Voice, and Coding data
        const mcqScore = calculateMcqScore(report.MCQ_data || []);
        const voiceScore = report.Voice_data?.overall_score * 10 || 0;
        const codingScore = calculateCodingScore(report.Coding_data || []);
        
        const overallScore = Math.round((mcqScore + voiceScore + codingScore) / 3);
        
        // Determine rating based on overall score
        let rating = "Poor";
        if (overallScore >= 85) rating = "Excellent";
        else if (overallScore >= 70) rating = "Good";
        else if (overallScore >= 50) rating = "Average";
        
        // Determine recommendation based on overall score
        let recommendation = "Not Recommended";
        if (overallScore >= 85) recommendation = "Hire";
        else if (overallScore >= 70) recommendation = "Consider";
        else if (overallScore >= 50) recommendation = "Consider with reservations";
        
        return {
          id: report.interview_id,
          name: report.candidate_name || "Unknown",
          email: report.candidate_email || "No email",
          position: report.job_role || "Unknown Position",
          photo: null,
          mcq: {
            score: mcqScore,
            details: `${getCorrectMcqCount(report.MCQ_data || [])}/${(report.MCQ_data || []).length} correct answers`,
            strengths: extractMcqStrengths(report.MCQ_data || []),
            weaknesses: "Areas for improvement"
          },
          voice: {
            score: voiceScore,
            details: report.Voice_data?.feedback || "No feedback available",
            strengths: "Communication skills",
            weaknesses: "Areas for improvement"
          },
          coding: {
            score: codingScore,
            details: "Code quality assessment",
            strengths: "Problem-solving",
            weaknesses: "Areas for improvement"
          },
          overall: {
            rating: rating,
            score: overallScore,
            recommendation: recommendation,
            feedback: report.Voice_data?.feedback || "No feedback available"
          },
          // Store the original report data for reference
          rawReport: report
        };
      });
      
      setCandidateReports(processedReports);
      setTotalPages(response.pagination.total_pages);
      setTotalReports(response.pagination.total);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.detail || "Failed to load candidate reports");
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions for data processing
  const calculateMcqScore = (mcqData) => {
    if (!mcqData || mcqData.length === 0) return 0;
    const correctCount = mcqData.filter(q => q.is_correct).length;
    return Math.round((correctCount / mcqData.length) * 100);
  };
  
  const getCorrectMcqCount = (mcqData) => {
    if (!mcqData || mcqData.length === 0) return 0;
    return mcqData.filter(q => q.is_correct).length;
  };
  
  const extractMcqStrengths = (mcqData) => {
    // This is a placeholder - in a real app, you might analyze the MCQs to determine strengths
    return "Technical knowledge";
  };
  
  const calculateCodingScore = (codingData) => {
    if (!codingData || codingData.length === 0) return 0;
    const totalMarks = codingData.reduce((sum, item) => sum + (item.coding_marks || 0), 0);
    const maxPossibleMarks = codingData.length * 10; // Assuming max score is 10 per coding question
    return Math.round((totalMarks / maxPossibleMarks) * 100);
  };
  
  // Calculate average scores for summary cards
  const calculateAverageMcqScore = () => {
    if (candidateReports.length === 0) return 0;
    const total = candidateReports.reduce((sum, report) => sum + report.mcq.score, 0);
    return Math.round(total / candidateReports.length);
  };
  
  const calculateAverageVoiceScore = () => {
    if (candidateReports.length === 0) return 0;
    const total = candidateReports.reduce((sum, report) => sum + report.voice.score, 0);
    return Math.round(total / candidateReports.length);
  };
  
  const calculateAverageCodingScore = () => {
    if (candidateReports.length === 0) return 0;
    const total = candidateReports.reduce((sum, report) => sum + report.coding.score, 0);
    return Math.round(total / candidateReports.length);
  };
  
  // Function to handle PDF download
  const handleDownloadPdf = async (interviewId) => {
    try {
      setDownloadingPdf(true);
      setDownloadId(interviewId);
      await interviewService.downloadReportPdf(interviewId);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError(err.detail || "Failed to download PDF report");
    } finally {
      setDownloadingPdf(false);
      setDownloadId(null);
    }
  };
  
  // Function to handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page when applying filters
    fetchReports();
  };
  
  // Function to reset filters
  const resetFilters = () => {
    setFilters({
      candidate_name: '',
      candidate_email: '',
      job_role: '',
      interview_id: ''
    });
    setPage(1);
    fetchReports();
  };
  
  // Fetch reports when component mounts or when page/pageSize changes
  useEffect(() => {
    fetchReports();
  }, [page, pageSize]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <AssessmentIcon className="mr-2 text-primary-600" />
          Candidate Assessment Reports
        </h1>
        <p className="text-gray-600 mb-6">
          View comprehensive assessment reports for candidates across multiple evaluation rounds including MCQ tests, voice interviews, and coding challenges.
        </p>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Filter form */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <SearchIcon className="mr-2 text-primary-600" />
            Filter Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
              <input
                type="text"
                name="candidate_name"
                value={filters.candidate_name}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Search by name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                name="candidate_email"
                value={filters.candidate_email}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Search by email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
              <input
                type="text"
                name="job_role"
                value={filters.job_role}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Search by job role"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interview ID</label>
              <input
                type="text"
                name="interview_id"
                value={filters.interview_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Search by ID"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* Assessment summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* MCQ Assessment Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 border border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-blue-800 font-medium flex items-center">
                <AssessmentIcon className="mr-2 text-blue-600" />
                MCQ Assessment
              </h3>
              <span className="bg-blue-200 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {loading ? 'Loading...' : `Avg: ${calculateAverageMcqScore()}%`}
              </span>
            </div>
            <div className="mb-2">
              <div className="w-full bg-blue-200 rounded-full h-2.5 mb-1">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: loading ? '0%' : `${calculateAverageMcqScore()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-blue-800">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-blue-800 mt-2">
              {loading ? (
                <span>Loading candidate data...</span>
              ) : (
                <>
                  <span>{candidateReports.length} candidates completed</span>
                  <span>{totalReports - candidateReports.length} pending</span>
                </>
              )}
            </div>
          </div>
          
          {/* Voice Interview Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 border border-purple-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-purple-800 font-medium flex items-center">
                <MicIcon className="mr-2 text-purple-600" />
                Voice Interview
              </h3>
              <span className="bg-purple-200 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {loading ? 'Loading...' : `Avg: ${calculateAverageVoiceScore()}%`}
              </span>
            </div>
            <div className="mb-2">
              <div className="w-full bg-purple-200 rounded-full h-2.5 mb-1">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: loading ? '0%' : `${calculateAverageVoiceScore()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-purple-800">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-purple-800 mt-2">
              {loading ? (
                <span>Loading candidate data...</span>
              ) : (
                <>
                  <span>{candidateReports.length} candidates completed</span>
                  <span>{totalReports - candidateReports.length} pending</span>
                </>
              )}
            </div>
          </div>
          
          {/* Coding Challenge Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4 border border-green-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-green-800 font-medium flex items-center">
                <CodeIcon className="mr-2 text-green-600" />
                Coding Challenge
              </h3>
              <span className="bg-green-200 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {loading ? 'Loading...' : `Avg: ${calculateAverageCodingScore()}%`}
              </span>
            </div>
            <div className="mb-2">
              <div className="w-full bg-green-200 rounded-full h-2.5 mb-1">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: loading ? '0%' : `${calculateAverageCodingScore()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-green-800">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-green-800 mt-2">
              {loading ? (
                <span>Loading candidate data...</span>
              ) : (
                <>
                  <span>{candidateReports.length} candidates completed</span>
                  <span>{totalReports - candidateReports.length} pending</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Filters and controls */}
        <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm">
              <option value="">All Positions</option>
              <option value="software-engineer">Software Engineer</option>
              <option value="frontend-developer">Frontend Developer</option>
              <option value="devops-engineer">DevOps Engineer</option>
              <option value="data-scientist">Data Scientist</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm">
              <option value="">All Assessments</option>
              <option value="mcq">MCQ Test</option>
              <option value="voice">Voice Interview</option>
              <option value="coding">Coding Challenge</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Performance</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm">
              <option value="">All Ratings</option>
              <option value="excellent">Excellent (85%+)</option>
              <option value="good">Good (70-84%)</option>
              <option value="average">Average (50-69%)</option>
              <option value="poor">Poor (Below 50%)</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm">
              <option value="last-week">Last 7 days</option>
              <option value="last-month">Last 30 days</option>
              <option value="last-quarter">Last 90 days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
        
        {/* Candidate reports table */}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading candidate reports...</span>
            </div>
          ) : candidateReports.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4">No candidate reports found.</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or adding new candidates.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <AssessmentIcon className="h-4 w-4 mr-1 text-blue-600" />
                    MCQ Test
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <MicIcon className="h-4 w-4 mr-1 text-purple-600" />
                    Voice Interview
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <CodeIcon className="h-4 w-4 mr-1 text-green-600" />
                    Coding Challenge
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidateReports.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
                        <PersonIcon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                        <div className="text-xs text-gray-500">{candidate.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center mb-1">
                      <div className="w-full bg-blue-100 rounded-full h-2.5 mr-2 w-24">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${candidate.mcq.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{candidate.mcq.score}%</span>
                    </div>
                    <div className="text-xs text-gray-500">{candidate.mcq.details}</div>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs text-blue-700 font-medium mr-1">Strengths:</span>
                      <span className="text-xs text-gray-500">{candidate.mcq.strengths}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center mb-1">
                      <div className="w-full bg-purple-100 rounded-full h-2.5 mr-2 w-24">
                        <div 
                          className="bg-purple-600 h-2.5 rounded-full" 
                          style={{ width: `${candidate.voice.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{candidate.voice.score}%</span>
                    </div>
                    <div className="text-xs text-gray-500">{candidate.voice.details}</div>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs text-purple-700 font-medium mr-1">Strengths:</span>
                      <span className="text-xs text-gray-500">{candidate.voice.strengths}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center mb-1">
                      <div className="w-full bg-green-100 rounded-full h-2.5 mr-2 w-24">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full" 
                          style={{ width: `${candidate.coding.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{candidate.coding.score}%</span>
                    </div>
                    <div className="text-xs text-gray-500">{candidate.coding.details}</div>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs text-green-700 font-medium mr-1">Strengths:</span>
                      <span className="text-xs text-gray-500">{candidate.coding.strengths}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center mb-1">
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = candidate.overall.score / 20; // Convert to 5-star scale
                          return star <= Math.floor(rating) ? (
                            <StarIcon key={star} className="h-4 w-4" />
                          ) : star === Math.ceil(rating) && !Number.isInteger(rating) ? (
                            <StarHalfIcon key={star} className="h-4 w-4" />
                          ) : (
                            <StarBorderIcon key={star} className="h-4 w-4" />
                          );
                        })}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">{candidate.overall.score}%</span>
                    </div>
                    <div className="text-xs font-medium">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        candidate.overall.rating === 'Excellent' ? 'bg-green-100 text-green-800' : 
                        candidate.overall.rating === 'Good' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {candidate.overall.rating}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {candidate.overall.recommendation}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDownloadPdf(candidate.id)}
                      disabled={downloadingPdf && downloadId === candidate.id}
                      className="text-primary-600 hover:text-primary-900 font-medium flex items-center"
                    >
                      {downloadingPdf && downloadId === candidate.id ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-primary-600 rounded-full"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Download PDF
                        </>
                      )}
                    </button>
                    <div className="flex justify-end mt-2 space-x-2">
                      <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                        <BarChartIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                        <ContentCopyIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-700">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <>
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * pageSize, totalReports)}</span> of{' '}
                <span className="font-medium">{totalReports}</span> candidates
              </>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {totalPages > 0 && (
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show first page, last page, current page, and pages around current
                  const pageNum = i === 0 ? 1 :
                                i === 4 ? totalPages :
                                page <= 2 ? i + 1 :
                                page >= totalPages - 1 ? totalPages - 4 + i :
                                page - 2 + i;
                  
                  // Only render if we're showing sequential pages or first/last
                  if (i === 0 || i === 4 || Math.abs(pageNum - page) <= 2) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${
                          pageNum === page
                            ? 'bg-primary-50 border-primary-500 text-primary-600'
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            )}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0 || loading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateAssessmentReports;