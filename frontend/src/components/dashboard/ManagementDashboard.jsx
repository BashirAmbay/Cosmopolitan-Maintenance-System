import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  BarChart3, AlertTriangle, Clock, CheckCircle2, 
  Users, Building2, ShieldAlert, Wrench, RefreshCw,
  Search, Filter, ArrowRight, User
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ManagementDashboard = ({ requests = [], user, onRefresh }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAnalyticsAndTechs = async () => {
    setLoading(true);
    try {
      const [analyticsRes, techRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/users/technicians')
      ]);
      setAnalytics(analyticsRes.data);
      setTechnicians(techRes.data.technicians || []);
    } catch (err) {
      console.error('Failed to load management dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAnalyticsAndTechs(); 
  }, []);

  const handleRefreshAll = () => {
    fetchAnalyticsAndTechs();
    if (onRefresh) onRefresh();
  };

  // Quick Status Change by Management / Admin
  const handleStatusChange = async (requestId, newStatus) => {
    setActionLoadingId(requestId);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('remarks', `Status updated to ${newStatus.replace('_', ' ')} by VC Management / Admin`);

      await api.patch(`/requests/${requestId}/status`, formData);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}!`);
      handleRefreshAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Technician Assignment by Management / Admin
  const handleAssignTechnician = async (requestId, technicianId) => {
    if (!technicianId) return;
    setActionLoadingId(requestId);
    try {
      await api.post(`/requests/${requestId}/assign`, {
        technician_id: Number(technicianId),
        notes: 'Assigned directly from VC Management Executive Dashboard.'
      });
      toast.success('Technician assigned successfully!');
      handleRefreshAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign technician.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter reported requests
  const filteredRequests = requests.filter(r => {
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesSearch = !searchQuery || (
      r.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporter_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-900" />
        <p className="text-sm font-bold">Loading Cosmopolitan Management Analytics...</p>
      </div>
    );
  }

  const { metrics, byDepartment, byCategory, technicianWorkload } = analytics;
  const COLORS = ['#1e3a8a', '#1d4ed8', '#D97706', '#059669', '#7C3AED', '#0284C7', '#0f172a', '#64748B'];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const renderPieChartLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
    if (!percent || percent <= 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const cleanName = name ? String(name).split('&')[0].trim() : '';

    return (
      <text
        x={x}
        y={y}
        fill="#1e293b"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={10}
        fontWeight={800}
      >
        {`${cleanName} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Executive KPI Stats Cards */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-widest">
            <BarChart3 className="w-4 h-4 text-blue-900" /> Executive Operations Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide mt-1">
            Cosmopolitan VC Management Dashboard
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Real-time campus maintenance KPIs, SLA fulfillment speed, departmental workload, and technician performance.
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shrink-0 border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics & Registry
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200/80 shadow-sm space-y-2">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Total Requests</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-blue-950">{metrics.totalRequests}</h3>
            <span className="text-[10px] font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">All time</span>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-sm space-y-2">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Pending Assignment</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-amber-950">{metrics.pendingRequests}</h3>
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200/80 shadow-sm space-y-2">
          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Active In Progress</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-indigo-950">{metrics.activeTasks}</h3>
            <Wrench className="w-5 h-5 text-indigo-700" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-sm space-y-2">
          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Resolved & Closed</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-emerald-950">{metrics.resolvedIssues}</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-rose-900 uppercase">SLA Overdue</p>
            <h4 className="text-2xl font-black text-rose-950 mt-1">{metrics.overdueRequests} tickets</h4>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-700" />
        </div>
        <div className="p-5 rounded-2xl bg-amber-100/60 border border-amber-200 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-amber-900 uppercase">High/Urgent Priority</p>
            <h4 className="text-2xl font-black text-amber-950 mt-1">{metrics.highPriority} tickets</h4>
          </div>
          <ShieldAlert className="w-8 h-8 text-amber-700" />
        </div>
        <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-purple-900 uppercase">Avg Resolution Speed</p>
            <h4 className="text-2xl font-black text-purple-950 mt-1">{metrics.avgResolutionHours} hours</h4>
          </div>
          <Clock className="w-8 h-8 text-purple-700" />
        </div>
      </div>

      {/* REPORTED ISSUES & LIVE STATUS CONTROL REGISTRY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-200/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-900" /> Reported Issues Registry & Live Status Management
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              All maintenance issues reported by faculty/staff & students. Assign technicians and update statuses in real-time.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, title, reporter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 w-52 sm:w-64"
              />
            </div>
            
            <Link to="/requests" className="px-3 py-1.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shrink-0">
              Full Registry &rarr;
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${!statusFilter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            All Issues ({requests.length})
          </button>
          {statusOptions.map(opt => {
            const count = requests.filter(r => r.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${statusFilter === opt.value ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Reference / Title</th>
                <th className="p-3">Reported By</th>
                <th className="p-3">Location / Dept</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3 text-center">Current Status</th>
                <th className="p-3 text-center">Assigned Technician</th>
                <th className="p-3 text-right">Actions / Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No matching reported issues found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-black text-blue-900 text-xs">{r.reference_number}</div>
                      <div className="font-bold text-slate-900 text-xs line-clamp-1">{r.title}</div>
                      <div className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleString()}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900">{r.reporter_name}</div>
                      <div className="text-[10px] text-slate-500">{r.reporter_email}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{r.location_name || 'Campus'}</div>
                      <div className="text-[10px] text-slate-500">{r.department_name || 'General'}</div>
                    </td>

                    <td className="p-3 text-center">
                      <PriorityBadge priority={r.priority} />
                    </td>

                    <td className="p-3 text-center">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="p-3 text-center">
                      <select
                        value={r.assigned_to_id || ''}
                        disabled={actionLoadingId === r.id}
                        onChange={(e) => handleAssignTechnician(r.id, e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 max-w-[140px]"
                      >
                        <option value="">-- Assign Tech --</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.active_tasks} active)
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Status Dropdown */}
                        <select
                          value={r.status}
                          disabled={actionLoadingId === r.id}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        <Link
                          to={`/requests/${r.id}`}
                          className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg font-bold transition-colors"
                          title="View Details"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-200/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-900" /> Requests by Department
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment}>
                <XAxis dataKey="department" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-200/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-700" /> Category Distribution
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 35, left: 35, bottom: 20 }}>
                <Pie 
                  data={byCategory} 
                  dataKey="count" 
                  nameKey="category" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={65}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                  label={renderPieChartLabel}
                >
                  {byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} requests`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Clean Readable Legend List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
            {byCategory.map((item, idx) => {
              const total = byCategory.reduce((acc, curr) => acc + (curr.count || 0), 0);
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
              return (
                <div key={item.category || idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 truncate pr-1">
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-bold text-slate-800 truncate">{item.category}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 font-mono text-[11px] shrink-0 bg-white px-2 py-0.5 rounded border border-slate-200">{item.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Technician Workload Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-200/50 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-900" /> Technician Roster Workload
          </h3>
          <Link to="/admin" className="text-xs font-bold text-blue-900 hover:underline">Manage Technicians &rarr;</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Technician Name</th>
                <th className="p-3">Specialization</th>
                <th className="p-3 text-center">Active Tasks</th>
                <th className="p-3 text-center">Completed</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {technicianWorkload.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{t.name}</td>
                  <td className="p-3 text-slate-600">{t.specialization || 'General Facilities'}</td>
                  <td className="p-3 text-center">
                    <span className="px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-900 border border-amber-200">{t.active_tasks} active</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">{t.completed_tasks} done</span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase">Available</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
