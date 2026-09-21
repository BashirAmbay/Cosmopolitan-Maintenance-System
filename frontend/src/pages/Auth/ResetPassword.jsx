import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyResetToken, confirmPasswordReset } = useAuth();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify the token on component mount
  useEffect(() => {
    if (!token || !emailParam) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('The password reset link is missing a security token or email address.');
      return;
    }

    verifyResetToken(token, emailParam)
      .then(() => {
        setTokenValid(true);
      })
      .catch((err) => {
        setTokenValid(false);
        setTokenError(err.message || 'This password reset link is invalid or has expired.');
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token, emailParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match. Please verify and try again.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, emailParam, newPassword);
      setIsSuccess(true);
      toast.success('Your password has been successfully updated!');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message || 'Failed to update password.';
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

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
          Password Recovery Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/90 sm:rounded-2xl sm:px-10 space-y-6">

          {/* Loading Verification State */}
          {verifying && (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Verifying Security Reset Link...
              </p>
            </div>
          )}

          {/* Invalid / Expired Token State */}
          {!verifying && !tokenValid && (
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Reset Link Expired or Invalid
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  {tokenError || 'This password reset link has already been used or has expired (links are valid for 60 minutes).'}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-md shadow-blue-950/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Request New Password Reset
                </Link>
              </div>
            </div>
          )}

          {/* Success State */}
          {!verifying && isSuccess && (
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Password Updated Successfully!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Your new password is now active. You are being redirected to the portal sign in page...
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-900 hover:bg-blue-800 transition-colors"
                >
                  Go to Sign In Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Valid Token - Set New Password Form */}
          {!verifying && tokenValid && !isSuccess && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black uppercase text-[11px] text-blue-900">
                  <KeyRound className="w-4 h-4 text-blue-900" /> Create Your New Password
                </div>
                <p className="text-[11px] text-slate-600">
                  Account: <strong className="text-blue-950 font-bold">{emailParam}</strong>
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
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
                    autoFocus
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
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

              {/* Confirm Password */}
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
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
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

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className={`text-[11px] font-bold flex items-center gap-1 ${newPassword === confirmPassword ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passwords match perfectly
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Passwords do not match yet
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-900 hover:bg-blue-800 focus:outline-none shadow-md shadow-blue-950/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save & Set New Password'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-blue-900 hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
