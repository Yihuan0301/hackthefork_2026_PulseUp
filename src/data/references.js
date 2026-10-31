// Valeurs de référence pour les calculs nutritionnels, coût et carbone.
// Sources citées sur chaque champ ; approximations clairement indiquées
// quand la donnée exacte n'était pas accessible publiquement.

export const INGREDIENTS = {
  lentillesCorail: {
    label: "Lentilles corail",
    proteinPer100g: 10.6, // g — Ciqual 2025 (ANSES), "Lentille corail, cuite"
    pricePerKg: 3.6, // € — Rungis, lentille corail/rouge, gros, oct. 2026
    co2PerKg: 0.9, // kg CO2eq — Agribalyse (légumineuses sèches, ordre de grandeur)
  },
  avoine: {
    label: "Avoine (flocons)",
    proteinPer100g: 10.6, // g — Ciqual 2025 (ANSES), "Flocons d'avoine" (poids sec)
    pricePerKg: 2.2, // € — estimation grossiste collectivité (non confirmée par source primaire)
    co2PerKg: 1.0, // kg CO2eq — Agribalyse "Avoine, crue" (plage observée 0,95–1,56 selon forme)
  },
  legumesRacines: {
    label: "Légumes racines (carotte/navet)",
    proteinPer100g: 0.75, // g — moyenne Ciqual carotte cuite (0,6) / navet cuit (0,9)
    pricePerKg: 1.2, // € — estimation achat collectivité frais/surgelé (non confirmée par source primaire)
    co2PerKg: 0.4, // kg CO2eq — Agribalyse (légumes racines, proxy aubergine/poireau 0,47–0,61)
  },
};

export const RECIPE_RATIOS = {
  lentillesCorail: 0.45,
  avoine: 0.35,
  legumesRacines: 0.2,
};

export const CNO = {
  proteinPerBottle: 20, // g — bouteille 200ml hyperprotéinée (plage marché 18–21g)
  volumeMl: 200,
  pricePerBottle: 3, // € — prix grossiste/pharmacie moyen (ex. Clinutren 4×200ml ≈ 12€)
  co2PerKgProxy: 1.9, // kg CO2eq/kg — proxy produit laitier protéiné sucré (Agribalyse) ; le CNO pharmaceutique n'est pas catalogué Agribalyse
};

export const COMPLIANCE = {
  cno: {
    value: 0.551,
    source: "Kayser-Jones et al., J Am Geriatr Soc, 1998 — étude prospective en EHPAD, volume consommé vs prescrit",
    isAssumption: false,
  },
  texturedDishFirst: {
    value: 0.94,
    source: "Hypothèse de scénario (non publiée) : une texture d'assiette complète finie plus souvent qu'un flacon isolé",
    isAssumption: true,
  },
  texturedDishSecond: {
    value: 0.84,
    source: "Hypothèse de scénario (non publiée)",
    isAssumption: true,
  },
};
