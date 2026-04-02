import { AppPageShell } from '../components/AppPageShell';

export default function OnboardingPage() {
  return (
    <AppPageShell
      title="Onboarding"
      description="One-time setup after signup — preview of steps; persistence comes later."
    >
      <span className="mm-placeholder-badge">Placeholder flow</span>

      <div className="mm-onboarding-steps" role="list">
        <div className="mm-onboarding-step mm-onboarding-step--done" role="listitem">
          Diet basics
        </div>
        <div className="mm-onboarding-step mm-onboarding-step--current" role="listitem">
          Budget & skill
        </div>
        <div className="mm-onboarding-step" role="listitem">
          Cuisines & goal
        </div>
      </div>

      <p className="mm-page__section-title" style={{ marginTop: 0 }}>Step 2 — Budget & skill (demo)</p>
      <div className="glass-card" style={{ padding: '1.1rem 1.25rem' }}>
        <div className="input-group">
          <label htmlFor="ob-budget">Default weekly food budget (PKR)</label>
          <input id="ob-budget" type="text" defaultValue="4,000 – 8,000" readOnly />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label htmlFor="ob-skill">Cooking comfort</label>
          <input id="ob-skill" type="text" defaultValue="Intermediate — I can follow most recipes" readOnly />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        <button type="button" className="mm-btn-ghost" disabled>
          Back
        </button>
        <button type="button" className="btn-primary" style={{ width: 'auto', padding: '0.65rem 1.5rem' }} disabled>
          Next
        </button>
        <button type="button" className="mm-btn-ghost" disabled>
          Skip for now
        </button>
      </div>
    </AppPageShell>
  );
}
