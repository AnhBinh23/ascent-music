import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLE_HOME } from '../config/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ascent_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const userInfo = {
      id:       userData.id,
      name:     userData.name,
      email:    userData.email,
      role:     userData.role,
      avatar:   userData.avatar || null,
      phone:    userData.phone || '',
    };
    setUser(userInfo);
    localStorage.setItem('ascent_user', JSON.stringify(userInfo));
    return ROLE_HOME[userData.role] || '/login';
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ascent_user');
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