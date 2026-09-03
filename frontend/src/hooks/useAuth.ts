import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const { user, setUser } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    setUser(data.user);
    navigate('/dashboard');
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    navigate('/login');
  };

  return { user, isAuthenticated, login, logout };
}
