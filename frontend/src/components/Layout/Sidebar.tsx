import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Zap,
  FileEdit,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/auth.store';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/ai', label: 'AI Assistant', icon: Sparkles },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/users', label: 'Users', icon: Users, adminOrReseller: true },
      { to: '/content', label: 'Content', icon: FileEdit },
    ],
  },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const initials = ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-icon">
          <Zap size={16} />
        </div>
        <span>Medians Agents</span>
      </div>

      {/* Nav */}
      <nav className="nav-menu">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(() => {
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <p className="sidebar-section">{section.label}</p>
              {visibleItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx('nav-item', isActive ? 'active' : '')
                  }
                >
                  <Icon size={15} className="nav-icon flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.first_name} {user?.last_name}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.status}</p>
        </div>
      </div>
    </aside>
  );
}
