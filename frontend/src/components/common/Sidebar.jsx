import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, ClipboardList, Wrench,
  BarChart3, Bell, ShieldCheck, LifeBuoy
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'staff', 'technician', 'admin', 'management'] },
    { to: '/new-request', label: 'Report Issue', icon: PlusCircle, roles: ['student', 'staff', 'admin', 'management'] },
    { to: '/my-requests', label: 'My Requests', icon: ClipboardList, roles: ['student', 'staff', 'technician', 'admin', 'management'] },
    { to: '/tasks', label: 'Assigned Work Orders', icon: Wrench, roles: ['technician', 'admin'] },
    { to: '/requests', label: 'All Requests Registry', icon: ClipboardList, roles: ['admin', 'management'] },
    { to: '/analytics', label: 'Management Analytics', icon: BarChart3, roles: ['admin', 'management'] },
    { to: '/admin', label: 'Admin Control Center', icon: ShieldCheck, roles: ['admin'] },
    { to: '/notifications-page', label: 'System Alerts', icon: Bell, roles: ['student', 'staff', 'technician', 'admin', 'management'] }
  ];

  const filteredLinks = links.filter(l => l.roles.includes(role));

  return (
    <aside className="w-64 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] shadow-lg"
      style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 60%, #1e40af 100%)' }}
    >
      <div className="p-4 space-y-6">
        <div>
          <span className="px-3 text-[10px] font-extrabold tracking-widest text-blue-200 uppercase">
            Navigation Menu
          </span>
          <nav className="mt-3 space-y-1">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                      ? 'bg-white text-blue-900 shadow-md shadow-blue-950/30'
                      : 'text-blue-100 hover:bg-white/15 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 m-4 rounded-xl bg-white/10 border border-white/20 text-xs text-blue-100">
        <div className="flex items-center gap-2 font-bold text-white mb-1">
          <LifeBuoy className="w-4 h-4 text-amber-300" /> ICT & Estates Desk
        </div>
        <p className="text-[11px] text-blue-200 leading-relaxed">
          Cosmopolitan University Abuja<br />
          Contact: +234 805 208 0828
        </p>
        <span className="inline-block mt-2 text-[10px] text-blue-300 font-mono">
          info@cosmopolitan.edu.ng
        </span>
      </div>
    </aside>
  );
};
