import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, Shield, Wrench, GraduationCap, Check, Building2, User } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {}
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/all/read');
      fetchNotifications();
    } catch (err) {}
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
      case 'management':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-400/20 text-blue-200 border border-blue-300/30">Management</span>;
      case 'technician':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-400/20 text-sky-200 border border-sky-300/30">Technician</span>;
      case 'staff':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-400/20 text-indigo-200 border border-indigo-300/30">Faculty / Staff</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-400/20 text-teal-200 border border-teal-300/30">Student</span>;
    }
  };

  return (
    <header className="h-16 uni-banner text-white sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-md">
      {/* Brand Title */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden">
          <img src="/cosmo-logo.png" alt="Cosmopolitan University Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-wide leading-tight text-white group-hover:text-amber-300 transition-colors">
            COSMOPOLITAN UNIVERSITY ABUJA
          </h1>
          <p className="text-[11px] font-semibold text-blue-200 tracking-wider uppercase">
            Operations & Maintenance System
          </p>
        </div>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  System Alerts ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No recent notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`p-3.5 text-xs transition-colors cursor-pointer ${
                        n.is_read ? 'bg-white text-slate-500' : 'bg-blue-50/60 text-slate-800 font-semibold'
                      } hover:bg-slate-50`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-blue-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{n.message}</p>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setShowNotifications(false)}
                          className="inline-block mt-1 text-[11px] font-bold text-blue-900 hover:underline"
                        >
                          View Request Details &rarr;
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/20">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{user.name}</span>
              <div className="mt-0.5">{getRoleBadge(user.role)}</div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-white/10 hover:bg-blue-600 text-white transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
