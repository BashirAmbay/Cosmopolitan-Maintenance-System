import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboard } from '../../components/dashboard/StudentDashboard';
import { TechnicianDashboard } from '../../components/dashboard/TechnicianDashboard';
import { ManagementDashboard } from '../../components/dashboard/ManagementDashboard';
import api from '../../services/api';
import { RefreshCw } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRequests = async () => {
    setLoading(true);
    try {
      // For student & staff, fetch their own reported requests.
      // For admin, management, and technician, fetch ALL reported campus issues.
      const isPersonalOnly = user.role === 'student' || user.role === 'staff';
      const endpoint = isPersonalOnly ? '/requests?my_requests=true' : '/requests';
      
      const res = await api.get(endpoint);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load user requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserRequests();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-900" />
        <p className="text-sm font-semibold">Loading Cosmopolitan Portal Workspace...</p>
      </div>
    );
  }

  if (user.role === 'admin' || user.role === 'management') {
    return <ManagementDashboard requests={requests} user={user} onRefresh={fetchUserRequests} />;
  }

  if (user.role === 'technician') {
    return <TechnicianDashboard requests={requests} user={user} onStatusUpdate={fetchUserRequests} />;
  }

  return <StudentDashboard requests={requests} user={user} onRefresh={fetchUserRequests} />;
};
