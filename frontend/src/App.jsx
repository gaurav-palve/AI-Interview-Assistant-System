import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Admin Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import InterviewList from './pages/InterviewList';
import InterviewCreate from './pages/InterviewCreate';
import InterviewDetail from './pages/InterviewDetail';
import InterviewEdit from './pages/InterviewEdit';
import FileUpload from './pages/FileUpload';
import MCQGeneration from './pages/MCQGeneration';
import MCQReport from './pages/MCQReport';
import Statistics from './pages/Statistics';
import NotFound from './pages/NotFound';

// Candidate Pages
import CandidateInterview from './pages/CandidateInterview';

/**
 * Main App component
 * Sets up routing and authentication
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Candidate routes (public) */}
          <Route path="/candidate/interview/:interviewId" element={<CandidateInterview />} />
          
          {/* Protected admin routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/interviews" element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewList />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/interviews/new" element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewCreate />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/interviews/:id" element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewDetail />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/interviews/:id/edit" element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewEdit />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/upload" element={
            <ProtectedRoute>
              <MainLayout>
                <FileUpload />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/mcq" element={
            <ProtectedRoute>
              <MainLayout>
                <MCQGeneration />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/statistics" element={
            <ProtectedRoute>
              <MainLayout>
                <Statistics />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/interviews/:interviewId/mcq-report" element={
            <ProtectedRoute>
              <MainLayout>
                <MCQReport />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* 404 Not Found route */}
          <Route path="/404" element={<NotFound />} />
          
          {/* Redirect any unknown routes to 404 */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
 