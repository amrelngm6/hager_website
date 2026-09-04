import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <a href="https://hager.medians.tech" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">Website</span>
        </a>
        <div className="flex items-center gap-2  text-gray-600">
          <User size={16} />
          <span className="font-medium">{user?.first_name}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5  text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
