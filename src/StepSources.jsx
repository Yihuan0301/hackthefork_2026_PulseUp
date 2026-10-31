import { CNO, COMPLIANCE, INGREDIENTS, RECIPE_RATIOS } from "./data/references";
import { PRICE_CATALOG } from "./data/priceCatalog";
import {
  co2AvoidedPct,
  cnoCo2PerBottleKg,
  coverageRate,
  effectiveProteinCost,
  recipeFor,
} from "./lib/nutrition";

const PORTION_G = 120;

const AGRI_ROWS = [
  {
    food: "Lentille corail",
    code: "20589",
    line: "Lentille corail, cuite",
    co2: 0.466,
    dqr: 3.01,
    kept: INGREDIENTS.lentillesCorail.co2PerKg,
    status: "Estimé",
    note: "Ordre de grandeur des légumineuses sèches. La ligne cuite est plus basse.",
  },
  {
    food: "Avoine",
    code: "9310",
    line: "Avoine, crue",
    co2: 0.953,
    dqr: 4.29,
    kept: INGREDIENTS.avoine.co2PerKg,
    status: "Plage",
    note: "Flocons précuits 1,56 (32140). Bouillis 1,01 (9313).",
  },
  {
    food: "Légumes racines",
    code: "20009",
    line: "Carotte, crue",
    co2: 0.396,
    dqr: 2.24,
    kept: INGREDIENTS.legumesRacines.co2PerKg,
    status: "Proxy",
    note: "Carotte cuite 1,34 (20008). Pomme de terre bouillie 1,25 (4003).",
  },
  {
    food: "CNO",
    code: "19599",
    line: "Yaourt nature sucré",
    co2: 1.86,
    dqr: 1.23,
    kept: CNO.co2PerKgProxy,
    status: "Proxy",
    note: "Le complément pharmaceutique n’a pas de ligne Agribalyse.",
  },
];

function eur(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} €`;
}

function num(value, digits = 1) {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function frDate(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function Status({ children, tone = "sage" }) {
  const toneClass = {
    sage: "bg-sage-100 text-sage-800",
    honey: "bg-honey-100 text-honey-500",
    clay: "bg-clay-100 text-clay-700",
  }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${toneClass}`}>{children}</span>;
}

function toneOf(status) {
  if (status === "Confirmé") return "sage";
  if (status === "Proxy" || status === "Hypothèse") return "clay";
  return "honey";
}

