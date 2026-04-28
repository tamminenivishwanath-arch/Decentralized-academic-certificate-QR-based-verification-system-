import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'issuer' | 'verifier';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to appropriate login based on required role
    const loginPath = requiredRole === 'verifier' ? '/login/verifier' : '/login/university';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to correct dashboard if wrong role
    const correctPath = user?.role === 'issuer' ? '/dashboard/issuer' : '/dashboard/verifier';
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}
