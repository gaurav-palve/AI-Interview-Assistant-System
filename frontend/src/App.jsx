import { Routes, Route, Navigate } from 'react-router-dom';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Admin Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import InterviewList from './pages/InterviewList';
import InterviewCreate from './pages/InterviewCreate';
import InterviewDetail from './pages/InterviewDetail';
import InterviewEdit from './pages/InterviewEdit';
import FileUpload from './pages/FileUpload';
import MCQGeneration from './pages/MCQGeneration';
import Statistics from './pages/Statistics';
import ResumeScreening from './pages/ResumeScreening';
import JobDescriptionGenerator from './pages/JobDescriptionGenerator';
import JobPostingsList from './pages/JobPostings/JobPostingsList';
import CreateJobPosting from './pages/JobPostings/CreateJobPosting';
import JobPostingDetail from './pages/JobPostings/JobPostingDetail';
import CandidateAssessmentReports from './pages/CandidateAssessmentReports';
import TokenUsage from './pages/Admin/TokenUsage';
import NotFound from './pages/NotFound';

// Candidate Pages
import CandidateInterview from './pages/CandidateInterview';
import InterviewComplete from './pages/InterviewComplete';

// Voice interview
import VoiceInterview from './pages/VoiceInterview';
import VoiceInterviewInstructions from './pages/VoiceInterviewInstructions';

// Coding interview
import CodingInstructions from './pages/CodingInstructions';
import LeetCodeLayout from './components/LeetCodeLayout';
import CreateRole from './pages/SuperAdmin/RoleManagement';
import RoleManagement from './pages/SuperAdmin/RoleManagement';

/**
 * Main App component
 * Routing and authentication setup
 */
function App() {
  return (
    <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Candidate routes (public) */}
        <Route path="/candidate/interview/:interviewId" element={<CandidateInterview />} />
        <Route path="/voice-interview-instructions/:interviewId" element={<VoiceInterviewInstructions />} />
        <Route path="/voice-interview/:interviewId" element={<VoiceInterview />} />
        <Route path="/coding-instructions/:interviewId" element={<CodingInstructions />} />
        <Route path="/leetcode/:interviewId" element={<LeetCodeLayout />} />
        <Route path="/interview-complete" element={<InterviewComplete />} />

        {/* Protected admin routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews"
          element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewList />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewCreate />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewEdit />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FileUpload />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/mcq"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MCQGeneration />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Statistics />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume-screening"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ResumeScreening />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidate-assessment-reports"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CandidateAssessmentReports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-description-generator"
          element={
            <ProtectedRoute>
              <MainLayout>
                <JobDescriptionGenerator />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-postings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <JobPostingsList />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-postings/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CreateJobPosting />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-postings/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <JobPostingDetail />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/token-usage" element={
            <ProtectedRoute>
              <MainLayout>
                <TokenUsage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/create-role" element={ 
            <ProtectedRoute>
              <MainLayout>
                <RoleManagement />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* 404 Not Found route */}
          <Route path="/404" element={<NotFound />} />
          
          {/* Voice interview routes - Make them public for candidates */}
          <Route path="/voice-interview-instructions/:interviewId" element={<VoiceInterviewInstructions />} />
          <Route path="/voice-interview/:interviewId" element={<VoiceInterview />} />
          
          {/* Coding interview routes - Make them public for candidates */}
          <Route path="/coding-instructions/:interviewId" element={<CodingInstructions />} />
          <Route path="/leetcode/:interviewId" element={<LeetCodeLayout />} />
          
          {/* Interview completion page */}
          <Route path="/interview-complete" element={<InterviewComplete />} />
          
          {/* Redirect any unknown routes to 404 */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
    //     </Router>
    //   </CameraProvider>
    // </AuthProvider>
  );
}

export default App;
