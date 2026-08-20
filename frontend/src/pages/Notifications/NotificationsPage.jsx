import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/all/read');
      fetchNotifications();
    } catch (err) {}
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-900" /> System Alerts & Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates on your maintenance tickets, assignments, and status changes.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600" /> Mark All Read
        </button>
      </div>

      <div className="uni-card divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No system notifications found.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 space-y-2 transition-colors ${
                n.is_read ? 'bg-white text-slate-500' : 'bg-blue-50/60 text-slate-900 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">{n.title}</span>
                <span className="text-[10px] text-slate-400 font-medium">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
              {n.link && (
                <Link
                  to={n.link}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:underline pt-1"
                >
                  View Request Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
