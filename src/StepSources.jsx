const SOURCES = [
  ["Lentille corail cuite, protéines", "10,6 g/100g", "Ciqual 2025 (ANSES)", "Confirmé"],
  ["Flocons d'avoine secs, protéines", "10,6 g/100g", "Ciqual 2025 (ANSES)", "Confirmé"],
  ["Carotte/navet cuits, protéines", "0,6–0,9 g/100g (moyenne 0,75)", "Ciqual 2025 (ANSES)", "Confirmé"],
  ["Avoine crue, CO₂eq", "0,95–1,56 kg/kg (retenu 1,0)", "Agribalyse (ADEME)", "Plage observée, pas de valeur unique confirmée"],
  ["Légumes racines, CO₂eq", "0,4 kg/kg", "Agribalyse (ADEME), proxy aubergine/poireau 0,47–0,61", "Estimé par proxy"],
  ["Lentilles corail, CO₂eq", "0,9 kg/kg", "Agribalyse (ADEME), ordre de grandeur légumineuses sèches", "Estimé"],
  ["Lentille corail, prix gros", "3,60 €/kg", "Rungis, oct. 2026", "Confirmé"],
  ["Avoine, prix gros", "2,20 €/kg", "Estimation marché collectivité", "Non confirmé par source primaire"],
  ["Légumes racines, prix", "1,20 €/kg", "Estimation marché collectivité", "Non confirmé par source primaire"],
  ["CNO, protéines/bouteille 200ml", "20 g", "Marché (Clinutren, Fortimel), plage 18–21g", "Confirmé"],
  ["CNO, prix/bouteille", "3,00 €", "Marché grossiste/pharmacie (ex. Clinutren 4×200ml ≈ 12€)", "Confirmé"],
  ["CNO, CO₂eq", "1,9 kg/kg (proxy)", "Agribalyse, produit laitier protéiné sucré — le CNO pharmaceutique n'est pas catalogué Agribalyse", "Proxy, non spécifique"],
  ["Compliance CNO", "55,1 %", "Kayser-Jones et al., J Am Geriatr Soc, 1998 — volume consommé vs prescrit en EHPAD", "Confirmé, étude unique trouvée"],
  ["Compliance texture d'assiette (1er/2e bol)", "94 % / 84 %", "Hypothèse de scénario", "Non sourcé, aucune étude équivalente trouvée"],
];

const RESULTS = [
  ["Contexte", "Gaspillage budget", "48 %", "45 %"],
  ["Contexte", "CNO entièrement bu", "61 %", "55 %"],
  ["Contexte", "Coût/g étiquette → réel (CNO)", "0,20 € → 0,38 €", "0,15 € → 0,27 €"],
  ["Résidents", "Couverture du déficit par la recette", "non affiché (implicite 100 %)", "66 %"],
  ["Optimisation", "Protéines du bol retenu", "non chiffré (« leucine couverte »)", "10,4 g / 120 g"],
  ["Métiers (acheteur)", "Bon de commande CNO → végétal", "150 € → 12 €", "135 € → 14 €"],
  ["Métiers (acheteur)", "Économie achat", "−92 %", "−89 %"],
  ["Métiers (acheteur)", "Coût/g avalé (CNO → préparation)", "0,38 € → 0,018 €", "0,27 € → 0,032 €"],
  ["EGAlim", "Réduction CO₂", "−85 %", "−74 %"],
];

