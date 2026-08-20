import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { PlusCircle, Clock, CheckCircle2, ArrowRight, LifeBuoy, Wrench } from 'lucide-react';

export const StudentDashboard = ({ requests, user }) => {
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => ['assigned', 'in_progress', 'on_hold'].includes(r.status)).length;
  const resolvedCount = requests.filter(r => ['resolved', 'closed'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      {/* Banner Card - Pure White Background with High Contrast Text */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-extrabold uppercase tracking-widest inline-block">
            Student & Faculty Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide mt-2">
            Welcome, {user.name} 👋
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
            Report maintenance, ICT, electrical, plumbing, or classroom equipment issues across Cosmopolitan University Abuja. Track status live from submission to technician resolution.
          </p>
        </div>
        <Link
          to="/new-request"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl uni-banner text-white font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Report Issue Now
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Pending Assignment</p>
            <h3 className="text-3xl font-black text-amber-900 mt-1">{pendingCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-white text-amber-800 border border-amber-200 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Active In Progress</p>
            <h3 className="text-3xl font-black text-blue-950 mt-1">{inProgressCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-white text-blue-800 border border-blue-200 shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Resolved & Closed</p>
            <h3 className="text-3xl font-black text-emerald-950 mt-1">{resolvedCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-white text-emerald-800 border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Requests Registry Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-200/50 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Your Maintenance Requests ({requests.length})
          </h3>
          <Link to="/my-requests" className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1">
            View All Requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
            <LifeBuoy className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-700 font-bold">No maintenance requests submitted yet.</p>
            <Link to="/new-request" className="inline-flex items-center gap-2 text-xs font-bold text-blue-900 hover:underline">
              Click here to submit your first issue report
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.slice(0, 5).map((req) => (
              <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-3 rounded-xl transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-blue-900">{req.reference_number}</span>
                    <StatusBadge status={req.status} />
                    <PriorityBadge priority={req.priority} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{req.title}</h4>
                  <p className="text-xs text-slate-500">
                    Location: <span className="text-slate-800 font-semibold">{req.location_name}</span> • Category: <span className="text-slate-800 font-semibold">{req.category_name}</span>
                  </p>
                  
                  {/* Assigned Technician Badge & Contact Details */}
                  {req.technician_name ? (
                    <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                      <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Assigned Technician: <strong className="text-emerald-950 font-black">{req.technician_name}</strong>
                        {req.technician_phone && <span className="text-slate-500 font-semibold ml-1">({req.technician_phone})</span>}
                      </span>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> Awaiting technician assignment...
                    </div>
                  )}
                </div>
                <Link
                  to={`/requests/${req.id}`}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-800 text-xs font-bold transition-colors text-center shrink-0 border border-slate-200"
                >
                  Track Request &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