export default function StepSources({ dayCount, groupDeficit }) {
  const portion = recipeFor(PORTION_G);
  const batch = recipeFor(dayCount * PORTION_G);
  const cnoDay = dayCount * CNO.pricePerBottle;
  const cnoCo2 = dayCount * cnoCo2PerBottleKg();
  const coverage = coverageRate(batch.proteinG, groupDeficit);
  const cnoEffective = effectiveProteinCost(CNO.pricePerBottle, CNO.proteinPerBottle, COMPLIANCE.cno.value);
  const vegEffective = effectiveProteinCost(portion.costEur, portion.proteinG, COMPLIANCE.texturedDishFirst.value);
  const co2Cut = co2AvoidedPct(cnoCo2, batch.co2Kg);
  const sourced = PRICE_CATALOG.filter((item) => item.status === "sourced");
  const hypotheses = PRICE_CATALOG.filter((item) => item.status === "hypothesis");
  const lines = Object.entries(RECIPE_RATIOS).map(([key, ratio]) => {
    const grams = portion.grams[key];
    const ingredient = INGREDIENTS[key];
    return {
      label: ingredient.label,
      ratio,
      grams,
      protein: (grams / 100) * ingredient.proteinPer100g,
      cost: (grams / 1000) * ingredient.pricePerKg,
      co2: (grams / 1000) * ingredient.co2PerKg,
    };
  });

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
          title={`${sourced.length} sourcés · ${hypotheses.length} hypothèses`}
          text="35 ingrédients. Le prix prêt à l’emploi divise le prix sec par le rendement de cuisson. Le détail bio est une borne haute."
        />
        <SourceCard
          kicker="Clinique"
          title={`${Math.round(COMPLIANCE.cno.value * 1000) / 10} % consommés`.replace(".", ",")}
          text="Kayser-Jones, 1998, en EHPAD : volume de compléments bu face au volume prescrit. 94 % et 84 % restent une hypothèse de scénario."
        />
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="border-b border-linen-100 px-6 py-5">
          <p className="text-sm font-semibold text-sage-700">Valeur retenue pour ce service</p>
          <h3 className="mt-1 font-serif text-2xl">La ligne de la base, puis le chiffre du calcul</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-linen-50 text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-6 py-3 font-semibold">Donnée</th>
                <th className="px-4 py-3 font-semibold">Ligne ouverte</th>
                <th className="px-4 py-3 font-semibold">Dans la base</th>
                <th className="px-4 py-3 font-semibold">Retenu</th>
                <th className="px-6 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              <RetainRow
                name="Lentille corail, protéines"
                line="Ciqual · cuite"
                base={`${num(INGREDIENTS.lentillesCorail.proteinPer100g)} g/100 g`}
                kept={`${num(INGREDIENTS.lentillesCorail.proteinPer100g)} g/100 g`}
                status="Confirmé"
              />
              <RetainRow
                name="Avoine, protéines"
                line="Ciqual · flocons"
                base={`${num(INGREDIENTS.avoine.proteinPer100g)} g/100 g`}
                kept={`${num(INGREDIENTS.avoine.proteinPer100g)} g/100 g`}
                status="Confirmé"
              />
              <RetainRow
                name="Légumes racines, protéines"
                line="Ciqual · carotte 0,6 / navet 0,9"
                base="0,6–0,9 g/100 g"
                kept={`${num(INGREDIENTS.legumesRacines.proteinPer100g, 2)} g/100 g`}
                status="Moyenne"
              />
              {AGRI_ROWS.map((row) => (
                <RetainRow
                  key={row.code}
                  name={`${row.food}, CO₂`}
                  line={`Agribalyse ${row.code} · ${row.line}`}
                  base={`${num(row.co2, 3)} kg/kg · DQR ${num(row.dqr, 2)}`}
                  kept={`${num(row.kept, 1)} kg/kg`}
                  status={row.status}
                  note={row.note}
                />
              ))}
              <RetainRow
                name="Lentille corail, prix"
                line="Rungis, gros, oct. 2026"
                base="3,60 €/kg"
                kept={`${eur(INGREDIENTS.lentillesCorail.pricePerKg)}/kg`}
                status="Confirmé"
                note="Relevé détail, prêt à l’emploi après cuisson : 1,98 €/kg (Greenweez, rendement 2,5)."
              />
              <RetainRow
                name="Avoine, prix"
                line="Pas de grossiste cité"
                base="Relevé détail 3,13 €/kg"
                kept={`${eur(INGREDIENTS.avoine.pricePerKg)}/kg`}
                status="Hypothèse"
                note="Estimation collectivité. Le relevé Greenweez du 31 oct. 2026 est un prix bio de détail."
              />
              <RetainRow
                name="Légumes racines, prix"
                line="Pas de grossiste cité"
                base="Pomme de terre détail 2,15 €/kg"
                kept={`${eur(INGREDIENTS.legumesRacines.pricePerKg)}/kg`}
                status="Hypothèse"
                note="CNIPT, mai 2026. Le gros au stade expédition était à 0,26 €/kg. La carotte reste en hypothèse."
              />
              <RetainRow
                name="Complément, observance"
                line="Kayser-Jones, 1998"
                base="55,1 % du volume prescrit"
                kept={`${Math.round(COMPLIANCE.cno.value * 100)} %`}
                status="Confirmé"
                note="Les 94 % et 84 % d’assiette finie sont une hypothèse de scénario, sans étude équivalente."
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl bg-sage-800 p-7 text-linen-50 shadow-card">
          <p className="text-sm text-sage-100">Quatre formules, dans src/lib/nutrition.js</p>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed">
            <Formula name="Protéines, coût, CO₂" text="Pour chaque ingrédient : grammes / 100 × protéines Ciqual, grammes / 1 000 × prix, grammes / 1 000 × kg CO₂eq." />
            <Formula name="Couverture" text="Protéines livrées au groupe, divisées par la somme des déficits, plafonnées à 100 %." />
            <Formula name="Gramme avalé" text="Prix divisé par les protéines réellement mangées, donc après le taux d’observance." />
            <Formula name="CO₂ évité" text="1 − CO₂ de la préparation / CO₂ des compléments du même service." />
          </ul>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-card">
          <p className="text-sm font-semibold text-sage-700">Bol de {PORTION_G} g · ratio 45 / 35 / 20</p>
          <h3 className="mt-1 font-serif text-2xl">Le même calcul, appliqué à ce service</h3>
          <ul className="mt-4 divide-y divide-linen-100 text-sm">
            {lines.map((line) => (
              <li key={line.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <span>
                  {line.label}
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {Math.round(line.ratio * 100)} % · {num(line.grams, 0)} g
                  </span>
                </span>
                <span className="text-right text-ink-soft">
                  {num(line.protein)} g
                  <span className="mt-0.5 block text-xs">{eur(line.cost)} · {num(line.co2, 3)} kg</span>
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Result label="Protéines du bol" value={`${num(portion.proteinG)} g`} />
            <Result label="Coût du bol" value={eur(portion.costEur)} />
            <Result label={`${dayCount} portions`} value={eur(batch.costEur, 0)} hint={`contre ${eur(cnoDay, 0)} de compléments`} />
            <Result label="Déficit couvert" value={`${Math.round(coverage * 100)} %`} hint={`${Math.round(batch.proteinG)} g sur ${Math.round(groupDeficit)} g`} />
            <Result label="Gramme avalé" value={`${eur(vegEffective, 3)}/g`} hint={`complément ${eur(cnoEffective)}/g`} />
            <Result label="CO₂ du service" value={`−${Math.round(co2Cut * 100)} %`} hint={`${num(batch.co2Kg, 2)} kg contre ${num(cnoCo2, 2)} kg`} />
          </dl>
        </article>
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="border-b border-linen-100 px-6 py-5">
          <p className="text-sm font-semibold text-sage-700">Catalogue de prix · 35 ingrédients</p>
          <h3 className="mt-1 font-serif text-2xl">{sourced.length} relevés datés</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
            La plupart viennent de Greenweez, en grand format bio : un prix de détail, donc une borne haute. Un grossiste de collectivité paie moins. Le prix prêt à l’emploi est le prix sec divisé par le rendement de cuisson.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-linen-50 text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-6 py-3 font-semibold">Ingrédient</th>
                <th className="px-4 py-3 font-semibold">Prêt à l’emploi</th>
                <th className="px-4 py-3 font-semibold">Achat sec</th>
                <th className="px-6 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {sourced.map((item) => (
                <tr key={item.id} className="border-t border-linen-100">
                  <td className="px-6 py-3">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-ink-soft">{item.product}</p>
                  </td>
                  <td className="px-4 py-3">
                    {eur(item.readyPerKg)}/kg
                    {item.bio && <span className="mt-1 block text-xs font-semibold text-sage-700">Bio</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{eur(item.buyPerKg)}/kg</td>
                  <td className="px-6 py-3 text-ink-soft">
                    {item.source}
                    <span className="mt-1 block text-xs">{frDate(item.date)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="mt-5 rounded-3xl bg-white p-6 shadow-card">
        <summary className="cursor-pointer font-serif text-2xl">
          {hypotheses.length} ingrédients encore en hypothèse
        </summary>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Fruits, légumes frais, huiles, semoule : pas de relevé fiable à la date du dossier. La ligne garde le prix du prototype.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {hypotheses.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3 rounded-2xl bg-linen-50 px-3 py-2 text-sm">
              <span>{item.name}</span>
              <span className="text-ink-soft">{eur(item.prototypePerKg)}/kg</span>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-soft">
        Les 45 fiches résidents sont un jeu synthétique. Les taux de 94 % et 84 % ne viennent d’aucune publication. Agribalyse compte 14 956 lignes dans la synthèse utilisée pour ouvrir les codes ci-dessus.
      </p>
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

function Formula({ name, text }) {
  return (
    <li>
      <p className="font-semibold text-white">{name}</p>
      <p className="mt-1 text-sage-100">{text}</p>
    </li>
  );
}

function Result({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-linen-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-1 font-serif text-2xl">{value}</dd>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function RetainRow({ name, line, base, kept, status, note }) {
  return (
    <tr className="border-t border-linen-100 align-top">
      <td className="px-6 py-3 font-semibold">
        {name}
        {note && <p className="mt-1 text-xs font-normal leading-relaxed text-ink-soft">{note}</p>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{line}</td>
      <td className="whitespace-nowrap px-4 py-3">{base}</td>
      <td className="whitespace-nowrap px-4 py-3 font-semibold">{kept}</td>
      <td className="whitespace-nowrap px-6 py-3">
        <Status tone={toneOf(status)}>{status}</Status>
      </td>
    </tr>
  );
}