export default function StepSources() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-sage-700">Ciqual · Agribalyse · prix relevés</p>
        <h2 className="mt-2 font-serif text-4xl">D’où viennent les chiffres</h2>
        <p className="mt-3 text-ink-soft">
          Quatre bases alimentent le service. Chaque valeur retenue est confirmée, prise dans une plage, estimée par un proxy, ou laissée en hypothèse.
        </p>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SourceCard
          kicker="Ciqual 2025 · ANSES"
          title="Protéines"
          text="Grammes pour 100 g, sur l’aliment tel qu’il est servi : lentille corail cuite, flocons d’avoine, carotte et navet cuits."
        />
        <SourceCard
          kicker="Agribalyse · ADEME"
          title="14 956 produits"
          text="kg CO₂eq par kg, reliés à Ciqual par le même code aliment. Le DQR note la qualité de la ligne, 1 étant la meilleure."
        />
        <SourceCard
          kicker="Relevé de prix"
          title="13 sourcés · 22 hypothèses"
          text="35 ingrédients. Le prix prêt à l’emploi divise le prix sec par le rendement de cuisson. Le détail bio est une borne haute."
        />
        <SourceCard
          kicker="Clinique"
          title="55,1 % consommés"
          text="Kayser-Jones, 1998, en EHPAD : volume de compléments bu face au volume prescrit. 94 % et 84 % restent une hypothèse de scénario."
        />
      </section>

      <article className="mt-10 rounded-3xl bg-white p-6 shadow-card sm:p-8">
        <p className="text-sm font-semibold text-sage-700">Méthodologie des calculs — Cerveau Nutritionnel</p>
        <p className="mt-1 text-sm text-ink-soft">Oct 31, 2026 · @Salima</p>

        <h3 className="mt-8 font-serif text-3xl">Vue d'ensemble</h3>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Les chiffres de la démo (protéines, coûts, CO₂, taux de compliance) étaient des valeurs tapées en dur dans src/App.jsx, choisies pour l'effet du pitch plutôt que calculées. Ils ont été remplacés par des constantes sourcées (Ciqual, Agribalyse, prix marché, une étude clinique) et des formules qui en dérivent les chiffres affichés.
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Découverte en recalculant : la recette 45 % lentilles corail / 35 % avoine / 20 % légumes racines, dans un bol de 120 g, n'apporte que 10,4 g de protéines — ce qui ne couvre pas le déficit de tous les résidents (8 à 24 g selon la fiche). Le pitch affirmait une couverture totale implicite ; la démo affiche maintenant le taux réel (66 % du déficit du groupe comblé) plutôt que de maintenir cette affirmation.
        </p>

        <h3 className="mt-8 font-serif text-3xl">Sources de données</h3>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Toutes les constantes vivent dans src/data/references.js, avec leur source en commentaire.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-linen-50 text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Donnée</th>
                <th className="px-4 py-3 font-semibold">Valeur retenue</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((row) => (
                <tr key={row[0]} className="border-t border-linen-100 align-top">
                  <td className="px-4 py-3 font-semibold">{row[0]}</td>
                  <td className="px-4 py-3">{row[1]}</td>
                  <td className="px-4 py-3 text-ink-soft">{row[2]}</td>
                  <td className="px-4 py-3 text-ink-soft">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 font-serif text-3xl">Formules de calcul</h3>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Quatre fonctions pures dans src/lib/nutrition.js, qui consomment les constantes de references.js.
        </p>
        <p className="mt-4 leading-relaxed">
          <span className="font-semibold">recipeFor(volumeG)</span> — répartit un volume de bol selon le ratio 45/35/20 %, puis somme protéines, coût et CO₂ par ingrédient (g = grammes de l'ingrédient dans le bol, p = protéines/100g Ciqual, c = prix/kg, e = CO₂/kg Agribalyse) :
        </p>
        <Formula>P = Σ (gᵢ / 100) × pᵢ</Formula>
        <Formula>C = Σ (gᵢ / 1000) × cᵢ</Formula>
        <Formula>E = Σ (gᵢ / 1000) × eᵢ</Formula>
        <p className="mt-4 leading-relaxed">
          <span className="font-semibold">coverageRate(protéines livrées, déficit)</span> — part du déficit protidique réellement comblée, plafonnée à 100 % :
        </p>
        <Formula>R = min(1, P_livré / P_déficit)</Formula>
        <p className="mt-4 leading-relaxed">
          <span className="font-semibold">effectiveProteinCost(prix, protéines, compliance)</span> — le « Cost per Effective Protein » du pitch original, maintenant calculé : le prix divisé par les grammes réellement consommés, pas commandés :
        </p>
        <Formula>coût_par_gramme_avalé = prix / (protéines × compliance)</Formula>
        <p className="mt-4 leading-relaxed">
          <span className="font-semibold">co2AvoidedPct(CO2 référence, CO2 recette)</span> — réduction carbone de la préparation végétale face à l'équivalent CNO :
        </p>
        <Formula>réduction = max(0, 1 − CO₂_recette / CO₂_référence)</Formula>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Ces quatre fonctions alimentent les cinq écrans de la démo (src/App.jsx) ; aucun chiffre dérivé n'y est plus écrit en dur.
        </p>

        <h3 className="mt-8 font-serif text-3xl">Résultats par écran</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-linen-50 text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Écran</th>
                <th className="px-4 py-3 font-semibold">Chiffre</th>
                <th className="px-4 py-3 font-semibold">Avant (tapé en dur)</th>
                <th className="px-4 py-3 font-semibold">Après (calculé)</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((row) => (
                <tr key={`${row[0]}-${row[1]}`} className="border-t border-linen-100 align-top">
                  <td className="px-4 py-3 font-semibold">{row[0]}</td>
                  <td className="px-4 py-3">{row[1]}</td>
                  <td className="px-4 py-3 text-ink-soft">{row[2]}</td>
                  <td className="px-4 py-3">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Les quantités d'ingrédients commandées (2,43 kg lentilles, 1,89 kg avoine, 1,08 kg légumes racines pour 45 portions de 120 g) étaient déjà cohérentes avec le ratio 45/35/20 % et n'ont pas changé — elles sont juste calculées depuis recipeFor() au lieu d'être tapées.
        </p>

        <h3 className="mt-8 font-serif text-3xl">Limites et hypothèses non vérifiées</h3>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Taux de finition d'assiette (94 % / 84 %) — aucune étude publiée équivalente trouvée. Reste une hypothèse de scénario, signalée par un badge « ? » distinct dans l'app plutôt que présentée comme un fait sourcé.
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Prix avoine et légumes racines — estimations de marché collectivité, pas de grossiste identifié et cité comme pour les lentilles (Rungis).
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          CO₂ du CNO — proxy via un produit laitier protéiné sucré (Agribalyse), car le CNO pharmaceutique n'est pas catalogué dans Agribalyse. L'écart réel peut être significatif (emballage, stérilisation, logistique froidée).
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Roster des 45 résidents — reste généré procéduralement (poids, déficit, allergènes), hors périmètre de cet effort de réalisme.
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Ratio recette 45/35/20 % — inchangé par choix (voir Vue d'ensemble) : la démo assume maintenant une couverture partielle du déficit plutôt que d'ajuster la recette ou d'ajouter un concentré protéiné pour atteindre 100 %.
        </p>
      </article>
    </div>
  );
}

function SourceCard({ kicker, title, text }) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-700">{kicker}</p>
      <h3 className="mt-2 font-serif text-2xl leading-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
    </article>
  );
}

function Formula({ children }) {
  return <p className="mt-2 font-serif text-xl text-ink">{children}</p>;
}
