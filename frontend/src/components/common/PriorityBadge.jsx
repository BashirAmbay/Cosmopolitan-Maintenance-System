import React from 'react';
import { ArrowDown, Minus, ArrowUp, AlertTriangle } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const configs = {
    low: {
      label: 'Low Priority',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: ArrowDown
    },
    medium: {
      label: 'Medium Priority',
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Minus
    },
    high: {
      label: 'High Priority',
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: ArrowUp
    },
    urgent: {
      label: 'Urgent SLA',
      bg: 'bg-rose-50 text-rose-900 border-rose-200 font-extrabold animate-pulse',
      icon: AlertTriangle
    }
  };

  const config = configs[priority] || configs.medium;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};
