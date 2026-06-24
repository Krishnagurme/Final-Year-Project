import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './components/Navbar.jsx';
import { setCredentials } from './store/authSlice.js';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentCoursesPage from './pages/StudentCoursesPage.jsx';
import StudentCourseDetail from './pages/StudentCourseDetail.jsx';
import AIAssessmentPage from './pages/AIAssessmentPage.jsx';
import SkillLevelPage from './pages/SkillLevelPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import CertificatePage from './pages/CertificatePage.jsx';
import StudentProfilePage from './pages/StudentProfilePage.jsx';
import StudentTodoPage from './pages/StudentTodoPage.jsx';
import StudentNotesPage from './pages/StudentNotesPage.jsx';
import AIWorkspacePage from './pages/AIWorkspacePage.jsx';
import SaaSNavbarMockup from './components/SaaSNavbarMockup.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CertificateVerifyPage from './pages/CertificateVerifyPage.jsx';

function GuestRoute({ children }) {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (isAuthenticated && user) {
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!['ADMIN', 'INSTRUCTOR'].includes(user?.role)) {
    if (user?.role === 'STUDENT') return <Navigate to="/student/dashboard" />;
    return <Navigate to="/login" />;
  }

  return children;
}

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'STUDENT') return <Navigate to="/student/dashboard" />;
    if (user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/login" />;
  }

  return children;
}

function HomeRedirect() {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Redirect authenticated users to their appropriate dashboard
  if (user?.role === 'STUDENT') return <Navigate to="/student/dashboard" />;
  if (user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') return <Navigate to="/admin/dashboard" />;
  return <Navigate to="/login" />;
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch(setCredentials({ user, token }));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, [dispatch]);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route path="/navbar-mockup" element={<SaaSNavbarMockup />} />
        <Route path="/certificate/verify/:token" element={<CertificateVerifyPage />} />

        {/* Admin Route */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <StudentCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:courseId"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <StudentCourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/assessment"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <AIAssessmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/skills"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <SkillLevelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/progress"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/certificates"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <CertificatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/todos"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <StudentTodoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notes"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <StudentNotesPage />
            </ProtectedRoute>
          }
        />


        <Route
          path="/ai/workspace"
          element={
            <ProtectedRoute>
              <AIWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route path="/deeptutor" element={<Navigate to="/ai/workspace" replace />} />

        {/* Redirect */}
        <Route path="/" element={<HomeRedirect />} />
      </Routes>
    </>
  );
}

export default App;
