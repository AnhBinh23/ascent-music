import React, { createContext, useContext, useState, useEffect } from 'react';
import pushService from '../services/pushService';
import api from '../services/api';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser  = localStorage.getItem('ascent_user');
    const savedToken = localStorage.getItem('ascent_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  // Auto subscribe push khi user đăng nhập
  useEffect(() => {
    if (user) {
      pushService.subscribe(api.post).catch(console.error);
    }
  }, [user]);

  const login = async (email, password) => {
    if (typeof email !== 'string') throw new Error('Email không hợp lệ');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');

      localStorage.setItem('ascent_token', data.token);
      localStorage.setItem('ascent_user',  JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ascent_user');
    localStorage.removeItem('ascent_token');
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('ascent_user', JSON.stringify(newUser));
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const { PERMISSIONS } = require('../config/roles');
    return PERMISSIONS[user.role]?.includes(permission) || false;
  };

  const isRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      hasPermission,
      isRole,
      isAuthenticated: !!user,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải dùng trong AuthProvider');
  return context;
};

export default AuthContext;