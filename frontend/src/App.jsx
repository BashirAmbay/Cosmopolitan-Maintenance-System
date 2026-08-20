import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ProfileSetupModal } from './components/common/ProfileSetupModal';

import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { NewRequest } from './pages/Requests/NewRequest';
import { RequestList } from './pages/Requests/RequestList';
import { RequestDetail } from './pages/Requests/RequestDetail';
import { ManagementDashboard } from './components/dashboard/ManagementDashboard';
import { AdminPanel } from './pages/Admin/AdminPanel';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-wider">
        Loading System Context...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Role & Department Onboarding Modal */}
      <ProfileSetupModal />
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new-request" element={<NewRequest />} />
        <Route path="/my-requests" element={<RequestList forceMyRequests={true} />} />
        <Route path="/tasks" element={<RequestList forceMyRequests={true} />} />
        <Route path="/requests" element={<RequestList forceMyRequests={false} />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/analytics" element={<ManagementDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/notifications-page" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
