import { AppPageShell } from '../components/AppPageShell';

const ALLERGENS = ['Peanuts', 'Shellfish', 'Dairy'] as const;
const DIETS = ['Halal', 'Gluten-free', 'High protein'] as const;

export default function DietaryPage() {
  return (
    <AppPageShell
      title="Dietary & allergies"
      description="Hard constraints for recipes and AI — not medical advice."
    >
      <span className="mm-placeholder-badge">Placeholder data</span>

      <p className="mm-page__section-title" style={{ marginTop: 0 }}>Allergies & intolerances</p>
      <div className="mm-chip-row">
        {ALLERGENS.map((a) => (
          <span key={a} className="mm-chip mm-chip--on">
            {a}
          </span>
        ))}
        <span className="mm-chip">+ Add more</span>
      </div>

      <p className="mm-page__section-title">Diets & restrictions</p>
      <div className="mm-chip-row">
        {DIETS.map((d) => (
          <span key={d} className="mm-chip mm-chip--on">
            {d}
          </span>
        ))}
        <span className="mm-chip">Vegetarian</span>
        <span className="mm-chip">Vegan</span>
      </div>

      <div className="mm-disclaimer">
        MealMind uses your selections to filter suggestions. Always verify ingredients if you have a severe allergy.
      </div>
    </AppPageShell>
  );
}
