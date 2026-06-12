import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentIssues from './pages/student/Issues';
import StudentIssueDetail from './pages/student/IssueDetail';
import StudentCreateIssue from './pages/student/CreateIssue';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminIssues from './pages/admin/Issues';
import AdminIssueDetail from './pages/admin/IssueDetail';
import AdminFeedback from './pages/admin/Feedback';
import PendingStudents from './pages/admin/PendingStudents';
import RequestResources from './pages/admin/RequestResources';

// Super admin pages
import SuperAdminDashboard from './pages/super/Dashboard';
import SuperAdminAdmins from './pages/super/Admins';
import SuperAdminFeedback from './pages/super/Feedback';
import SuperAdminAllIssues from './pages/super/AllIssues';
import AdminDetail from './pages/super/AdminDetail';
import CreateAdmin from './pages/super/CreateAdmin';

// Management pages
import ManagementDashboard from './pages/management/Dashboard';
import Reports from './pages/management/Reports';
import Announcements from './pages/management/Announcements';
import ResourceRequests from './pages/management/ResourceRequests';

// Shared pages
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;
  if (user.role === 'department_admin') return <Navigate to="/admin" replace />;
  if (user.role === 'management') return <Navigate to="/management" replace />;
  if (user.role === 'super_admin') return <Navigate to="/super" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Auto-redirect root */}
          <Route path="/" element={<RoleRedirect />} />
          
          {/* Student routes */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="issues" element={<StudentIssues />} />
            <Route path="issues/new" element={<StudentCreateIssue />} />
            <Route path="issues/:id" element={<StudentIssueDetail />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Department admin routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['department_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="issues" element={<AdminIssues />} />
            <Route path="issues/:id" element={<AdminIssueDetail />} />
            <Route path="pending-students" element={<PendingStudents />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="request-resources" element={<RequestResources />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Management routes */}
          <Route path="/management" element={<ProtectedRoute roles={['management']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<ManagementDashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="resource-requests" element={<ResourceRequests />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Super admin routes */}
          <Route path="/super" element={<ProtectedRoute roles={['super_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="admins" element={<SuperAdminAdmins />} />
            <Route path="admins/new" element={<CreateAdmin />} />
            <Route path="admins/:id" element={<AdminDetail />} />
            <Route path="feedback" element={<SuperAdminFeedback />} />
            <Route path="issues" element={<SuperAdminAllIssues />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;