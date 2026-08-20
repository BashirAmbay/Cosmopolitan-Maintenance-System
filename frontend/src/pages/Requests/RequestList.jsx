import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { 
  Search, Filter, PlusCircle, ArrowUpDown, RefreshCw, 
  MapPin, Clock, Wrench, FileText 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RequestList = ({ forceMyRequests = false }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const categoryId = searchParams.get('category_id') || '';

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (categoryId) params.append('category_id', categoryId);
      if (forceMyRequests) params.append('my_requests', 'true');

      const res = await api.get(`/requests?${params.toString()}`);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/locations')
    ]).then(([cRes, lRes]) => {
      setCategories(cRes.data.categories || []);
      setLocations(lRes.data.locations || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [search, status, priority, categoryId, forceMyRequests]);

  const updateFilter = (key, val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const statuses = [
    { key: '', label: 'All Requests' },
    { key: 'pending', label: 'Pending' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'on_hold', label: 'On Hold' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase">
            {forceMyRequests ? 'My Maintenance Requests' : 'Campus Maintenance Registry'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cosmopolitan University Abuja Operations & Maintenance Records
          </p>
        </div>

        <Link
          to="/new-request"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl uni-banner text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Log New Issue
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => updateFilter('status', s.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              status === s.key
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="uni-card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search by reference code, title, or keywords..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <select
            value={priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
          >
            <option value="">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent SLA</option>
          </select>
        </div>

        <div>
          <select
            value={categoryId}
            onChange={(e) => updateFilter('category_id', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Datatable */}
      <div className="uni-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-900" />
            <p className="text-xs font-semibold">Loading requests registry...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-600">No maintenance requests match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Reference Code</th>
                  <th className="p-4">Title & Issue</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Technician</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-900">
                      {r.reference_number}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-900 leading-snug">{r.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{r.category_name}</div>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="font-bold">{r.location_name}</div>
                      <div className="text-[10px] text-slate-400">{r.location_building}</div>
                    </td>
                    <td className="p-4">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-4 text-slate-700">
                      {r.technician_name ? (
                        <div>
                          <div className="font-bold text-slate-900">{r.technician_name}</div>
                          <div className="text-[10px] text-slate-500">{r.technician_phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/requests/${r.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-800 font-bold border border-slate-200 transition-colors inline-block"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
