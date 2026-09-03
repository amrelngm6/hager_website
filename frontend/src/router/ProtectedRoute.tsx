import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const authReady = useAuthStore((s) => s.authReady);

  if (!authReady) return null; // or a spinner
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}