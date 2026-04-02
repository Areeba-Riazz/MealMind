import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppPageShell } from '../components/AppPageShell';

const QUICK_ACTIONS = [
  { to: '/demo', label: 'Try AI', emoji: '👨‍🍳' },
  { to: '/cravings', label: 'Cravings', emoji: '🛵' },
  { to: '/saved', label: 'Saved recipes', emoji: '📖' },
  { to: '/food-links', label: 'Food links', emoji: '🔗' },
  { to: '/preferences', label: 'Preferences', emoji: '⚙️' },
  { to: '/dietary', label: 'Dietary', emoji: '🥗' },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <AppPageShell
      title="Dashboard"
      description={`Hey ${firstName} — jump back into cooking or finish your profile.`}
    >
      <span className="mm-placeholder-badge">Placeholder data</span>

      <p className="mm-page__section-title" style={{ marginTop: 0 }}>Quick actions</p>
      <div className="mm-dash-grid">
        {QUICK_ACTIONS.map(({ to, label, emoji }) => (
          <Link key={to} to={to} className="mm-dash-tile">
            <span>{label}</span>
            <span aria-hidden>{emoji}</span>
          </Link>
        ))}
      </div>

      <p className="mm-page__section-title">At a glance</p>
      <div className="mm-stat-row">
        <div className="mm-stat-pill">
          <strong>62%</strong>
          Profile complete
          <div className="mm-progress" aria-hidden>
            <div className="mm-progress__bar" style={{ width: '62%' }} />
          </div>
        </div>
        <div className="mm-stat-pill">
          <strong>0</strong>
          Meals planned this week
        </div>
        <div className="mm-stat-pill">
          <strong>3</strong>
          Saved recipes (demo)
        </div>
      </div>
    </AppPageShell>
  );
}
