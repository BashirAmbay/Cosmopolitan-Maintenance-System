import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Lock, Mail, ArrowRight, Shield, Wrench,
  GraduationCap, UserCheck, CheckCircle2, Sparkles, AlertCircle, Edit3,
  Eye, EyeOff, KeyRound, UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isCosmopolitanEmail } from '../../utils/validation';

export const Login = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Email Verification, 2 = Password Entry, 3 = Reset Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Verify Cosmopolitan Email Domain
  const handleVerifyEmail = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResetSuccess('');

    if (!email.trim()) {
      const msg = 'Please enter your Cosmopolitan University email address.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!isCosmopolitanEmail(email)) {
      const msg = 'This email is not a Cosmopolitan email, please login with your Cosmopolitan email.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setErrorMsg('');
    setStep(2);
    toast.success('Cosmopolitan email confirmed! Please enter your password.');
  };

  // Step 2: Submit Authentication with Password
  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResetSuccess('');
    setLoading(true);

    try {
      await login(email, password || 'password123');
      navigate('/');
    } catch (err) {
      const serverMsg = err.response?.data?.error || 'Authentication failed. Please check your credentials.';
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle Reset Password Submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResetSuccess('');

    const targetEmail = resetEmail.trim() || email.trim();

    if (!targetEmail) {
      const msg = 'Please enter your Cosmopolitan University email.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!isCosmopolitanEmail(targetEmail)) {
      const msg = 'This email is not a Cosmopolitan email, please login with your Cosmopolitan email.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!newPassword) {
      const msg = 'Please enter a new password.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newPassword.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match. Please check and try again.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(targetEmail, newPassword);
      setEmail(targetEmail);
      setPassword(newPassword);
      setResetSuccess('Your password has been reset successfully! You can now sign in.');
      setErrorMsg('');
      setStep(2);
    } catch (err) {
      const serverMsg = err.response?.data?.error || 'Failed to reset password.';
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickRole = (presetEmail) => {
    if (!isCosmopolitanEmail(presetEmail)) {
      const msg = 'This email is not a Cosmopolitan email, please login with your Cosmopolitan email.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setEmail(presetEmail);
    setPassword('password123');
    setStep(2);
    setErrorMsg('');
    setResetSuccess('');
  };

  const handleSelectPortalCategory = (portalLabel) => {
    setEmail('');
    setPassword('');
    setStep(1);
    setErrorMsg('');
    setResetSuccess('');
    toast.success(`Enter your registered ${portalLabel} email to log in.`);
  };

  const quickRoles = [
    { label: 'Student', icon: GraduationCap, color: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
    { label: 'Staff / Faculty', icon: UserCheck, color: 'text-purple-800 bg-purple-50 border-purple-200 hover:bg-purple-100' },
    { label: 'Technician', icon: Wrench, color: 'text-amber-900 bg-amber-50 border-amber-200 hover:bg-amber-100' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-20 h-20 mb-3 flex items-center justify-center">
          <img
            src="/cosmo-logo.png"
            alt="Cosmopolitan University Abuja Logo"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase">
          COSMOPOLITAN UNIVERSITY ABUJA
        </h2>
        <p className="mt-1 text-xs font-bold text-blue-900 tracking-widest uppercase">
          Operations & Maintenance Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/90 sm:rounded-2xl sm:px-10 space-y-6">

          {/* Step Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 3 ? 'bg-amber-600 text-white' : step === 1 ? 'bg-blue-900 text-white' : 'bg-emerald-600 text-white'}`}>
                {step === 3 ? '🔑' : step === 1 ? '1' : '✓'}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {step === 1 ? 'Step 1: Cosmopolitan Email' : step === 2 ? 'Step 2: Password' : 'Reset Password'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {step === 1 ? '1 of 2' : step === 2 ? '2 of 2' : 'Password Recovery'}
            </span>
          </div>

          {/* Validation Error Alert Box */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 font-medium animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">Authentication Error</p>
                <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {resetSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 font-medium animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Success!</p>
                <p className="mt-0.5 text-xs text-emerald-800 leading-relaxed">{resetSuccess}</p>
              </div>
            </div>
          )}

          {/* STEP 1: EMAIL VERIFICATION */}
          {step === 1 && (
            <form className="space-y-4" onSubmit={handleVerifyEmail}>
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black uppercase text-[11px] text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-900" /> Cosmopolitan Email Verification
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Enter your official Cosmopolitan University Abuja email address (`@cosmopolitan.edu.ng`) to proceed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  University Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                    placeholder="name@cosmopolitan.edu.ng"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white uni-banner hover:opacity-90 focus:outline-none shadow-md shadow-blue-950/20 transition-all"
              >
                Continue to Password
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: PASSWORD ENTRY */}
          {step === 2 && (
            <form className="space-y-4" onSubmit={handleSubmitPassword}>
              {/* Confirmed Email Card */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="block text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">
                      Cosmopolitan Email Confirmed
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {email}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg('');
                    setResetSuccess('');
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                >
                  <Edit3 className="w-3 h-3" /> Change
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setStep(3);
                      setErrorMsg('');
                      setResetSuccess('');
                    }}
                    className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" /> Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                    placeholder="Enter your password"
                  />
                  {/* Eye Toggle to Show / Hide Password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-blue-900" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white uni-banner hover:opacity-90 focus:outline-none shadow-md shadow-blue-950/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: FORGOT / RESET PASSWORD */}
          {step === 3 && (
            <form className="space-y-4" onSubmit={handleResetPasswordSubmit}>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black uppercase text-[11px] text-amber-900">
                  <KeyRound className="w-4 h-4 text-amber-900" /> Password Recovery Portal
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Enter your Cosmopolitan University email address and create a new password below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  University Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={resetEmail || email}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                    placeholder="name@cosmopolitan.edu.ng"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                    placeholder="Enter new password (min. 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 text-blue-900" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-blue-900" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(email ? 2 : 1);
                    setErrorMsg('');
                  }}
                  className="w-1/3 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white uni-banner hover:opacity-90 focus:outline-none shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Single-Click User Portals: Student, Staff/Faculty, Technician */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div>
              <span className="block text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> SELECT USER PORTAL
              </span>
              <div className="grid grid-cols-3 gap-2">
                {quickRoles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => handleSelectPortalCategory(r.label)}
                      disabled={loading}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${r.color}`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs font-extrabold truncate w-full">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Official Admin & VC Management Credentials Access Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                  <Shield className="w-4 h-4 text-amber-400" /> Admin & VC Management Login
                </div>
                <span className="text-[10px] font-extrabold bg-blue-950 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-800 uppercase">
                  SYSTEM PORTALS
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectPortalCategory('Admin Operations')}
                  disabled={loading}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-center transition-all group"
                >
                  <span className="font-extrabold text-blue-400 block group-hover:text-amber-300 text-xs">🛡️ Admin Operations</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPortalCategory('VC Management')}
                  disabled={loading}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-center transition-all group"
                >
                  <span className="font-extrabold text-purple-400 block group-hover:text-amber-300 text-xs">🏛️ VC Management</span>
                </button>
              </div>
            </div>

            {/* Register New Account Link */}
            <div className="text-center pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Need a portal account? </span>
              <Link to="/register" className="text-xs font-extrabold text-blue-900 hover:underline inline-flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" /> Register New Account
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
