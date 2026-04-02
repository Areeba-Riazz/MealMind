import { AppPageShell } from '../components/AppPageShell';

const CUISINES = ['Pakistani', 'Italian', 'East Asian', 'Middle Eastern', 'Fast casual'];
const BUDGETS = ['Under 300 PKR', '300–700 PKR', '700–1500 PKR', 'No limit'] as const;
const SKILLS = ['Beginner', 'Intermediate', 'Home chef'] as const;
const GOALS = ['Weight loss', 'Muscle gain', 'Maintenance', 'Eat well'] as const;

export default function PreferencesPage() {
  return (
    <AppPageShell
      title="Preferences"
      description="Cuisines, spice, budget defaults, and goals — will sync to Firestore later."
    >
      <span className="mm-placeholder-badge">Placeholder data</span>

      <p className="mm-page__section-title" style={{ marginTop: 0 }}>Favourite cuisines</p>
      <div className="mm-chip-row">
        {CUISINES.map((c) => (
          <span key={c} className={`mm-chip ${c === 'Pakistani' || c === 'Italian' ? 'mm-chip--on' : ''}`}>
            {c}
          </span>
        ))}
      </div>

      <p className="mm-page__section-title">Spice level</p>
      <div className="mm-pill-select">
        {(['Mild', 'Medium', 'Hot'] as const).map((level) => (
          <button
            key={level}
            type="button"
            className={level === 'Medium' ? 'mm-pill-select--active' : ''}
          >
            {level}
          </button>
        ))}
      </div>

      <p className="mm-page__section-title">Default budget (PKR)</p>
      <div className="mm-pill-select">
        {BUDGETS.map((b) => (
          <button
            key={b}
            type="button"
            className={b === '300–700 PKR' ? 'mm-pill-select--active' : ''}
          >
            {b}
          </button>
        ))}
      </div>

      <p className="mm-page__section-title">Cooking skill</p>
      <div className="mm-pill-select">
        {SKILLS.map((s) => (
          <button
            key={s}
            type="button"
            className={s === 'Intermediate' ? 'mm-pill-select--active' : ''}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mm-page__section-title">Goal</p>
      <div className="mm-pill-select">
        {GOALS.map((g) => (
          <button
            key={g}
            type="button"
            className={g === 'Eat well' ? 'mm-pill-select--active' : ''}
          >
            {g}
          </button>
        ))}
      </div>

      <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
        Save & sync will connect to your profile document — UI only for now.
      </p>
    </AppPageShell>
  );
}
