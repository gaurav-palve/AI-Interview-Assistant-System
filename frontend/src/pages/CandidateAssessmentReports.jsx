import { useState } from 'react';
import { 
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Mic as MicIcon,
  Code as CodeIcon,
  BarChart as BarChartIcon,
  Star as StarIcon,
  StarHalf as StarHalfIcon,
  StarBorder as StarBorderIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

function CandidateAssessmentReports() {
  // Dummy data for candidate assessment reports
  const candidateReports = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      position: "Senior Software Engineer",
      photo: null,
      mcq: {
        score: 85,
        details: "34/40 correct answers",
        strengths: "Data Structures, Algorithms",
        weaknesses: "System Design"
      },
      voice: {
        score: 78,
        details: "Good communication skills",
        strengths: "Problem solving, Technical explanation",
        weaknesses: "Conciseness"
      },
      coding: {
        score: 92,
        details: "Excellent code quality",
        strengths: "Algorithm efficiency, Clean code",
        weaknesses: "Minor edge cases"
      },
      overall: {
        rating: "Excellent",
        score: 85,
        recommendation: "Hire",
        feedback: "Strong technical skills with good communication"
      }
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      position: "Frontend Developer",
      photo: null,
      mcq: {
        score: 72,
        details: "29/40 correct answers",
        strengths: "JavaScript, React",
        weaknesses: "CSS, Performance optimization"
      },
      voice: {
        score: 88,
        details: "Excellent communication skills",
        strengths: "Clear explanations, Good examples",
        weaknesses: "Technical depth"
      },
      coding: {
        score: 75,
        details: "Good UI implementation",
        strengths: "Component design, Responsive layouts",
        weaknesses: "State management, Performance"
      },
      overall: {
        rating: "Good",
        score: 78,
        recommendation: "Consider",
        feedback: "Strong frontend skills, excellent communicator"
      }
    },
    {
      id: 3,
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      position: "DevOps Engineer",
      photo: null,
      mcq: {
        score: 65,
        details: "26/40 correct answers",
        strengths: "Cloud infrastructure, Docker",
        weaknesses: "Security, Kubernetes"
      },
      voice: {
        score: 70,
        details: "Average communication skills",
        strengths: "Technical knowledge, Experience",
        weaknesses: "Clarity, Organization"
      },
      coding: {
        score: 80,
        details: "Good infrastructure code",
        strengths: "Automation, CI/CD pipelines",
        weaknesses: "Documentation, Testing"
      },
      overall: {
        rating: "Average",
        score: 72,
        recommendation: "Consider with reservations",
        feedback: "Good technical skills but communication needs improvement"
      }
    },
    {
      id: 4,
      name: "Emily Chen",
      email: "emily.chen@example.com",
      position: "Data Scientist",
      photo: null,
      mcq: {
        score: 90,
        details: "36/40 correct answers",
        strengths: "Statistics, Machine Learning",
        weaknesses: "Big Data technologies"
      },
      voice: {
        score: 82,
        details: "Good communication skills",
        strengths: "Technical depth, Explanations",
        weaknesses: "Simplifying complex concepts"
      },
      coding: {
        score: 88,
        details: "Excellent data analysis code",
        strengths: "Algorithm implementation, Data visualization",
        weaknesses: "Code organization"
      },
      overall: {
        rating: "Excellent",
        score: 87,
        recommendation: "Hire",
        feedback: "Strong technical skills with good communication"
      }
    }
  ];

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
                Avg: 78%
              </span>
            </div>
            <div className="mb-2">
              <div className="w-full bg-blue-200 rounded-full h-2.5 mb-1">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-blue-800">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-blue-800 mt-2">
              <span>15 candidates completed</span>
              <span>4 pending</span>
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
                Avg: 80%
              </span>
            </div>
            <div className="mb-2">
              <div className="w-full bg-purple-200 rounded-full h-2.5 mb-1">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '80%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-purple-800">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-purple-800 mt-2">
              <span>12 candidates completed</span>
              <span>7 pending</span>
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
                Avg: 84%
              </span>
            </div>
            <div className="mb-2">
              <div className="w-full bg-green-200 rounded-full h-2.5 mb-1">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '84%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-green-800">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-green-800 mt-2">
              <span>10 candidates completed</span>
              <span>9 pending</span>
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
                    <button className="text-primary-600 hover:text-primary-900 font-medium">
                      View Details
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
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">4</span> of <span className="font-medium">19</span> candidates
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateAssessmentReports;