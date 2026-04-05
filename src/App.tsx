import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';




/* ===================================================== */
/*                LAZY LOADED PAGES                      */
/* ===================================================== */




const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const Overview = lazy(() => import('@/pages/Overview'));
const AttendanceTracker = lazy(() => import('@/pages/AttendanceTracker'));
const TeamChat = lazy(() => import('@/pages/TeamChat'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const PaymentVerification = lazy(() => import('@/pages/PaymentVerification'));
const CertificateManager = lazy(() => import('@/pages/CertificateManager'));
const InternshipTracker = lazy(() => import('@/pages/InternshipTracker'));
const AdminManagement = lazy(() => import('@/pages/AdminManagement'));
const BulkUpload = lazy(() => import('@/pages/BulkUpload'));
const NotificationCenter = lazy(() => import('@/pages/NotificationCenter'));
const FileManager = lazy(() => import('@/pages/FileManager'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const SocialMediaAnalytics = lazy(() => import('@/pages/SocialMediaAnalytics'));
const EmployeeManagement = lazy(() => import('@/pages/EmployeeManagement'));
const CareerApplications = lazy(() => import('@/pages/CareerApplications'));
const EsportsPlayersList = lazy(() => import('@/pages/EsportsPlayersList'));
const EsportsAddPlayer = lazy(() => import('@/pages/EsportsAddPlayer'));
const TechWorkDashboard = lazy(() => import('@/pages/TechWorkDashboard'));
const ContentWorkDashboard = lazy(() => import('@/pages/ContentWorkDashboard'));
const LeaveManagement = lazy(() => import('@/pages/LeaveManagement'));
const AdminEmployeeProfile = lazy(() => import('@/pages/AdminEmployeeProfile'));
const HolidayCalendar = lazy(() => import('@/pages/HolidayCalendar'));
const HRDashboard = lazy(() => import('@/pages/HRDashboard'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

const Announcements = lazy(() => import('@/pages/Announcements'));
const PollsSurveys = lazy(() => import('@/pages/PollsSurveys'));
const KanbanBoard = lazy(() => import('@/pages/KanbanBoard'));
const StandupLogs = lazy(() => import('@/pages/StandupLogs'));
const FeedbackSystem = lazy(() => import('@/pages/FeedbackSystem'));
const TeamEvents = lazy(() => import('@/pages/TeamEvents'));
const PerformanceScores = lazy(() => import('@/pages/PerformanceScores'));
const AdminReport = lazy(() => import('@/pages/AdminReport'));
const BirthdayReminders = lazy(() => import('@/pages/BirthdayReminders'));




/* ===================================================== */
/*                LOADING FALLBACK                       */
/* ===================================================== */




const Loader = () => (
  <div className="w-full h-screen flex items-center justify-center">
    <div className="loader" />
  </div>
);

/* ===================================================== */
/*                ROUTE CONFIGURATION                    */
/* ===================================================== */

const dashboardRoutes = [
  { path: "overview", element: <Overview /> },
  { path: "attendance", element: <AttendanceTracker /> },
  { path: "chat", element: <TeamChat /> },
  { path: "analytics", element: <Analytics /> },
  { path: "payments", element: <PaymentVerification /> },
  { path: "certificates", element: <CertificateManager /> },
  { path: "internships", element: <InternshipTracker /> },
  { path: "admin-management", element: <AdminManagement /> },
  { path: "bulk-upload", element: <BulkUpload /> },
  { path: "notifications", element: <NotificationCenter /> },
  { path: "files", element: <FileManager /> },
  { path: "audit-logs", element: <AuditLogs /> },
  { path: "social-analytics", element: <SocialMediaAnalytics /> },
  { path: "employees", element: <EmployeeManagement /> },
  { path: "careers", element: <CareerApplications /> },
  { path: "esports/players", element: <EsportsPlayersList /> },
  { path: "esports/add-player", element: <EsportsAddPlayer /> },
  { path: "tech-work", element: <TechWorkDashboard /> },
  { path: "content-work", element: <ContentWorkDashboard /> },
  { path: "leave", element: <LeaveManagement /> },
  { path: "employee-profile", element: <AdminEmployeeProfile /> },
  { path: "holidays", element: <HolidayCalendar /> },
  { path: "hr", element: <HRDashboard /> },
  { path: "settings", element: <SettingsPage /> },
  { path: "announcements", element: <Announcements /> },
  { path: "polls", element: <PollsSurveys /> },
  { path: "tasks", element: <KanbanBoard /> },
  { path: "standups", element: <StandupLogs /> },
  { path: "feedback", element: <FeedbackSystem /> },
  { path: "events", element: <TeamEvents /> },
  { path: "performance", element: <PerformanceScores /> },
  { path: "reports", element: <AdminReport /> },
  { path: "birthdays", element: <BirthdayReminders /> },
];

/* ===================================================== */
/*                MAIN APP COMPONENT                     */
/* ===================================================== */

function App() {
  return (
    <AuthProvider>
      <Toaster />

      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>

            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Dashboard Root */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Dynamic Dashboard Routes */}
            {dashboardRoutes.map((route, index) => (
              <Route
                key={index}
                path={`/dashboard/${route.path}`}
                element={
                  <ProtectedRoute>
                    {route.element}
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Redirects */}
            <Route
              path="/home"
              element={<Navigate to="/dashboard/overview" />}
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
