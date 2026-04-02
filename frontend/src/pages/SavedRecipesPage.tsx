import { Link } from 'react-router-dom';
import { AppPageShell } from '../components/AppPageShell';

const SAVED = [
  {
    id: '1',
    title: 'Chicken karahi (fridge clean-up)',
    savedAt: '28 Mar 2026',
    macros: '480 kcal · P 38g · C 42g · F 12g',
  },
  {
    id: '2',
    title: 'Masoor daal + roti bowl',
    savedAt: '25 Mar 2026',
    macros: '410 kcal · P 18g · C 58g · F 9g',
  },
  {
    id: '3',
    title: 'Egg fried rice — student budget',
    savedAt: '20 Mar 2026',
    macros: '520 kcal · P 22g · C 68g · F 14g',
  },
] as const;

export default function SavedRecipesPage() {
  return (
    <AppPageShell
      title="Saved recipes"
      description="Recipes you saved from Try AI — placeholder list until Firestore is wired."
    >
      <span className="mm-placeholder-badge">Placeholder data</span>

      <div style={{ marginTop: '0.5rem' }}>
        {SAVED.map((r) => (
          <div key={r.id} className="mm-list-row">
            <div>
              <h4>{r.title}</h4>
              <p>Saved {r.savedAt}</p>
              <p className="mm-macro-inline">{r.macros}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
              <button type="button" className="mm-btn-ghost">
                Cook again
              </button>
              <button type="button" className="mm-btn-ghost">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.88rem', color: 'var(--muted)' }}>
        No backend yet —{' '}
        <Link to="/demo" style={{ color: 'var(--accent2)' }}>
          generate a recipe
        </Link>{' '}
        and a real “Save” action will land here.
      </p>
    </AppPageShell>
  );
}
