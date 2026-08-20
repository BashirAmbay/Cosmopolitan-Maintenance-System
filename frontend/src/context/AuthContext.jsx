import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cua_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cua_token') || null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('cua_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData, requiresSetup } = res.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('cua_token', newToken);
      localStorage.setItem('cua_user', JSON.stringify(userData));

      if ((requiresSetup || !userData.department_id) && userData.role !== 'admin' && userData.role !== 'management') {
        setShowSetupModal(true);
      } else {
        setShowSetupModal(false);
      }
      
      toast.success(`Welcome to Cosmopolitan Portal, ${userData.name}!`);
      return { user: userData, requiresSetup };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check credentials.';
      toast.error(msg);
      throw err;
    }
  };

  const completeProfile = async (profileData) => {
    try {
      const res = await api.post('/auth/complete-profile', profileData);
      const { token: newToken, user: userData } = res.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('cua_token', newToken);
      localStorage.setItem('cua_user', JSON.stringify(userData));
      setShowSetupModal(false);

      toast.success(`Campus identity updated! Welcome, ${userData.name}.`);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update campus profile.';
      toast.error(msg);
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      const { token: newToken, user: userData } = res.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('cua_token', newToken);
      localStorage.setItem('cua_user', JSON.stringify(userData));
      
      toast.success('Registration successful!');
      return userData;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed.';
      toast.error(msg);
      throw err;
    }
  };

  const resetPassword = async (email, newPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { email, newPassword });
      toast.success(res.data.message || 'Password updated successfully!');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reset password.';
      toast.error(msg);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setShowSetupModal(false);
    localStorage.removeItem('cua_user');
    localStorage.removeItem('cua_token');
    toast.success('Logged out successfully.');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      showSetupModal, 
      setShowSetupModal, 
      login, 
      completeProfile, 
      register, 
      resetPassword,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
