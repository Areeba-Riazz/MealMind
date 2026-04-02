import { Link, NavLink } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/demo', label: 'Try AI' },
  { to: '/cravings', label: 'Cravings' },
  { to: '/saved', label: 'Saved recipes' },
  { to: '/food-links', label: 'Food links' },
  { to: '/preferences', label: 'Preferences' },
  { to: '/dietary', label: 'Dietary & allergies' },
  { to: '/profile', label: 'Profile' },
  { to: '/onboarding', label: 'Onboarding' },
];

/**
 * Primary navigation for authenticated app shell.
 * Intentionally minimal markup — style in a later pass (see ui-spec.md).
 */
export default function Sidebar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      if (app) await signOut(getAuth(app));
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const label = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Account';

  return (
    <aside className="mm-sidebar" aria-label="Main navigation">
      <div className="mm-sidebar__brand">
        <Link to="/dashboard">MealMind</Link>
      </div>

      <nav className="mm-sidebar__nav">
        <ul>
          {NAV_ITEMS.map(({ to, label: navLabel }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  isActive ? 'mm-sidebar__link mm-sidebar__link--active' : 'mm-sidebar__link'
                }
                end={to === '/dashboard'}
              >
                {navLabel}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mm-sidebar__footer">
        <div className="mm-sidebar__user" title={user?.email ?? undefined}>
          {label}
        </div>
        <button type="button" className="mm-sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
