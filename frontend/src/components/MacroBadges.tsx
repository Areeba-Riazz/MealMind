import type { RecipeNutrition } from '../types/recipeNutrition';

type Props = {
  nutrition: RecipeNutrition;
  /** Tighter layout for saved cards */
  compact?: boolean;
};

function fmt(n: number | undefined, decimals = 0): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
}

/**
 * Estimated per-serving calories and macros from the AI recipe response.
 */
export default function MacroBadges({ nutrition, compact }: Props) {
  return (
    <>
      <style>{`
        .mb-row {
          display: flex;
          flex-wrap: wrap;
          gap: ${compact ? '0.35rem' : '0.5rem'};
          margin: ${compact ? '0.35rem 0 0' : '0 0 1rem'};
        }
        .mb-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: ${compact ? '0.22rem 0.55rem' : '0.35rem 0.75rem'};
          border-radius: 100px;
          font: ${compact ? '600 0.68rem' : '600 0.75rem'} 'DM Sans', sans-serif;
          border: 1px solid var(--border);
          background: var(--input-bg);
          color: var(--muted);
        }
        .mb-badge.cal { border-color: rgba(232, 82, 42, 0.35); background: rgba(232, 82, 42, 0.08); color: var(--accent); }
        .mb-badge.pro { border-color: rgba(46, 194, 126, 0.3); background: rgba(46, 194, 126, 0.07); color: #2ec27e; }
        .mb-badge.carb { border-color: rgba(100, 180, 255, 0.28); background: rgba(100, 180, 255, 0.07); color: #64b4ff; }
        .mb-badge.fat { border-color: rgba(245, 200, 66, 0.3); background: rgba(245, 200, 66, 0.08); color: #f5c842; }
        .mb-badge.fiber { border-color: rgba(180, 140, 255, 0.25); background: rgba(180, 140, 255, 0.06); color: #b48cff; }
        .mb-hint {
          font-size: ${compact ? '0.62rem' : '0.68rem'};
          color: var(--muted2);
          margin: ${compact ? '0.15rem 0 0' : '0.35rem 0 0'};
          font-style: italic;
        }
      `}</style>
      <div className="mb-row" role="group" aria-label="Estimated nutrition per serving">
        <span className="mb-badge cal">🔥 {fmt(nutrition.calories)} kcal</span>
        <span className="mb-badge pro">P {fmt(nutrition.proteinG)} g</span>
        <span className="mb-badge carb">C {fmt(nutrition.carbsG)} g</span>
        <span className="mb-badge fat">F {fmt(nutrition.fatG)} g</span>
        {nutrition.fiberG != null && Number.isFinite(nutrition.fiberG) && (
          <span className="mb-badge fiber">Fiber {fmt(nutrition.fiberG, 1)} g</span>
        )}
      </div>
      {!compact && (
        <p className="mb-hint">Estimates only — not a substitute for professional dietary advice.</p>
      )}
    </>
  );
}
