import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedLogin from './RoleBasedLogin';

const Login: React.FC = () => {
  const { user, session } = useAuth();

  const isAuthenticated = Boolean(user && session);

  // Debug (remove in production if needed)
  console.log('[Login] Auth status:', {
    user: !!user,
    session: !!session,
    isAuthenticated,
  });

  // Redirect authenticated users
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render login UI
  return <RoleBasedLogin />;
};

export default Login;
