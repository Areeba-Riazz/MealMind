/** Per-serving nutrition estimates returned by /api/recommend and stored on saved AI recipes. */
export interface RecipeNutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

export function parseNutrition(raw: unknown): RecipeNutrition | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const calories = Number(o.calories);
  const proteinG = Number(o.proteinG ?? o.protein);
  const carbsG = Number(o.carbsG ?? o.carbs);
  const fatG = Number(o.fatG ?? o.fat);
  const fiberRaw = o.fiberG ?? o.fiber;
  const fiberG = fiberRaw != null && fiberRaw !== '' ? Number(fiberRaw) : undefined;
  if (![calories, proteinG, carbsG, fatG].every((x) => Number.isFinite(x))) return null;
  const out: RecipeNutrition = { calories, proteinG, carbsG, fatG };
  if (fiberG != null && Number.isFinite(fiberG)) out.fiberG = fiberG;
  return out;
}
