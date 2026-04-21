/**
 * Normalizes Gemini nutrition output to a plain object or drops invalid values.
 * @param {unknown} raw
 * @returns {{ calories: number, proteinG: number, carbsG: number, fatG: number, fiberG?: number }|undefined}
 */
function normalizeNutrition(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const calories = Number(o.calories);
  const proteinG = Number(o.proteinG ?? o.protein);
  const carbsG = Number(o.carbsG ?? o.carbs);
  const fatG = Number(o.fatG ?? o.fat);
  const fiberRaw = o.fiberG ?? o.fiber;
  const fiberG =
    fiberRaw != null && fiberRaw !== "" ? Number(fiberRaw) : undefined;
  if (![calories, proteinG, carbsG, fatG].every((x) => Number.isFinite(x))) {
    return undefined;
  }
  const out = { calories, proteinG, carbsG, fatG };
  if (fiberG != null && Number.isFinite(fiberG)) out.fiberG = fiberG;
  return out;
}

module.exports = {
  normalizeNutrition,
};
