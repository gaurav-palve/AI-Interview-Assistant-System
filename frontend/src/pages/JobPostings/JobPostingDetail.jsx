import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import jobPostingService from '../../services/jobPostingService';
import interviewService from '../../services/interviewService';
import CandidateAssessmentReports from '../../pages/CandidateAssessmentReports';
import { useAuth } from '../../contexts/AuthContext';
import StatusDropdown from '../../components/JobPostings/StatusDropdown';
import Nts_logo from '../../assets/Nts_logo/NTSLOGO.png';
import JobPostingStatistics from '../../components/JobPostings/JobPostingStatistics';

// Material UI Icons
import {
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  School as ExperienceIcon,
  Category as DepartmentIcon,
  Description as DescriptionIcon,
  AttachMoney as SalaryIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Star as StarIcon,
  StarHalf as StarHalfIcon,
  StarBorder as StarBorderIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Publish as PublishIcon,
  ArrowBack as BackIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  Group as GroupIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
  Visibility as ViewIcon,
  FileDownload as FileDownloadIcon,
  Mic as MicIcon,
  Code as CodeIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import html2pdf from 'html2pdf.js';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs;

/**
 * JobPostingDetail component
 * Displays details of a job posting and allows resume screening
 */
function JobPostingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, sessionToken } = useAuth();
  const [jobPosting, setJobPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [tabAnimation, setTabAnimation] = useState(false);
  
  // Resume screening state
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [screeningResults, setScreeningResults] = useState([]);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [screeningError, setScreeningError] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [interviewDateTime, setInterviewDateTime] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [schedulingError, setSchedulingError] = useState(null);
  const [schedulingSuccess, setSchedulingSuccess] = useState(false);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentReportData, setCurrentReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [emailAttachments, setEmailAttachments] = useState([]);

  // Job Description Editing
  const [isEditingJD, setIsEditingJD] = useState(false);
  const [jdText, setJdText] = useState("");
  const [initialJdLoaded, setInitialJdLoaded] = useState(false); // ensure JD is initialized only once

  // Fetch job posting on component mount or id change
  useEffect(() => {
    fetchJobPosting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch job posting data
  const fetchJobPosting = async () => {
    try {
      setLoading(true);
      const response = await jobPostingService.getJobPosting(id);
      // The backend returns the job posting directly, not wrapped in a job_posting field
      setJobPosting(response || {});
      // Initialize jdText only if it's not already initialized (so we don't overwrite while editing)
      if (!initialJdLoaded) {
        setJdText(response?.job_description || "");
        setInitialJdLoaded(true);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching job posting:', err);
      setError('Failed to load job posting. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Save updated JD — sends only the JD to backend and updates local state safely
  const saveUpdatedJD = async () => {
    try {
      const updated = { job_description: jdText ?? "" };

      // Call backend update. This function should only update the one field on server.
      // If your API returns the entire object, we will merge it safely below.
      // const res = await jobPostingService.updateJobPosting(id, updated);

      const res = await jobPostingService.updateJobDescription(id, jdText);

      // Safely update local jobPosting state without overwriting other fields
      setJobPosting(prev => {
        if (!prev) return { job_description: jdText };
        return {
          ...prev,
          job_description: jdText
        };
      });

      console.log("JD updated");
      return res;
    } catch (err) {
      console.error("Failed to update JD:", err);
      // We keep local jdText even if backend fails; you may show error UI if desired
      return null;
    }
  };

  // Handle job posting status change
  const handleStatusChange = async (newStatus) => {
    console.log(`Updating job ${id} status to ${newStatus} in detail view`);
    
    try {
      // Always update the UI immediately for better user experience
      setJobPosting(prev => ({
        ...prev,
        status: newStatus
      }));
      
      // Make the API call - if this fails, we've already updated the UI
      const response = await jobPostingService.changeJobPostingStatus(id, newStatus);
      
      if (response && response.mock) {
        console.log('Using mock implementation for status change in detail view');
      }
    } catch (err) {
      console.error('Error updating job posting status:', err);
      // Don't refresh on error - that could revert our UI state
      // Just keep the optimistic UI update
    }
  };

  // Fetch scheduled interviews if on interviews tab
  useEffect(() => {
    if (activeTab === 'interviews') {
      fetchScheduledInterviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeTab]);
  
  // Fetch scheduled interviews
  const fetchScheduledInterviews = async () => {
    try {
      const token = localStorage.getItem("access_token"); 
      const response = await fetch(`http://localhost:8000/api/bulk-interviews/get-interviews-by-job-posting/${id}`, {
         headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch scheduled interviews');
        return;
      }
      
      const data = await response.json();
      setScheduledInterviews(data.interviews || []);
    } catch (err) {
      console.error('Error fetching scheduled interviews:', err);
    }
  };

  // Function to fetch report data for a specific interview
  const fetchReportData = async (interviewId) => {
    try {
      setReportLoading(true);
      setReportError(null);
      
      // Fetch the report data using the interview ID
      const response = await interviewService.getCandidateReportById(interviewId);

      // Normalize backend wrapper / keys to the shape the modal expects
      const normalizeReport = (r) => {
        if (!r) return null;
        return {
          id: r.interview_id ?? r.id ?? r._id ?? null,
          name: r.candidate_name ?? r.name ?? null,
          email: r.candidate_email ?? r.email ?? null,
          position: r.job_role ?? r.position ?? null,
          mcq: r.mcq ?? r.MCQ_data ?? r.MCQ ?? null,
          voice: r.voice ?? r.Voice_data ?? r.Voice ?? null,
          coding: r.coding ?? r.Coding_data ?? r.Coding ?? null,
          overall: r.overall ?? r.Overall ?? r.overall_score ?? null,
          // keep original data for reference
          raw: r
        };
      };

      const reportObj = response?.reports ?? response;
      setCurrentReportData(normalizeReport(reportObj));
      
      // Open the modal after data is loaded
      setIsReportModalOpen(true);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setReportError(err.detail || 'Failed to load report data. Please try again later.');
    } finally {
      setReportLoading(false);
    }
  };

  // Function to handle opening the report modal
  const handleViewReport = (interviewId) => {
    fetchReportData(interviewId);
  };

  // Function to handle downloading the report PDF
  const handleDownloadReport = async (interviewId) => {
    try {
      await interviewService.downloadReportPdf(interviewId);
    } catch (err) {
      console.error('Error downloading report:', err);
      setReportError(err.detail || 'Failed to download report. Please try again later.');
    }
  };

  // Handle resume file change
  const handleResumeFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  // Handle JD file change
  const handleJdFileChange = (e) => {
    setJdFile(e.target.files[0]);
  };

  // Handle resume screening
  const handleScreenResumes = async () => {
    if (!jdFile) {
      setScreeningError('Please upload a job description PDF file.');
      return;
    }
    
    if (!resumeFile) {
      setScreeningError('Please upload a zip file containing resumes.');
      return;
    }

    try {
      setScreeningLoading(true);
      setScreeningError(null);
      
      // Create FormData object
      const formData = new FormData();
      formData.append('zip_file', resumeFile);
      formData.append('jd_file', jdFile);
      
      const response = await fetch('http://localhost:8000/api/screening/resume-screening', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to screen resumes: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setScreeningResults(data.results || []);
      setSelectedCandidates([]);
    } catch (err) {
      console.error('Error screening resumes:', err);
      setScreeningError('Failed to screen resumes. Please try again later.');
    } finally {
      setScreeningLoading(false);
    }
  };

  // Handle select all candidates
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCandidates(screeningResults.map(candidate => candidate.resume));
    } else {
      setSelectedCandidates([]);
    }
  };

  // Handle select individual candidate
  const handleSelectCandidate = (resume, isChecked) => {
    if (isChecked) {
      setSelectedCandidates(prev => [...prev, resume]);
    } else {
      setSelectedCandidates(prev => prev.filter(r => r !== resume));
    }
  };

  // Handle email attachment file selection
  const handleEmailAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Validate file size (max 5MB per file)
      const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setSchedulingError(`Some attachments exceed the 5MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
        e.target.value = null;
        return;
      }
      
      // Add the files to the attachments array
      setEmailAttachments(prev => [...prev, ...files]);
      setSchedulingError(null);
    }
  };

  // Remove an attachment from the list
  const removeAttachment = (index) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle scheduling interviews for selected candidates
  const handleScheduleInterviews = async () => {
    if (selectedCandidates.length === 0) {
      setSchedulingError('Please select at least one candidate.');
      return;
    }

    if (!interviewDateTime) {
      setSchedulingError('Please select a date and time for the interviews.');
      return;
    }

    try {
      setSchedulingLoading(true);
      setSchedulingError(null);
      setSchedulingSuccess(false);
      
      // Get selected candidate details
      const selectedCandidateDetails = screeningResults.filter(
        candidate => selectedCandidates.includes(candidate.resume)
      );
      
      // Create interview data
      const interviewData = {
        job_posting_id: id,
        interview_datetime: interviewDateTime,
        candidates: selectedCandidateDetails.map(candidate => ({
          name: candidate.resume.replace('.pdf', ''),
          email: candidate.candidate_email || 'unknown@example.com',
          resume: candidate.resume
        })),
        job_description: jdFile ? jdFile.name : 'job_description.pdf',
        attachments: []
      };
      
      // Process attachments if any
      if (emailAttachments.length > 0) {
        // Convert attachments to base64
        const attachmentPromises = emailAttachments.map(async (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64content = reader.result.split(',')[1];
              resolve({
                filename: file.name,
                content: base64content,
                content_type: file.type
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
        
        // Wait for all attachments to be processed
        interviewData.attachments = await Promise.all(attachmentPromises);
      }
      
      const token = localStorage.getItem("access_token");
      // Call API to schedule interviews
      const response = await fetch('http://localhost:8000/api/bulk-interviews/bulk-schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(interviewData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to schedule interviews: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Clear selected candidates and set success message
      setSelectedCandidates([]);
      setSchedulingSuccess(true);
      
      // Switch to interviews tab and fetch updated interviews
      setActiveTab('interviews');
      fetchScheduledInterviews();
      
    } catch (err) {
      console.error('Error scheduling interviews:', err);
      setSchedulingError('Failed to schedule interviews. Please try again later.');
    } finally {
      setSchedulingLoading(false);
    }
  };

  // Generate company initial
  const getCompanyInitial = (company) => {
    return company ? company.charAt(0).toUpperCase() : 'C';
  };

  // Format job description with proper HTML formatting
  const formatJobDescription = (description) => {
    if (!description) return '';
    
    // If it already contains HTML tags, assume it's already formatted
    if (description.includes('<') && description.includes('</')) return description;
    
    // Format plain text with proper HTML
    let formatted = description
      // Convert line breaks to paragraphs
      .split('\n\n')
      .map(paragraph => {
        // Check if paragraph is a bullet point list
        if (paragraph.includes('\n- ') || paragraph.includes('\n• ') || paragraph.includes('\n* ')) {
          // Normalize bullet points
          const normalizedParagraph = paragraph
            .replace(/\n- /g, '\n• ')
            .replace(/\n\* /g, '\n• ');
          
          const listItems = normalizedParagraph.split('\n• ');
          const title = listItems.shift();
          
          return `
            ${title ? `<p class="font-medium text-gray-800 mb-2">${title.trim()}</p>` : ''}
            <ul class="list-disc pl-5 mb-4 space-y-2">
              ${listItems.map(item => `<li class="mb-1">${item.trim()}</li>`).join('')}
            </ul>
          `;
        }
        
        // Check if paragraph contains important section headings
        const importantSections = ['REQUIREMENTS', 'QUALIFICATIONS', 'RESPONSIBILITIES', 'ABOUT THE ROLE', 'BENEFITS', 'SKILLS', 'ABOUT THE COMPANY', 'ABOUT US'];
        
        for (const section of importantSections) {
          if (paragraph.toUpperCase().includes(section) && paragraph.length < 100) {
            return `
              <div class="bg-primary-50 p-3 rounded-md border-l-4 border-primary-400 mb-4">
                <h3 class="text-lg font-semibold text-primary-700 mb-2">${paragraph.trim()}</h3>
              </div>
            `;
          }
        }
        
        // Check if paragraph starts with a heading-like format (uppercase words followed by colon)
        if (/^[A-Z][A-Z\s]+:/.test(paragraph)) {
          const [title, ...content] = paragraph.split(':');
          return `
            <h3 class="text-lg font-medium text-gray-800 mb-2">${title.trim()}:</h3>
            <p class="mb-4">${content.join(':').trim()}</p>
          `;
        }
        
        // Regular paragraph
        return `<p class="mb-4">${paragraph.trim()}</p>`;
      })
      .join('');
    
    // Add some additional styling for keywords
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary-700">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-700">$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      // Highlight years of experience mentions
      .replace(/(\d+\+?\s*years?)/gi, '<span class="bg-yellow-100 px-1 rounded text-yellow-800">$1</span>')
      // Highlight job titles
      .replace(/(Software Engineer|Developer|Designer|Manager|Architect|DevOps|Data Scientist|Full Stack|Frontend|Backend)/g,
               '<span class="text-primary-600 font-medium">$1</span>');
    
    return formatted;
  };

  // Fix bullet alignment for PDF (using table layout for stable rendering)
  const fixPdfBullets = (html) => {
    // Replace <ul> with block container
    html = html.replace(/<ul[^>]*>/g, `<div style="margin-left:10px; margin-top:8px;">`);
    html = html.replace(/<\/ul>/g, `</div>`);

    // Replace <li> with table-based bullet
    html = html.replace(/<li[^>]*>(.*?)<\/li>/g, `
    <div style="display:flex; align-items:flex-start; margin-bottom:6px; break-inside:avoid;">
        <div style="font-size:14px; line-height:1.6; margin-right:8px;">•</div>
        <div style="flex:1; line-height:1.6;">$1</div>
    </div>
  `);

    return html;
  };

  const toBase64 = (url) =>
  fetch(url)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
    );

  // Generate PDF with job posting details
  const downloadJobDescription = async () => {
  const logoBase64 = await toBase64(Nts_logo);

  let jdRaw = jdText || jobPosting?.job_description || "";
  const skills = jobPosting?.required_skills || [];

  // ----------- 1️⃣ AUTO-DETECT WORK MODE -----------
  let extractedWorkMode = "";
  const modeMatch = jdRaw.match(/on[-\s]*site|remote|hybrid/gi);
  if (modeMatch && modeMatch.length > 0) {
    extractedWorkMode = modeMatch[0]
      .replace(/\s+/g, " ")
      .replace(/-/g, "-")
      .trim();
  }

  // ----------- 2️⃣ MERGE LOCATION -----------
  const workMode =
    jobPosting.work_mode || extractedWorkMode || "";

  const jobLocation = workMode
    ? `${jobPosting.location}, ${workMode}`
    : jobPosting.location;

  // ----------- 3️⃣ STRONG CLEANUP OF RAW JD -----------
  let normalizedJD = jdRaw
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, " ");

  normalizedJD = normalizedJD
    .replace(/^.*location.*$/gmi, "")
    .replace(/^.*company.*$/gmi, "")
    .replace(/^.*job\s*type.*$/gmi, "")
    .replace(/^#\s*job\s*description.*$/gmi, "");

  normalizedJD = normalizedJD.replace(/\n{2,}/g, "\n").trim();

  // ----------- 4️⃣ CLEAN BOLD + ## MARKDOWN -----------
  const cleanedJD = normalizedJD
    .replace(/\*\*(.*?)\*\*/g, (_, t) => `{{BOLD:${t}}}`)
    .replace(/^##\s*/gm, "## ");

  // ----------- 5️⃣ PARSE JD LINES -----------
  const jdLines = cleanedJD.split("\n").map((p) => {
    let line = p.trim();
    if (!line) return { text: "" };

    if (line.includes("{{BOLD:")) {
      return {
        text: line.replace(/{{BOLD:(.*?)}}/g, "$1"),
        bold: true,
        margin: [0, 3],
        fontSize: 11
      };
    }

    if (/^##\s+/.test(line)) {
      return { text: line.replace(/^##\s+/, ""), style: "mdHeading" };
    }

    if (/^[A-Z ]+:?$/.test(line)) {
      return { text: line.replace(":", ""), style: "sectionHeading" };
    }

    if (/^[-*•]\s+/.test(line)) {
      return {
        ul: [line.replace(/^[-*•]\s+/, "")],
        margin: [0, 3]
      };
    }

    // Extra spacing before Join us...
    if (line.startsWith("Join us")) {
      return { text: line, style: "paragraph", margin: [0, 12, 0, 0] };
    }

    return { text: line, style: "paragraph" };
  });

  // ----------- 6️⃣ PDF DOCUMENT -----------
  const docDefinition = {
    pageMargins: [45, 40, 45, 40],

    content: [
      // HEADER
      {
        columns: [
          { width: 45, image: logoBase64, fit: [40, 40] },
          {
            width: "*",
            stack: [
              { text: "NEUTRINO", bold: true, fontSize: 24, color: "#222" },
              {
                text: "RECRUITING SOLUTIONS",
                fontSize: 10,
                color: "#777",
                margin: [0, -3]
              }
            ],
            margin: [10, 0]
          },
          {
            alignment: "right",
            fontSize: 10,
            color: "#777",
            text: `Generated on:\n${new Date().toLocaleDateString()}`
          }
        ],
        margin: [0, 0, 0, 10]
      },

      // JOB TITLE
      {
        text: jobPosting?.job_title || jobPosting?.job_posting_name,
        style: "jobTitleBanner"
      },

      { text: "\n" },

      // ⭐ NEW COMPANY + JOB TYPE + LOCATION SECTION ⭐
      {
        stack: [
          { text: `Company: ${jobPosting.company || "Neutrino Tech Systems"}`, bold: true, fontSize: 12, margin: [0, 2] },
          { text: `Job Type: ${jobPosting.job_type || "Full-time"}`, bold: true, fontSize: 12, margin: [0, 2] },
          { text: `Location: ${jobLocation}`, bold: true, fontSize: 12, margin: [0, 2] }
        ],
        margin: [0, 5, 0, 15]
      },

      // JOB DESCRIPTION TITLE
      { text: "Job Description", style: "sectionTitle" },

      { text: "\n" },

      // JD CONTENT
      ...jdLines,

      { text: "\n" },

      // SKILLS
      // { text: "Required Skills", style: "sectionTitle" },
      // { ul: skills, margin: [0, 5] }
    ],

    // FOOTER
    footer: () => ({
      margin: [0, -10, 0, 0],
      stack: [
        {
          canvas: [
            { type: "rect", x: 0, y: 0, w: 600, h: 10, color: "#FF6B00" },
            { type: "rect", x: 0, y: 10, w: 600, h: 10, color: "#3B95D3" }
          ]
        },
        {
          text: `© ${new Date().getFullYear()} Neutrino Recruiting Solutions. All rights reserved.`,
          alignment: "center",
          fontSize: 9,
          color: "#555",
          margin: [0, 14]
        }
      ]
    }),

    // STYLES
    styles: {
      jobTitleBanner: {
        fontSize: 18,
        bold: true,
        color: "#222",
        background: "#EAF3FF",
        padding: 10,
        margin: [0, 5]
      },
      sectionTitle: {
        fontSize: 15,
        bold: true,
        color: "#3B95D3",
        margin: [0, 6, 0, 6]
      },
      sectionHeading: {
        fontSize: 13,
        bold: true,
        color: "#222",
        margin: [0, 10, 0, 5]
      },
      mdHeading: {
        fontSize: 13,
        bold: true,
        color: "#3B95D3",
        margin: [0, 10, 0, 5]
      },
      paragraph: {
        fontSize: 11,
        color: "#333",
        lineHeight: 1.4
      }
    }
  };

  pdfMake.createPdf(docDefinition).download(
    `${jobPosting.job_title}_description.pdf`
  );
};

  // Get random color for company avatar
  const getCompanyColor = (company) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    // Use company name to deterministically select a color
    const index = company ? company.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // Handle tab change with animation
  const handleTabChange = (tab) => {
    setTabAnimation(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTabAnimation(false);
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fadeIn">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-600 absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-500 animate-pulse">Loading job posting details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl animate-slideInUp">
          <div className="flex items-center">
            <CloseIcon className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Job Posting</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/job-postings')}
            className="mt-4 btn btn-outline btn-sm"
          >
            <BackIcon className="h-4 w-4 mr-1" />
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Gradient Background */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-purple-50 rounded-2xl p-8 shadow-xl animate-slideInDown">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate('/job-postings')}
            className="mr-4 p-2 rounded-lg hover:bg-white/50 transition-all duration-200 group"
          >
            <BackIcon className="h-5 w-5 text-gray-600 group-hover:text-primary-700 transition-colors" />
          </button>
          <span className="text-sm text-gray-500">Back to Job Postings</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div className="flex items-center animate-slideInLeft">
            <div
  className={`
    flex-shrink-0 h-16 w-16 rounded-xl
    text-white flex items-center justify-center font-bold text-lg
    shadow-md transform transition-all duration-300 bg-white
  `}
>
  <div className="flex items-center">
  <div className="h-11 w-11 flex items-center">
    <img
      src={Nts_logo}
      alt="NTSLOGO"
      className="h-11 w-11 object-contain"
    />
  </div>
</div>

</div>
            <div className="ml-6">
              <h1 className="text-4xl font-bold text-gray-900 font-serif tracking-tight">
                {jobPosting?.job_posting_name || jobPosting?.job_title || "Job Posting"}
              </h1>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                
                  {jobPosting?.company}
                </span>
                <span className="flex items-center">
                
                  {jobPosting?.location}
                </span>
                <span className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Posted {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
         
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { icon: GroupIcon, label: 'Applicants', value: '0' },
            { icon: ViewIcon, label: 'Views', value: '0' },
            { icon: ScheduleIcon, label: 'Interviews', value: scheduledInterviews.length },
            {
              icon: StarIcon,
              label: 'Status',
              value: jobPosting?.status || 'Active',
              isStatus: true
            },
          ].map((stat, index) => (
            <div 
              key={index}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-3 animate-slideInUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center space-x-3">
                <stat.icon className="h-5 w-5 text-primary-500" />
                {stat.isStatus ? (
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <StatusDropdown
                      jobId={id}
                      currentStatus={jobPosting?.status || 'active'}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 animate-slideInUp">
        <nav className="flex space-x-9">
          {[
            { id: 'details', label: 'Details', icon: DescriptionIcon },
            { id: 'screening', label: 'Resume Screening', icon: AssessmentIcon },
            { id: 'interviews', label: 'Interviews', icon: GroupIcon },
            { id: 'assessments', label: 'Assessment Reports', icon: AssessmentIcon },
            { id: 'statistics', label: 'Statistics', icon: AssessmentIcon }

          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium
                transition-all duration-300 transform
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl scale-105' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              <span>{tab.label}</span>
              {tab.id === 'screening' && screeningResults.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20">
                  {screeningResults.length}
                </span>
              )}
              {tab.id === 'interviews' && scheduledInterviews.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20">
                  {scheduledInterviews.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content with Animation */}
      <div className={`tab-content transition-all duration-300 ${tabAnimation ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
        {activeTab === 'details' && (
          <div className="space-y-8">
            {/* Job Details */}
            <div className="card bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                  <WorkIcon className="h-6 w-6 mr-2 text-primary-600" />
                  <span className="text-gray-800 font-serif">Job Details</span>
                </h2>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-700">
                      <WorkIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Job Type:</span>
                      <span>{jobPosting?.job_type}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <LocationIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Location:</span>
                      <span>{jobPosting?.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <ExperienceIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Experience Level:</span>
                      <span>{jobPosting?.experience_level}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <DepartmentIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Department:</span>
                      <span>{jobPosting?.department}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobPosting?.required_skills && jobPosting.required_skills.map((skill, index) => (
                      <span key={index} className="badge badge-primary badge-lg py-3">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Enhanced Job Description with better styling */}
            <div className="card bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <DescriptionIcon className="h-6 w-6 mr-2 text-primary-600" />
                    <span className="text-gray-800 font-serif">Job Description</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* EDIT BUTTON */}
                    <button
                      onClick={() => {
                        setIsEditingJD(true);
                        // ensure jdText initialized
                        if (!initialJdLoaded && jobPosting?.job_description) {
                          setJdText(jobPosting.job_description);
                          setInitialJdLoaded(true);
                        }
                      }}
                      className="btn btn-outline btn-sm flex items-center"
                      title="Edit Job Description"
                    >
                      <EditIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>

                    {/* DOWNLOAD BUTTON (unchanged) */}
                    <button
                      onClick={downloadJobDescription}
                      className="btn btn-outline btn-sm flex items-center"
                      title="Download Job Description"
                    >
                      <FileDownloadIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none">
                  <div className="p-6">
                    {/* ========== IF EDITING → SHOW TEXTAREA ========== */}
                    {isEditingJD ? (
                      <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        onBlur={async () => {
                          // End editing and save
                          setIsEditingJD(false);
                          await saveUpdatedJD();
                        }}
                        className="w-full border border-gray-300 rounded p-3 min-h-[300px] focus:ring focus:ring-primary-300"
                        autoFocus
                      />
                    ) : (
                      /* ========== NORMAL DISPLAY MODE ========== */
                      <div className="prose prose-lg max-w-none">
                        <div
                          dangerouslySetInnerHTML={{ __html: formatJobDescription(jdText || jobPosting?.job_description || '') }}
                          className="job-description-content leading-relaxed text-gray-700 rounded-lg bg-gray-50 p-6 border-l-4 border-primary-400"
                          style={{
                            lineHeight: '1.8',
                            fontSize: '1.05rem'
                          }}
                        />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'screening' && (
          <div className="space-y-8">
            <div className="card bg-white shadow-xlrounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                  <AssignmentIcon className="h-6 w-6 mr-2 text-primary-600" />
                  <span className="text-gray-800 font-serif">Resume Screening</span>
                </h2>
                
                <p className="text-gray-700 mb-6">
                  Upload a job description PDF and a zip file containing candidate resumes to screen them against this job posting.
                </p>
                
                {/* Warning message when job is not active */}
                {jobPosting?.status !== 'active' && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md mb-6">
                    <div className="flex">
                      <WarningIcon className="h-5 w-5 text-amber-500 mr-2" />
                      <p className="text-sm text-amber-700">
                        <strong>Resume screening is disabled.</strong> Job posting is not open.
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* JD Upload */}
                  <div>
                    <label className={`block text-sm font-medium ${jobPosting?.status === 'active' ? 'text-gray-700' : 'text-gray-400'} mb-1`}>
                      Upload Job Description (PDF)
                    </label>
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${jobPosting?.status === 'active' ? 'border-gray-300' : 'border-gray-200'} border-dashed rounded-md ${jobPosting?.status !== 'active' ? 'opacity-60' : ''}`}>
                      <div className="space-y-1 text-center">
                        <DescriptionIcon className={`mx-auto h-12 w-12 ${jobPosting?.status === 'active' ? 'text-gray-400' : 'text-gray-300'}`} />
                        <div className={`flex text-sm ${jobPosting?.status === 'active' ? 'text-gray-600' : 'text-gray-400'}`}>
                          <label htmlFor="jd-file" className={`relative ${jobPosting?.status === 'active' ? 'cursor-pointer' : 'cursor-not-allowed'} bg-white rounded-md font-medium ${jobPosting?.status === 'active' ? 'text-primary-600 hover:text-primary-500' : 'text-gray-400'} focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500`}>
                            <span>Upload a file</span>
                            <input
                              disabled={jobPosting?.status !== 'active'}
                              id="jd-file"
                              name="jd-file"
                              type="file"
                              accept=".pdf"
                              className="sr-only"
                              onChange={handleJdFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF file containing job description
                        </p>
                      </div>
                    </div>
                    {jdFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected file: {jdFile.name}
                      </p>
                    )}
                  </div>
                  
                  {/* Resumes Upload */}
                  <div>
                    <label className={`block text-sm font-medium ${jobPosting?.status === 'active' ? 'text-gray-700' : 'text-gray-400'} mb-1`}>
                      Upload Resumes (ZIP file)
                    </label>
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${jobPosting?.status === 'active' ? 'border-gray-300' : 'border-gray-200'} border-dashed rounded-md ${jobPosting?.status !== 'active' ? 'opacity-60' : ''}`}>
                      <div className="space-y-1 text-center">
                        <CloudUploadIcon className={`mx-auto h-12 w-12 ${jobPosting?.status === 'active' ? 'text-gray-400' : 'text-gray-300'}`} />
                        <div className={`flex text-sm ${jobPosting?.status === 'active' ? 'text-gray-600' : 'text-gray-400'}`}>
                          <label htmlFor="resume-file" className={`relative ${jobPosting?.status === 'active' ? 'cursor-pointer' : 'cursor-not-allowed'} bg-white rounded-md font-medium ${jobPosting?.status === 'active' ? 'text-primary-600 hover:text-primary-500' : 'text-gray-400'} focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500`}>
                            <span>Upload a file</span>
                            <input
                              disabled={jobPosting?.status !== 'active'}
                              id="resume-file"
                              name="resume-file"
                              type="file"
                              accept=".zip"
                              className="sr-only"
                              onChange={handleResumeFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          ZIP file containing PDF resumes
                        </p>
                      </div>
                    </div>
                    {resumeFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected file: {resumeFile.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleScreenResumes}
                    disabled={!jdFile || !resumeFile || screeningLoading || jobPosting?.status !== 'active'}
                    className={`btn w-full md:w-auto ${jobPosting?.status === 'active' ? 'btn-primary' : 'btn-disabled bg-gray-300'}`}
                    title={jobPosting?.status !== 'active' ? "Resume screening is only available for active job postings" : ""}
                  >
                    {screeningLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Screening...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-5 w-5 mr-2" />
                        Screen Resumes
                      </>
                    )}
                  </button>
                </div>
                
                {screeningError && (
                  <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-md mb-6 mt-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-danger-700">{screeningError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Email Attachments */}
<div className="mb-4">
  <label className={`block text-sm font-medium ${jobPosting?.status === 'active' ? 'text-gray-700' : 'text-gray-400'} mb-1`}>
    Email Attachments (Optional)
  </label>
  <div className={`mt-1 flex justify-center px-6 pt-3 pb-3 border-2 ${jobPosting?.status === 'active' ? 'border-gray-300' : 'border-gray-200'} border-dashed rounded-md ${jobPosting?.status !== 'active' ? 'opacity-60' : ''}`}>
    <div className="space-y-1 text-center">
      <div className="flex flex-col items-center">
        <EmailIcon className={`mx-auto h-8 w-8 ${jobPosting?.status === 'active' ? 'text-gray-400' : 'text-gray-300'}`} />
        <div className="flex text-sm text-gray-600">
          <label
            htmlFor="attachment-upload"
            className={`relative ${jobPosting?.status === 'active' ? 'cursor-pointer' : 'cursor-not-allowed'} bg-white rounded-md font-medium ${jobPosting?.status === 'active' ? 'text-primary-600 hover:text-primary-500' : 'text-gray-400'}`}
          >
            <span>Upload attachments</span>
            <input
              id="attachment-upload"
              name="attachment-upload"
              type="file"
              disabled={jobPosting?.status !== 'active'}
              className="sr-only"
              multiple
              onChange={handleEmailAttachmentChange}
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">
          Any file type up to 5MB each
        </p>
      </div>
    </div>
  </div>
  
  {/* Attachment List */}
  {emailAttachments.length > 0 && (
    <div className="mt-2">
      <p className="text-sm font-medium text-gray-700 mb-1">Selected Attachments:</p>
      <ul className="border rounded-md divide-y">
        {emailAttachments.map((file, index) => (
          <li key={index} className="pl-3 pr-4 py-2 flex items-center justify-between text-sm">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex-1 w-0 truncate">{file.name}</span>
              <span className="ml-2 flex-shrink-0 text-gray-400">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="font-medium text-red-600 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>

                {/* Schedule Interviews Section */}
                {selectedCandidates.length > 0 && (
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Schedule Interviews for Selected Candidates</h4>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date and Time
                      </label>
                      <input
                        type="datetime-local"
                        value={interviewDateTime}
                        onChange={(e) => setInterviewDateTime(e.target.value)}
                        className="input input-bordered w-full"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    
                    {/* Email Attachments */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Attachments (Optional)
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-3 pb-3 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <div className="flex flex-col items-center">
                            <EmailIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="attachment-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                              >
                                <span>Upload attachments</span>
                                <input
                                  id="attachment-upload"
                                  name="attachment-upload"
                                  type="file"
                                  className="sr-only"
                                  multiple
                                  onChange={handleEmailAttachmentChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              Any file type up to 5MB each
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Attachment List */}
                      {emailAttachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Selected Attachments:</p>
                          <ul className="border rounded-md divide-y">
                            {emailAttachments.map((file, index) => (
                              <li key={index} className="pl-3 pr-4 py-2 flex items-center justify-between text-sm">
                                <div className="w-0 flex-1 flex items-center">
                                  <span className="flex-1 w-0 truncate">{file.name}</span>
                                  <span className="ml-2 flex-shrink-0 text-gray-400">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="font-medium text-red-600 hover:text-red-500"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleScheduleInterviews}
                        disabled={!interviewDateTime || schedulingLoading}
                        className="btn btn-primary"
                      >
                        {schedulingLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Scheduling...
                          </>
                        ) : (
                          <>
                            Schedule Interviews ({selectedCandidates.length})
                          </>
                        )}
                      </button>
                    </div>
                    
                    {schedulingError && (
                      <div className="mt-4 bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-md">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-danger-700">{schedulingError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {schedulingSuccess && (
                      <div className="mt-4 bg-success-50 border-l-4 border-success-500 p-4 rounded-r-md">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-success-700">
                              Interviews scheduled successfully! Candidates will receive confirmation emails.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Screening Results */}
                {screeningResults.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Screening Results</h3>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={selectedCandidates.length === screeningResults.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="select-all" className="ml-2 text-sm text-gray-700">
                          Select All Candidates
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {screeningResults.map((candidate, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-xl transition-shadow duration-200"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={selectedCandidates.includes(candidate.resume)}
                                onChange={(e) => handleSelectCandidate(candidate.resume, e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 flex-grow">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                    <PersonIcon className="h-5 w-5 mr-2 text-gray-500" />
                                    {candidate.resume}
                                  </h4>
                                  {candidate.candidate_email && (
                                    <p className="text-sm text-gray-600 ml-7">{candidate.candidate_email}</p>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <StarIcon className="h-5 w-5 text-yellow-500 mr-1" />
                                  <span className="font-semibold">{candidate.ATS_Score}/100</span>
                                </div>
                              </div>
                              
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                                    <StarIcon className="h-4 w-4 mr-1 text-green-500" />
                                    Strengths
                                  </h5>
                                  <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                                    {candidate.Strengths.map((strength, i) => (
                                      <li key={i}>{strength}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                                    <WarningIcon className="h-4 w-4 mr-1 text-orange-500" />
                                    Weaknesses
                                  </h5>
                                  <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                                    {candidate.Weaknesses.map((weakness, i) => (
                                      <li key={i}>{weakness}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Report Modal */}
            {isReportModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  {/* Background overlay */}
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsReportModalOpen(false)}></div>
                  
                  {/* Modal panel */}
                  <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl leading-6 font-bold text-gray-900" id="modal-title">
                              Candidate Assessment Report
                            </h3>
                            <button
                              onClick={() => setIsReportModalOpen(false)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <CloseIcon className="h-6 w-6" />
                            </button>
                          </div>
                          
                          {reportLoading ? (
                            <div className="flex justify-center py-8">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                            </div>
                          ) : reportError ? (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4">
                              <div className="flex">
                                <div className="ml-3">
                                  <p className="text-sm text-red-700">{reportError}</p>
                                </div>
                              </div>
                            </div>
                          ) : currentReportData ? (
                            <div className="space-y-6">
                              {/* Candidate Info */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center text-white">
                                    <PersonIcon className="h-6 w-6" />
                                  </div>
                                  <div className="ml-4">
                                    <h4 className="text-lg font-medium text-gray-900">{currentReportData.name || "Unknown Candidate"}</h4>
                                    <p className="text-sm text-gray-500">{currentReportData.email || "No email"}</p>
                                    <p className="text-sm text-gray-500">{currentReportData.position || "Unknown Position"}</p>
                                  </div>
                                  <div className="ml-auto">
                                    <div className="text-right">
                                      <div className="text-sm text-gray-500">Overall Score</div>
                                      <div className="text-2xl font-bold text-primary-600">{currentReportData.overall?.score || 0}%</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Assessment Scores */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* MCQ Score */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <h5 className="text-blue-800 font-medium flex items-center mb-2">
                                    <AssessmentIcon className="mr-2 text-blue-600" />
                                    MCQ Assessment
                                  </h5>
                                  <div className="mb-2">
                                    <div className="w-full bg-blue-200 rounded-full h-2.5 mb-1">
                                      <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${currentReportData.mcq?.score || 0}%` }}
                                      ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-blue-800">
                                      <span>0%</span>
                                      <span>50%</span>
                                      <span>100%</span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-700 mt-2">
                                    <p><span className="font-medium">Score:</span> {currentReportData.mcq?.score || 0}%</p>
                                    <p><span className="font-medium">Details:</span> {currentReportData.mcq?.details || "No details available"}</p>
                                  </div>
                                </div>
                                
                                {/* Voice Score */}
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                  <h5 className="text-purple-800 font-medium flex items-center mb-2">
                                    <MicIcon className="mr-2 text-purple-600" />
                                    Voice Interview
                                  </h5>
                                  <div className="mb-2">
                                    <div className="w-full bg-purple-200 rounded-full h-2.5 mb-1">
                                      <div
                                        className="bg-purple-600 h-2.5 rounded-full"
                                        style={{ width: `${currentReportData.voice?.score || 0}%` }}
                                      ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-purple-800">
                                      <span>0%</span>
                                      <span>50%</span>
                                      <span>100%</span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-700 mt-2">
                                    <p><span className="font-medium">Score:</span> {currentReportData.voice?.score || 0}%</p>
                                    <p><span className="font-medium">Details:</span> {currentReportData.voice?.details || "No details available"}</p>
                                  </div>
                                </div>
                                
                                {/* Coding Score */}
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                  <h5 className="text-green-800 font-medium flex items-center mb-2">
                                    <CodeIcon className="mr-2 text-green-600" />
                                    Coding Challenge
                                  </h5>
                                  <div className="mb-2">
                                    <div className="w-full bg-green-200 rounded-full h-2.5 mb-1">
                                      <div
                                        className="bg-green-600 h-2.5 rounded-full"
                                        style={{ width: `${currentReportData.coding?.score || 0}%` }}
                                      ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-green-800">
                                      <span>0%</span>
                                      <span>50%</span>
                                      <span>100%</span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-700 mt-2">
                                    <p><span className="font-medium">Score:</span> {currentReportData.coding?.score || 0}%</p>
                                    <p><span className="font-medium">Details:</span> {currentReportData.coding?.details || "No details available"}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Overall Assessment */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h5 className="text-gray-800 font-medium mb-2">Overall Assessment</h5>
                                <div className="flex items-center mb-2">
                                  <div className="flex text-yellow-400">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                      const rating = (currentReportData.overall?.score || 0) / 20; // Convert to 5-star scale
                                      return star <= Math.floor(rating) ? (
                                        <StarIcon key={star} className="h-5 w-5" />
                                      ) : star === Math.ceil(rating) && !Number.isInteger(rating) ? (
                                        <StarHalfIcon key={star} className="h-5 w-5" />
                                      ) : (
                                        <StarBorderIcon key={star} className="h-5 w-5" />
                                      );
                                    })}
                                  </div>
                                  <span className="ml-2 text-sm font-medium text-gray-900">{currentReportData.overall?.score || 0}%</span>
                                </div>
                                <div className="text-sm text-gray-700">
                                  <p><span className="font-medium">Rating:</span> {currentReportData.overall?.rating || "Not Rated"}</p>
                                  <p><span className="font-medium">Recommendation:</span> {currentReportData.overall?.recommendation || "No recommendation"}</p>
                                  <p className="mt-2"><span className="font-medium">Feedback:</span> {currentReportData.overall?.feedback || "No feedback available"}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              No report data available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        onClick={() => currentReportData && handleDownloadReport(currentReportData.id)}
                        disabled={!currentReportData || reportLoading}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        <DownloadIcon className="h-5 w-5 mr-2" />
                        Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'interviews' && (
          <div className="card bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                <PersonIcon className="h-6 w-6 mr-2 text-primary-600" />
                <span className="text-gray-800 font-serif">Scheduled Interviews</span>
              </h2>

              {scheduledInterviews.length === 0 ? (
                <p className="text-gray-700">
                  No interviews scheduled yet. Select candidates from the Resume Screening tab to schedule interviews.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reports
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scheduledInterviews.map((interview, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{interview.candidate_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{interview.candidate_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(interview.scheduled_datetime).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                              interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              interview.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {interview.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {interview.status === 'completed' ? (
                              <button
                                onClick={() => handleViewReport(interview.id)}
                                className="text-blue-500 hover:text-blue-700 font-medium flex items-center"
                              >
                                <AssessmentIcon className="h-4 w-4 mr-1" />
                                Report
                              </button>
                            ) : (
                              <span className="text-gray-400">NA</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-8">
            <CandidateAssessmentReports jobPostingId={id} />
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="card bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                <AssessmentIcon className="h-6 w-6 mr-2 text-primary-600" />
                <span className="text-gray-800 font-serif">Job Posting Statistics</span>
              </h2>
              
                <JobPostingStatistics jobPostingId={id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobPostingDetail;
