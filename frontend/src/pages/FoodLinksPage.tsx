import { Link } from 'react-router-dom';
import { AppPageShell } from '../components/AppPageShell';

const LINKS = [
  {
    id: '1',
    restaurant: 'Burger Lab — DHA',
    item: 'Smash beef burger',
    area: 'Lahore · ~1.2 km',
    href: 'https://www.foodpanda.pk',
  },
  {
    id: '2',
    restaurant: 'Daily Deli Co.',
    item: 'Grilled chicken wrap',
    area: 'DHA Phase 4',
    href: 'https://wa.me/923001234567',
  },
] as const;

export default function FoodLinksPage() {
  return (
    <AppPageShell
      title="Food links"
      description="Bookmarked places and order links from Cravings (mock rows below)."
    >
      <span className="mm-placeholder-badge">Placeholder data</span>

      <div style={{ marginTop: '0.5rem' }}>
        {LINKS.map((row) => (
          <div key={row.id} className="mm-list-row">
            <div>
              <h4>{row.item}</h4>
              <p>{row.restaurant}</p>
              <p className="mm-macro-inline">{row.area}</p>
            </div>
            <a
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mm-btn-ghost"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              Open link
            </a>
          </div>
        ))}
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.88rem', color: 'var(--muted)' }}>
        Save from{' '}
        <Link to="/cravings" style={{ color: 'var(--accent2)' }}>
          Cravings
        </Link>{' '}
        once the flow is connected.
      </p>
    </AppPageShell>
  );
}
