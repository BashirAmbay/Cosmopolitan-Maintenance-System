import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { 
  Wrench, CheckCircle2, PauseCircle, ArrowRight, MapPin, User, 
  AlertCircle, Clock, ShieldAlert, Sparkles, Filter 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const TechnicianDashboard = ({ requests = [], user, onStatusUpdate }) => {
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, unassigned, my_queue, completed

  // Filter request lists
  const unassignedPending = requests.filter(r => r.status === 'pending' || (!r.assigned_to_id && !['resolved', 'closed'].includes(r.status)));
  const myAssignedTasks = requests.filter(r => r.assigned_to_id === user.id && ['assigned', 'in_progress', 'on_hold'].includes(r.status));
  const completedTasks = requests.filter(r => ['resolved', 'closed'].includes(r.status) && (r.assigned_to_id === user.id || !r.assigned_to_id));

  // Quick Self-Assign / Claim Request
  const handleClaimRequest = async (requestId) => {
    setUpdatingId(requestId);
    try {
      await api.post(`/requests/${requestId}/assign`, {
        technician_id: user.id,
        notes: `Self-assigned by technician ${user.name} from workstation dashboard.`
      });
      toast.success('Work order claimed and assigned to you!');
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to claim work order.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick Status Change directly from Dashboard
  const handleStatusChange = async (requestId, newStatus) => {
    setUpdatingId(requestId);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('remarks', `Status updated to ${newStatus.replace('_', ' ')} by technician ${user.name}`);

      await api.patch(`/requests/${requestId}/status`, formData);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}!`);
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-widest">
            <Wrench className="w-4 h-4 text-blue-900" /> Certified Technician Workstation
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide mt-1">
            Welcome back, {user.name}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Specialization: <span className="text-blue-900 font-extrabold">{user.specialization || 'General Facilities'}</span> • 
            Unassigned Campus Issues: <span className="text-amber-900 font-black">{unassignedPending.length} pending</span> • 
            My Queue: <span className="text-slate-900 font-black">{myAssignedTasks.length} active</span>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Unassigned Campus Issues</p>
            <h3 className="text-3xl font-black text-amber-950 mt-1">{unassignedPending.length}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-white text-amber-800 border border-amber-200 shadow-xs">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">My Active Work Orders</p>
            <h3 className="text-3xl font-black text-indigo-950 mt-1">{myAssignedTasks.length}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-white text-indigo-800 border border-indigo-200 shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Completed Tasks</p>
            <h3 className="text-3xl font-black text-emerald-950 mt-1">{completedTasks.length}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-white text-emerald-800 border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          All Reported Issues ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'unassigned' ? 'bg-amber-800 text-white shadow-sm' : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'}`}
        >
          🚨 Unassigned Issues ({unassignedPending.length})
        </button>
        <button
          onClick={() => setActiveTab('my_queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'my_queue' ? 'bg-indigo-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          ⚡ My Work Queue ({myAssignedTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'completed' ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          ✅ Completed ({completedTasks.length})
        </button>
      </div>

      {/* SECTION: UNASSIGNED PENDING REPORTED ISSUES */}
      {(activeTab === 'all' || activeTab === 'unassigned') && unassignedPending.length > 0 && (
        <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <div>
              <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" /> Newly Reported Campus Issues (Awaiting Technician)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Issues reported by students and faculty/staff. Click "Claim Work Order" to take ownership and update status.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {unassignedPending.length} Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unassignedPending.map((req) => (
              <div key={req.id} className="p-5 rounded-2xl bg-white border border-amber-200/90 flex flex-col justify-between space-y-3 shadow-xs hover:border-amber-500 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-blue-900">{req.reference_number}</span>
                    <PriorityBadge priority={req.priority} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{req.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{req.description}</p>
                  
                  <div className="pt-2 text-xs space-y-1 text-slate-500 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="text-slate-900 font-semibold">{req.location_name || 'Campus Location'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span>Reported by: <strong className="text-slate-900">{req.reporter_name}</strong> ({req.department_name || 'General'})</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <StatusBadge status={req.status} />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleClaimRequest(req.id)}
                      disabled={updatingId === req.id}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      {updatingId === req.id ? 'Claiming...' : 'Claim Work Order'}
                    </button>
                    <Link
                      to={`/requests/${req.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                    >
                      View &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: MY ASSIGNED WORK ORDERS & ALL REPORTED ISSUES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-200/50 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {activeTab === 'unassigned' ? 'Unassigned Issues' : activeTab === 'my_queue' ? 'My Assigned Work Queue' : activeTab === 'completed' ? 'Completed Work Orders' : 'Campus Maintenance Registry'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Change status directly using the dropdown to update students & faculty/staff on your progress.
            </p>
          </div>
          <Link to="/requests" className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1">
            Full Registry &rarr;
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm text-slate-900 font-bold">No reported issues found!</p>
            <p className="text-xs text-slate-500">All campus maintenance requests will appear here as soon as they are logged.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTab === 'unassigned' ? unassignedPending : activeTab === 'my_queue' ? myAssignedTasks : activeTab === 'completed' ? completedTasks : requests).map((req) => (
              <div key={req.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-blue-900 transition-all shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-blue-900">{req.reference_number}</span>
                    <PriorityBadge priority={req.priority} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{req.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{req.description}</p>
                  
                  <div className="pt-2 text-xs space-y-1 text-slate-500 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="text-slate-900 font-semibold">{req.location_name || 'Campus Location'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span>Reported by: <strong className="text-slate-900">{req.reporter_name}</strong></span>
                    </div>
                    {req.technician_name && (
                      <div className="flex items-center gap-2 text-emerald-700 font-medium">
                        <Wrench className="w-3.5 h-3.5 shrink-0" />
                        <span>Assigned to: <strong>{req.technician_name}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Actions Control Bar */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={req.status} />
                    
                    {/* Quick Status Select Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Status:</label>
                      <select
                        value={req.status}
                        disabled={updatingId === req.id}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {!req.assigned_to_id ? (
                      <button
                        onClick={() => handleClaimRequest(req.id)}
                        disabled={updatingId === req.id}
                        className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        {updatingId === req.id ? 'Assigning...' : '⚡ Claim Work Order'}
                      </button>
                    ) : (
                      <Link
                        to={`/requests/${req.id}`}
                        className="w-full text-center py-2 rounded-xl uni-banner text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Open Full Details & Workflow &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
