import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, User, Shield, Wrench, GraduationCap, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ProfileSetupModal = () => {
  const { user, showSetupModal, setShowSetupModal, completeProfile } = useAuth();

  const [role, setRole] = useState(user?.role || 'student');
  const [departmentId, setDepartmentId] = useState(user?.department_id || '');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');

  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showSetupModal || !user?.department_id) {
      api.get('/departments')
        .then(res => setDepartments(res.data.departments || []))
        .catch(() => {});
    }
  }, [showSetupModal, user]);

  if (user?.role === 'admin' || user?.role === 'management' || (!showSetupModal && user?.department_id)) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      toast.error('Please select your university role.');
      return;
    }

    setSubmitting(true);
    try {
      await completeProfile({
        role,
        department_id: departmentId ? Number(departmentId) : null,
        name,
        phone,
        specialization
      });
      toast.success(`Identity set! Welcome to your ${role.toUpperCase()} dashboard.`);
    } catch (err) {
      // toast handled
    } finally {
      setSubmitting(false);
    }
  };

  const rolesList = [
    { key: 'student', label: 'Student', icon: GraduationCap, desc: 'Report campus issues & track ticket progress' },
    { key: 'staff', label: 'Faculty / Staff', icon: UserCheck, desc: 'Classroom, lab & office facility requests' },
    { key: 'technician', label: 'Technician', icon: Wrench, desc: 'Work order queue & repair assignments' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl">
        {/* Modal Header */}
        <div className="text-center border-b border-slate-100 pb-5">
          <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <img 
              src="/cosmo-logo.png" 
              alt="Cosmopolitan University Abuja Logo" 
              className="w-full h-full object-contain drop-shadow-md" 
            />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide uppercase">
            COSMOPOLITAN UNIVERSITY ABUJA
          </h2>
          <p className="text-xs font-bold text-blue-900 tracking-wider uppercase mt-0.5">
            Select Your Role & Department
          </p>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            Logged in as <strong className="text-slate-800">{user?.email}</strong>. Please confirm your campus identity to customize your portal workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Role Selector Cards */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              1. Select University Role <span className="text-blue-900">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {rolesList.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.key;
                return (
                  <button
                    type="button"
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-900 bg-blue-50/80 text-blue-950 ring-2 ring-blue-900/30 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-900' : 'text-slate-500'}`} />
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-900" />}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-black block">{r.label}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{r.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Department Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              2. Select Faculty / Department <span className="text-blue-900">*</span>
            </label>
            <select
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            >
              <option value="">Choose Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Name & Phone inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                placeholder="e.g. Fatima Usman"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                placeholder="+234 800 000 0000"
              />
            </div>
          </div>

          {/* If Technician, show Specialization */}
          {role === 'technician' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Technician Specialization
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                placeholder="e.g. HVAC Air Conditioning, Electrical Systems, ICT Networking"
              />
            </div>
          )}

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white uni-banner hover:opacity-95 shadow-md shadow-blue-950/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving Profile...' : 'Confirm Role & Access Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
