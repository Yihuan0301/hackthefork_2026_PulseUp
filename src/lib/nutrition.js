import { CNO, INGREDIENTS, RECIPE_RATIOS } from "../data/references";

export function recipeFor(volumeG, ratios = RECIPE_RATIOS) {
  const grams = Object.fromEntries(
    Object.entries(ratios).map(([key, ratio]) => [key, volumeG * ratio]),
  );
  const proteinG = Object.entries(grams).reduce(
    (sum, [key, g]) => sum + (g / 100) * INGREDIENTS[key].proteinPer100g,
    0,
  );
  const costEur = Object.entries(grams).reduce(
    (sum, [key, g]) => sum + (g / 1000) * INGREDIENTS[key].pricePerKg,
    0,
  );
  const co2Kg = Object.entries(grams).reduce(
    (sum, [key, g]) => sum + (g / 1000) * INGREDIENTS[key].co2PerKg,
    0,
  );
  return { grams, proteinG, costEur, co2Kg };
}

export function coverageRate(proteinDeliveredG, deficitG) {
  if (deficitG <= 0) return 1;
  return Math.min(1, proteinDeliveredG / deficitG);
}

export function effectiveProteinCost(priceEur, proteinG, complianceRate) {
  const consumedProteinG = proteinG * complianceRate;
  if (consumedProteinG <= 0) return 0;
  return priceEur / consumedProteinG;
}

export function cnoCostPerBottle() {
  return CNO.pricePerBottle;
}

export function cnoCo2PerBottleKg() {
  return (CNO.volumeMl / 1000) * CNO.co2PerKgProxy;
}

export function co2AvoidedPct(co2BaselineKg, co2RecipeKg) {
  if (co2BaselineKg <= 0) return 0;
  return Math.max(0, 1 - co2RecipeKg / co2BaselineKg);
}
