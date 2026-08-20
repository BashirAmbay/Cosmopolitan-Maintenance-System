import React from 'react';
import { Clock, CheckCircle2, AlertCircle, PauseCircle, Wrench, RotateCcw, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const configs = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: Clock
    },
    assigned: {
      label: 'Assigned',
      bg: 'bg-blue-50 text-blue-900 border-blue-200',
      icon: Wrench
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-purple-50 text-purple-900 border-purple-200',
      icon: AlertCircle
    },
    on_hold: {
      label: 'On Hold',
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: PauseCircle
    },
    resolved: {
      label: 'Resolved',
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      icon: CheckCircle2
    },
    closed: {
      label: 'Closed',
      bg: 'bg-slate-50 text-slate-600 border-slate-200',
      icon: XCircle
    },
    reopened: {
      label: 'Reopened',
      bg: 'bg-rose-50 text-rose-900 border-rose-200',
      icon: RotateCcw
    }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};
