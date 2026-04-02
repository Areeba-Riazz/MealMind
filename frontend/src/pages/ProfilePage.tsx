import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppPageShell } from '../components/AppPageShell';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <AppPageShell
      title="Profile"
      description="Account details and shortcuts to preferences and saved content."
    >
      <span className="mm-placeholder-badge">Placeholder data</span>

      <p className="mm-page__section-title" style={{ marginTop: 0 }}>Account</p>
      <div className="glass-card" style={{ padding: '1.1rem 1.25rem' }}>
        <p style={{ margin: '0 0 0.35rem', fontWeight: 600 }}>
          {user?.displayName ?? 'No display name set'}
        </p>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>{user?.email ?? '—'}</p>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: 'var(--muted2)' }}>
          Member since <strong style={{ color: 'var(--muted)' }}>Jan 2025</strong> (demo)
        </p>
      </div>

      <p className="mm-page__section-title">Shortcuts</p>
      <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', lineHeight: 1.8 }}>
        <li>
          <Link to="/preferences" style={{ color: 'var(--accent2)' }}>Preferences</Link>
        </li>
        <li>
          <Link to="/dietary" style={{ color: 'var(--accent2)' }}>Dietary & allergies</Link>
        </li>
        <li>
          <Link to="/saved" style={{ color: 'var(--accent2)' }}>Saved recipes</Link>
        </li>
        <li>
          <Link to="/food-links" style={{ color: 'var(--accent2)' }}>Food links</Link>
        </li>
      </ul>

      <p className="mm-page__section-title">Security</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button type="button" className="mm-btn-ghost" disabled>
          Change password
        </button>
        <button type="button" className="mm-btn-ghost" disabled>
          Connect Google
        </button>
      </div>

      <p className="mm-page__section-title">Danger zone</p>
      <button type="button" className="mm-btn-danger" disabled>
        Delete account (coming soon)
      </button>
    </AppPageShell>
  );
}
