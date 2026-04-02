import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',     emoji: '🏠' },
  { to: '/demo',       label: 'AI Chef',        emoji: '👨‍🍳' },
  { to: '/cravings',   label: 'Cravings',       emoji: '🛵' },
  { to: '/saved',      label: 'Saved Recipes',  emoji: '📖' },
  { to: '/food-links', label: 'Food Links',     emoji: '🔗' },
  { to: '/profile',    label: 'Profile',        emoji: '⚙️' },
  { to: '/onboarding', label: 'Onboarding',     emoji: '✨' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
          background: rgba(14,14,14,0.92);
          border-right: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          padding: 0;
          overflow: hidden;
          z-index: 100;
        }

        /* ── Brand ── */
        .sb-brand {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 1.4rem 1.25rem 1.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          text-decoration: none;
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
          color: #f2ede4;
          letter-spacing: -0.4px;
        }
        .sb-brand-name span { color: #e8522a; }

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
          color: rgba(255,255,255,0.25);
          padding: 0.6rem 0.6rem 0.4rem;
          margin-top: 0.2rem;
        }

        .sb-link {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.6rem 0.75rem;
          border-radius: 10px;
          text-decoration: none;
          color: rgba(255,255,255,0.5);
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.18s, background 0.18s;
          margin-bottom: 0.1rem;
          border: 1px solid transparent;
        }
        .sb-link:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.05);
        }
        .sb-link.active {
          color: #f2ede4;
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

        /* ── User card ── */
        .sb-footer {
          padding: 0.85rem 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .sb-user-card {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 0.75rem;
          border-radius: 11px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 0.55rem;
          min-width: 0;
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
        }
        .sb-user-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #f2ede4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-user-plan {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.35);
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
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: rgba(255,255,255,0.4);
          font: 500 0.78rem 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.18s;
        }
        .sb-logout:hover {
          color: #ff8a8a;
          border-color: rgba(255,80,80,0.3);
          background: rgba(255,80,80,0.06);
        }
      `}</style>

      <aside className="sb" aria-label="Main navigation">
        {/* Brand */}
        <Link to="/dashboard" className="sb-brand">
          <div className="sb-brand-icon">🍛</div>
          <span className="sb-brand-name">Meal<span>Mind</span></span>
        </Link>

        {/* Nav links */}
        <nav className="sb-nav">
          <div className="sb-section-label">Menu</div>
          {NAV_ITEMS.map(({ to, label: navLabel, emoji }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}
            >
              <span className="sb-link-emoji">{emoji}</span>
              {navLabel}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="sb-footer">
          <div className="sb-user-card">
            <div className="sb-avatar">{initials}</div>
            <div className="sb-user-info">
              <div className="sb-user-name">{label}</div>
              <div className="sb-user-plan">Free tier</div>
            </div>
          </div>
          <button className="sb-logout" onClick={handleLogout}>
            ↩ Log out
          </button>
        </div>
      </aside>
    </>
  );
}
