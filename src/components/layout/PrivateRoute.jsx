import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../ui/Loading';

const PrivateRoute = ({ roles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <Loading fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect về trang chủ của role hiện tại
    return <Navigate to={`/${user.role}`} replace />;
  }
  return <Outlet />;
};

export default PrivateRoute;