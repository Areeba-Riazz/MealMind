import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', emoji: '🏠' },
  { to: '/demo', label: 'AI Chef', emoji: '👨‍🍳' },
  { to: '/cravings', label: 'Cravings', emoji: '🛵' },
  { to: '/meal-planner', label: 'Meal Planner', emoji: '📅' },
  { to: '/saved', label: 'Saved Recipes', emoji: '📖' },
  { to: '/food-links', label: 'Food Links', emoji: '🔗' },
  { to: '/profile', label: 'Profile', emoji: '⚙️' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('mealmind-sb-collapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('mealmind-sb-collapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    try {
      if (app) await signOut(getAuth(app));
      navigate('/');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const initials = (
    user?.displayName?.split(' ').map(w => w[0]).join('') ??
    user?.email?.[0] ??
    '?'
  ).toUpperCase().slice(0, 2);

  const label = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Account';

  return (
    <>
      <style>{`
        /* ── Sidebar shell ── */
        .sb {
          display: flex;
          flex-direction: column;
          width: 220px;
          flex-shrink: 0;
          height: 100vh;
          position: sticky;
          top: 0;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--border);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          padding: 0;
          overflow: hidden;
          z-index: 100;
          transition: width 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .sb.sb-c { width: 64px; }

        /* ── Brand row (brand link + toggle button) ── */
        .sb-head {
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .sb-brand {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 1.3rem 0.5rem 1.2rem 1.25rem;
          text-decoration: none;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .sb.sb-c .sb-brand {
          flex: 0 0 auto;
          padding: 1.3rem 0 1.2rem 0.9rem;
          gap: 0;
        }
        .sb-brand-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #e8522a, #f5c842);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .sb-brand-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.18rem;
          color: var(--text);
          letter-spacing: -0.4px;
          white-space: nowrap;
          opacity: 1;
          transition: opacity 0.15s ease;
        }
        .sb.sb-c .sb-brand-name { display: none; }
        .sb-brand-name span { color: #e8522a; }

        /* ── Toggle button ── */
        .sb-toggle {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: transparent;
          border: 1px solid var(--border2);
          color: var(--muted2);
          font-size: 1rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin: 0 0.75rem 0 0.4rem;
          transition: color 0.18s, border-color 0.18s, background 0.18s;
        }
        .sb.sb-c .sb-toggle { margin: 0 0.55rem 0 0.35rem; }
        .sb-toggle:hover {
          color: var(--text);
          border-color: var(--border2);
          background: var(--glass-hover);
        }

        /* ── Nav ── */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0.85rem 0.75rem;
          scrollbar-width: none;
        }
        .sb-nav::-webkit-scrollbar { display: none; }

        .sb-section-label {
          font-size: 0.63rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--muted2);
          padding: 0.6rem 0.6rem 0.4rem;
          margin-top: 0.2rem;
          white-space: nowrap;
        }
        .sb.sb-c .sb-section-label { display: none; }

        .sb-link {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.6rem 0.75rem;
          border-radius: 10px;
          text-decoration: none;
          color: var(--muted);
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.18s, background 0.18s;
          margin-bottom: 0.1rem;
          border: 1px solid transparent;
          white-space: nowrap;
          overflow: hidden;
        }
        .sb.sb-c .sb-link {
          justify-content: center;
          padding: 0.65rem 0;
          gap: 0;
        }
        .sb-link:hover {
          color: var(--text);
          background: var(--glass-hover);
        }
        .sb-link.active {
          color: var(--accent);
          background: rgba(232,82,42,0.12);
          border-color: rgba(232,82,42,0.25);
          font-weight: 600;
        }
        .sb-link-emoji {
          font-size: 1rem;
          width: 22px;
          text-align: center;
          flex-shrink: 0;
        }
        .sb-link-label { transition: opacity 0.15s ease; }
        .sb.sb-c .sb-link-label { display: none; }

        /* ── User card ── */
        .sb-footer {
          padding: 0.85rem 0.75rem;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .sb-user-card {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 0.75rem;
          border-radius: 11px;
          background: var(--input-bg);
          border: 1px solid var(--border2);
          margin-bottom: 0.55rem;
          min-width: 0;
          overflow: hidden;
        }
        .sb.sb-c .sb-user-card {
          justify-content: center;
          padding: 0.55rem;
          gap: 0;
        }
        .sb-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(232,82,42,0.35), rgba(245,200,66,0.25));
          border: 1px solid rgba(232,82,42,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          color: #e8522a;
          flex-shrink: 0;
        }
        .sb-user-info {
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .sb.sb-c .sb-user-info { display: none; }
        .sb-user-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-user-plan {
          font-size: 0.68rem;
          color: var(--muted);
          margin-top: 1px;
        }
        .sb-logout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.52rem;
          border-radius: 9px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          font: 500 0.78rem 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.18s;
          overflow: hidden;
          white-space: nowrap;
        }
        .sb-logout:hover {
          color: var(--danger);
          border-color: var(--danger-border);
          background: var(--danger-subtle);
        }
        .sb-logout-text { transition: opacity 0.15s ease; }
        .sb.sb-c .sb-logout-text { display: none; }

        /* ── Theme Toggle ── */
        .sb-theme-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.52rem;
          border-radius: 9px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--text);
          font: 500 0.78rem 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.18s;
          overflow: hidden;
          white-space: nowrap;
          margin-bottom: 0.4rem;
        }
        .sb-theme-toggle:hover {
          background: var(--glass-hover);
        }
        .sb.sb-c .sb-theme-text { display: none; }
      `}</style>

      <aside className={`sb${collapsed ? ' sb-c' : ''}`} aria-label="Main navigation">
        {/* Brand + toggle */}
        <div className="sb-head">
          <Link to="/dashboard" className="sb-brand">
            <div className="sb-brand-icon">🍛</div>
            <span className="sb-brand-name">Meal<span>Mind</span></span>
          </Link>
          <button
            className="sb-toggle"
            onClick={() => setCollapsed(p => !p)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav links */}
        <nav className="sb-nav">
          <div className="sb-section-label">Menu</div>
          {NAV_ITEMS.map(({ to, label: navLabel, emoji }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}
              title={collapsed ? navLabel : undefined}
            >
              <span className="sb-link-emoji">{emoji}</span>
              <span className="sb-link-label">{navLabel}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="sb-footer">
          <div className="sb-user-card" title={collapsed ? label : undefined}>
            <div className="sb-avatar">{initials}</div>
            <div className="sb-user-info">
              <div className="sb-user-name">{label}</div>
              <div className="sb-user-plan">Free tier</div>
            </div>
          </div>
          <button className="sb-theme-toggle" onClick={toggleTheme} title={collapsed ? 'Toggle Theme' : undefined}>
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="sb-theme-text"> {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className="sb-logout" onClick={handleLogout} title={collapsed ? 'Log out' : undefined}>
            <span>↩</span>
            <span className="sb-logout-text"> Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
