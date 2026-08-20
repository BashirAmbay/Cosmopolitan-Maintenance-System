import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Users, Building2, MapPin, Wrench, Shield, 
  Plus, Check, X, Search, FileText, Lock 
} from 'lucide-react';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  // Forms state
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', head_name: '' });
  const [locForm, setLocForm] = useState({ name: '', building: '', floor: '', room_number: '', description: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: 'wrench', sla_hours: 24 });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: 'password123', role: 'technician', department_id: '', phone: '', specialization: '' });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, lRes, cRes, aRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
        api.get('/locations'),
        api.get('/categories'),
        api.get('/notifications/audit-logs')
      ]);

      setUsers(uRes.data.users || []);
      setDepartments(dRes.data.departments || []);
      setLocations(lRes.data.locations || []);
      setCategories(cRes.data.categories || []);
      setAuditLogs(aRes.data.logs || []);
    } catch (err) {
      toast.error('Failed to load administrative dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', deptForm);
      toast.success('Department created!');
      setDeptForm({ name: '', code: '', description: '', head_name: '' });
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to create department.');
    }
  };

  const handleAddLoc = async (e) => {
    e.preventDefault();
    try {
      await api.post('/locations', locForm);
      toast.success('Campus location created!');
      setLocForm({ name: '', building: '', floor: '', room_number: '', description: '' });
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to create location.');
    }
  };

  const handleAddCat = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', catForm);
      toast.success('Category created!');
      setCatForm({ name: '', description: '', icon: 'wrench', sla_hours: 24 });
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to create category.');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        ...userForm,
        department_id: userForm.department_id ? Number(userForm.department_id) : null
      });
      toast.success('User account created!');
      setUserForm({ name: '', email: '', password: 'password123', role: 'technician', department_id: '', phone: '', specialization: '' });
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user account.');
    }
  };

  const toggleUserStatus = async (userObj) => {
    try {
      await api.patch(`/users/${userObj.id}`, { is_active: !userObj.is_active });
      toast.success(`User ${userObj.is_active ? 'deactivated' : 'activated'}.`);
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const tabs = [
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'locations', label: 'Campus Locations', icon: MapPin },
    { id: 'categories', label: 'Issue Categories', icon: Wrench },
    { id: 'audit', label: 'System Audit Logs', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase">
          Administrative Control Center
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          System setup, user access control, campus locations, departments, and security audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: User Directory */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Add User Form Card */}
          <div className="uni-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-900" /> Create New User Account
            </h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="Full Name *"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
              <input
                type="email"
                required
                placeholder="Email Address *"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="technician">Technician</option>
                <option value="management">Management</option>
                <option value="admin">Administrator</option>
              </select>
              <select
                value={userForm.department_id}
                onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              >
                <option value="">Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Phone Number"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
              <input
                type="text"
                placeholder="Specialization / Field"
                value={userForm.specialization}
                onChange={(e) => setUserForm({ ...userForm, specialization: e.target.value })}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl uni-banner text-white font-bold uppercase tracking-wider shadow-sm"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>

          {/* User Table */}
          <div className="uni-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Name & Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-4 uppercase font-bold text-blue-900">{u.role}</td>
                      <td className="p-4 text-slate-700">{u.department_name || '-'}</td>
                      <td className="p-4 text-slate-500">{u.specialization || '-'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                          u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-800 border border-slate-200"
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Departments */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <form onSubmit={handleAddDept} className="uni-card p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Department Name *"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <input
              type="text"
              required
              placeholder="Dept Code (e.g. CSIT) *"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <input
              type="text"
              placeholder="Head of Dept Name"
              value={deptForm.head_name}
              onChange={(e) => setDeptForm({ ...deptForm, head_name: e.target.value })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <button type="submit" className="p-2.5 rounded-xl uni-banner text-white font-bold uppercase">
              Add Department
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div key={d.id} className="uni-card p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono font-bold text-blue-900">{d.code}</span>
                  <span className="text-[10px] text-slate-500 font-bold">{d.total_requests || 0} tickets</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{d.name}</h4>
                <p className="text-xs text-slate-500">Head: {d.head_name || 'Unspecified'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Locations */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          <form onSubmit={handleAddLoc} className="uni-card p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Location Name *"
              value={locForm.name}
              onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <input
              type="text"
              required
              placeholder="Building *"
              value={locForm.building}
              onChange={(e) => setLocForm({ ...locForm, building: e.target.value })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <input
              type="text"
              placeholder="Room Number"
              value={locForm.room_number}
              onChange={(e) => setLocForm({ ...locForm, room_number: e.target.value })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <button type="submit" className="p-2.5 rounded-xl uni-banner text-white font-bold uppercase">
              Add Location
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((l) => (
              <div key={l.id} className="uni-card p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-700">{l.building}</span>
                <h4 className="text-sm font-bold text-slate-900">{l.name}</h4>
                <p className="text-xs text-slate-500">{l.room_number ? `Room: ${l.room_number}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <form onSubmit={handleAddCat} className="uni-card p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Category Name *"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <input
              type="text"
              placeholder="Description"
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <input
              type="number"
              placeholder="Target SLA Hours (e.g. 24)"
              value={catForm.sla_hours}
              onChange={(e) => setCatForm({ ...catForm, sla_hours: Number(e.target.value) })}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
            <button type="submit" className="p-2.5 rounded-xl uni-banner text-white font-bold uppercase">
              Add Category
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="uni-card p-4 space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                    SLA: {c.sla_hours}h
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="uni-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-4 font-bold text-slate-900">{log.user_name || 'System'}</td>
                    <td className="p-4 font-mono font-bold text-blue-900">{log.action}</td>
                    <td className="p-4 text-slate-700">{log.details}</td>
                    <td className="p-4 text-right text-slate-400 font-mono">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
