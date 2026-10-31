import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Leaf,
  Lock,
  RefreshCcw,
  Sprout,
} from "lucide-react";

const FLOW = [
  { id: 1, label: "Résidents" },
  { id: 2, label: "Optimisation" },
  { id: 3, label: "Métiers" },
  { id: 4, label: "EGAlim" },
];

const IDDSI = [
  { level: 3, name: "Liquide très épais", detail: "Ne s’écoule pas en continu. Tient dans la cuillère." },
  { level: 4, name: "Purée lisse", detail: "Consistance homogène, sans aucun morceau." },
  { level: 5, name: "Haché et lubrifié", detail: "Morceaux tendres ≤ 4 mm, mélangés à une sauce." },
  { level: 6, name: "Petits morceaux", detail: "≤ 1,5 cm. Se coupe ou s’écrase au bord de la fourchette." },
  { level: 7, name: "Texture habituelle", detail: "Sans restriction de taille." },
];

const HAIRS = ["short", "bob", "wave", "bun", "thin"];
const CLOTHS = ["#6E9474", "#C4846A", "#C6A15B", "#A9C3AA", "#8C5340", "#3F5C46", "#D4A08A"];
const VOLUMES = [140, 160, 150, 170, 190, 130, 155, 175, 145, 165, 185, 135];
const ALLERGEN_CYCLE = [[], [], ["soja"], [], ["gluten"], [], ["lactose"], ["soja"]];

const TEXTURE_LABEL = { mixe: "IDDSI 4", hache: "IDDSI 5" };
const DENUT_LABEL = { severe: "Sévère", modere: "Modérée", leger: "Légère" };
const FIBRE_LABEL = { faible: "Faible", moyenne: "Moyenne" };
const ALLERGEN_LABEL = { soja: "Soja", gluten: "Gluten", lactose: "Lactose" };

const KNOWN_RESIDENTS = [
  {
    id: "CH_102",
    secteur: "Unité Soins Lourds",
    poids: 52.5,
    deficit: 25,
    denutrition: "severe",
    texture: "mixe",
    volume: 120,
    fibre: "faible",
    allergenes: ["soja"],
    hair: "short",
    glasses: false,
    cloth: "#C4846A",
  },
  {
    id: "CH_205",
    secteur: "Étage 2",
    poids: 65,
    deficit: 10,
    denutrition: "modere",
    texture: "hache",
    volume: 180,
    fibre: "moyenne",
    allergenes: [],
    hair: "wave",
    glasses: true,
    cloth: "#C6A15B",
  },
];

function buildResidents() {
  const taken = new Set(KNOWN_RESIDENTS.map((person) => person.id));
  const extras = [];
  let room = 101;
  let index = 0;

  while (extras.length < 43) {
    const id = `CH_${room}`;
    room += 1;
    if (taken.has(id)) continue;
    const secteur = index < 18 ? "Unité Soins Lourds" : index < 33 ? "Étage 2" : "Étage 1";
    const texture = secteur === "Unité Soins Lourds"
      ? (index % 7 === 0 ? "hache" : "mixe")
      : secteur === "Étage 2"
        ? (index % 4 === 0 ? "mixe" : "hache")
        : (index % 2 === 0 ? "mixe" : "hache");
    const denutrition = secteur === "Unité Soins Lourds"
      ? ["severe", "modere", "leger"][index % 3]
      : ["modere", "leger", "severe", "leger"][index % 4];
    extras.push({
      id,
      secteur,
      poids: 48 + ((index * 7) % 34) + (index % 2 ? 0.5 : 0),
      deficit: 8 + ((index * 3) % 16),
      denutrition,
      texture,
      volume: VOLUMES[index % VOLUMES.length],
      fibre: index % 4 === 0 ? "faible" : "moyenne",
      allergenes: ALLERGEN_CYCLE[index % ALLERGEN_CYCLE.length],
      hair: HAIRS[index % HAIRS.length],
      glasses: index % 3 !== 1,
      cloth: CLOTHS[index % CLOTHS.length],
    });
    index += 1;
  }

  return [...KNOWN_RESIDENTS, ...extras].sort((a, b) => Number(a.id.slice(3)) - Number(b.id.slice(3)));
}

const RESIDENTS = buildResidents();

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "secteur:Unité Soins Lourds", label: "Soins lourds" },
  { id: "secteur:Étage 1", label: "Étage 1" },
  { id: "secteur:Étage 2", label: "Étage 2" },
  { id: "texture:mixe", label: "IDDSI 4" },
  { id: "texture:hache", label: "IDDSI 5" },
  { id: "denutrition:severe", label: "Dénutrition sévère" },
  { id: "denutrition:modere", label: "Dénutrition modérée" },
  { id: "denutrition:leger", label: "Dénutrition légère" },
  { id: "fibre:faible", label: "Fibres faibles" },
  { id: "allergenes:soja", label: "Allergie soja" },
  { id: "allergenes:gluten", label: "Allergie gluten" },
  { id: "allergenes:lactose", label: "Allergie lactose" },
  { id: "allergenes:aucun", label: "Sans allergène" },
];

function matchesResident(person, filter) {
  if (filter === "all") return true;
  const splitAt = filter.indexOf(":");
  const key = filter.slice(0, splitAt);
  const value = filter.slice(splitAt + 1);
  if (key === "allergenes") {
    return value === "aucun" ? person.allergenes.length === 0 : person.allergenes.includes(value);
  }
  return person[key] === value;
}

function ruleOf(list) {
  return [...list].sort((a, b) => a.volume - b.volume || (a.fibre === "faible" ? -1 : 1))[0];
}

function formatKg(value) {
  return `${String(value).replace(".", ",")} kg`;
}

const SOLVER = [
  {
    title: "Groupe verrouillé : IDDSI 4",
    text: "Le critère n’est pas « mixer un peu ». La purée doit être homogène, sans aucun morceau.",
  },
  {
    title: "Ligne rouge physique",
    text: "Une protéine végétale qui reste granuleuse après cuisson est refusée, même si elle coûte moins cher.",
  },
  {
    title: "Safety blacklist",
    text: "Konjac et agar-agar exclus. Même règle plus haut : au-delà de 1,5 cm, ou impossible à écraser au bord de la fourchette, une formule IDDSI 6 est rejetée.",
  },
  {
    title: "Tenue IDDSI 4",
    text: "La xanthane (E415) empêche la purée de couler entre les dents de la fourchette. Elle garde sa forme dans l’assiette.",
  },
  {
    title: "Recette retenue",
    text: "45 % lentilles corail, 35 % avoine, 20 % légumes racines. Leucine couverte, volume ≤ 120 g.",
  },
];

const SERVICE = [
  { room: "CH_102", portion: "120 g", note: "Volume le plus faible du groupe" },
  { room: "CH_107", portion: "120 g", note: "Cible protéique couverte" },
  { room: "CH_114", portion: "110 g", note: "Même densité, bol plus petit" },
  { room: "CH_121", portion: "120 g", note: "Cible protéique couverte" },
];

export default function CantineShift() {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 border-b border-linen-200/80 bg-linen-50/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-700 text-linen-50">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg leading-none text-ink">Cerveau Nutritionnel</p>
              <p className="mt-1 text-sm text-ink-soft">Restauration en EHPAD</p>
            </div>
          </div>
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            <li className="flex items-center gap-2">
              <span className={`whitespace-nowrap rounded-full px-3 py-1.5 ${step === 0 ? "bg-sage-700 text-white" : "bg-sage-100 text-sage-800"}`}>
                Contexte
              </span>
              <span className="text-linen-200">/</span>
            </li>
            {FLOW.map((item, index) => {
              const current = step === item.id;
              const done = step > item.id;
              return (
                <li key={item.id} className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 ${
                      current
                        ? "bg-sage-700 text-white"
                        : done
                          ? "bg-sage-100 text-sage-800"
                          : "bg-white/70 text-ink-soft"
                    }`}
                  >
                    <span className="font-semibold">{item.id}</span>
                    {item.label}
                  </span>
                  {index < FLOW.length - 1 && <span className="text-linen-200">/</span>}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-12">
        {step === 0 && <StepContext onNext={() => setStep(1)} />}
        {step === 1 && <StepResidents onNext={() => setStep(2)} />}
        {step === 2 && <StepOptimizing onComplete={() => setStep(3)} />}
        {step === 3 && <StepMetiers onNext={() => setStep(4)} />}
        {step === 4 && <StepEgalim onReset={() => setStep(0)} />}
      </main>
    </div>
  );
}

function StepContext({ onNext }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="grid items-stretch gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl bg-clay-700 p-7 text-linen-50 shadow-card sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-clay-100">Le paradoxe du repas</p>
          <p className="mt-4 font-serif text-8xl leading-none sm:text-9xl">48 %</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">
            La moitié du budget part à la poubelle.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-clay-100">
            Étude hospitalière canadienne : 2,4 compléments oraux commandés par jour, 1,3 réellement pris.
            L’EHPAD paie le complément au prix fort, puis jette près de la moitié de ce budget repas.
          </p>
        </article>

        <article className="rounded-3xl bg-white p-7 shadow-card sm:p-8">
          <p className="text-sm font-semibold text-sage-700">CHU de Dijon · patients de 87 ans</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">
            Le plat enrichi est fini. Le complément, non.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Le complément n’est pas un repas. Une crème enrichie, donc une vraie texture d’assiette, est terminée bien plus souvent.
          </p>
          <ul className="mt-5 space-y-3">
            <IntakeBar label="CNO, entièrement bu" value="61 %" width="61%" tone="clay" />
            <IntakeBar label="Crème enrichie, premier bol" value="94 %" width="94%" tone="sage" />
            <IntakeBar label="Même crème, deuxième bol" value="84 %" width="84%" tone="sage" />
          </ul>
        </article>
      </section>

      <section className="mt-5 rounded-3xl bg-white/80 p-6 shadow-card sm:p-7">
        <p className="text-sm font-semibold text-sage-700">Coût par gramme de protéine avalé</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Cost per Effective Protein</p>
        <p className="mt-3 max-w-3xl font-serif text-2xl leading-snug text-ink sm:text-3xl">
          0,20 € sur l’étiquette. 0,38 € une fois les 48 % jetés.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Une bouteille à 2 € pour 10 g affiche 0,20 €/g. Il n’en reste que 52 % dans l’assiette, donc le gramme vraiment avalé coûte 0,38 €.
          Le bon de commande compare ensuite ce prix à la préparation végétale, finie à 94 % au lieu de 61 %.
        </p>
      </section>

      <div className="mt-10 flex justify-center">
        <button
          onClick={onNext}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-sage-700 px-7 py-4 text-base font-bold text-white transition hover:bg-sage-800"
        >
          Voir les résidents
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function StepResidents({ onNext }) {
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("CH_102");
  const listRef = useRef(null);
  const selectedRef = useRef(null);
  const visible = RESIDENTS.filter((item) => matchesResident(item, filter));
  const rule = ruleOf(visible);
  const person = visible.find((item) => item.id === selectedId) ?? rule;
  const deficitSum = visible.reduce((sum, item) => sum + item.deficit, 0);
  const mixeCount = visible.filter((item) => item.texture === "mixe").length;
  const hacheCount = visible.filter((item) => item.texture === "hache").length;
  const fibreFloor = visible.some((item) => item.fibre === "faible") ? "faible" : "moyenne";
  const fibrePerson = visible.filter((item) => item.fibre === fibreFloor).sort((a, b) => a.volume - b.volume)[0];

  useEffect(() => {
    const next = RESIDENTS.filter((item) => matchesResident(item, filter));
    if (!next.some((item) => item.id === selectedId)) setSelectedId(ruleOf(next).id);
  }, [filter, selectedId]);

  useEffect(() => {
    const list = listRef.current;
    const row = selectedRef.current;
    if (!list || !row) return;
    const top = row.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = Math.max(0, top - 12);
    }
  }, [selectedId, filter]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-sage-700">1 · Résidents</p>
        <h2 className="font-serif text-4xl">D’abord une catégorie, ensuite une personne</h2>
        <p className="mt-2 text-ink-soft">
          Le groupe se fait sur le code IDDSI, pas sur « mixer un peu » ou « ramollir ». La fiche à droite ouvre ensuite la personne choisie.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const count = RESIDENTS.filter((resident) => matchesResident(resident, item.id)).length;
          if (count === 0) return null;
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                active ? "bg-sage-700 text-white" : "bg-white text-ink-soft shadow-card hover:text-ink"
              }`}
            >
              {item.label}
              <span className={`ml-1.5 ${active ? "text-sage-100" : "text-ink-soft"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex h-80 flex-col overflow-hidden rounded-3xl bg-white shadow-card lg:h-0 lg:min-h-full">
          <div className="flex items-end justify-between gap-4 border-b border-linen-100 px-5 py-4">
            <div>
              <p className="text-sm text-ink-soft">Liste filtrée</p>
              <h3 className="font-serif text-2xl">{visible.length} résidents</h3>
            </div>
            <p className="text-right text-sm">
              <span className="block font-serif text-2xl text-sage-800">{deficitSum} g</span>
              <span className="text-ink-soft">déficit du groupe</span>
            </p>
          </div>
          <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto">
            {visible.map((item) => {
              const selected = item.id === person.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  ref={selected ? selectedRef : null}
                  onClick={() => setSelectedId(item.id)}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-linen-100 px-5 py-2.5 text-left ${
                    selected ? "bg-sage-50" : "hover:bg-linen-50"
                  }`}
                >
                  <span className="inline-flex h-11 w-11 overflow-hidden rounded-full bg-linen-100">
                    <ElderFace hair={item.hair} glasses={item.glasses} cloth={item.cloth} compact />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{item.id}</span>
                      <Tag tone={item.denutrition}>{DENUT_LABEL[item.denutrition]}</Tag>
                      <Tag>{TEXTURE_LABEL[item.texture]}</Tag>
                      {item.id === rule.id && <span className="text-xs font-semibold text-clay-700">règle du groupe</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-soft">
                      {item.secteur} · {formatKg(item.poids)} · fibres {item.fibre === "faible" ? "faibles" : "moyennes"}
                      {item.allergenes.length > 0 ? ` · ${item.allergenes.map((name) => ALLERGEN_LABEL[name]).join(", ")}` : ""}
                    </span>
                  </span>
                  <span className="text-right text-sm">
                    <span className="block font-semibold">{item.volume} g</span>
                    <span className={`block ${item.id === rule.id ? "font-semibold text-clay-700" : "text-ink-soft"}`}>{item.deficit} g</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <article className={`overflow-hidden rounded-3xl bg-white shadow-card ${person.id === rule.id ? "ring-2 ring-clay-400" : ""}`}>
          <div className={`px-5 pb-3 pt-4 ${person.id === rule.id ? "bg-clay-50" : "bg-linen-50"}`}>
            <ElderFace hair={person.hair} glasses={person.glasses} cloth={person.cloth} />
            <div className="text-center">
              <p className="font-serif text-3xl leading-none">{person.id}</p>
              <p className="mt-1 text-sm text-ink-soft">{person.secteur}</p>
              {person.id === rule.id && <p className="mt-1 text-sm font-semibold text-clay-700">Son bol décide pour ce groupe</p>}
            </div>
          </div>
          <dl className="space-y-2.5 p-5 text-sm">
            <Detail label="Poids"><span className="font-semibold">{formatKg(person.poids)}</span></Detail>
            <Detail label="Déficit protéines"><span className="font-semibold">{person.deficit} g</span></Detail>
            <Detail label="Dénutrition"><Tag tone={person.denutrition}>{DENUT_LABEL[person.denutrition]}</Tag></Detail>
            <Detail label="Texture">
              <span className="text-right">
                <span className="block font-semibold">
                  {person.texture === "mixe" ? "IDDSI 4 · Purée lisse" : "IDDSI 5 · Haché lubrifié"}
                </span>
                <span className="block text-xs font-normal text-ink-soft">
                  {person.texture === "mixe" ? "Homogène, sans aucun morceau" : "Morceaux ≤ 4 mm, dans une sauce"}
                </span>
              </span>
            </Detail>
            <Detail label="Volume max">
              <span className="flex items-center gap-2 font-semibold">
                <PortionBowl grams={person.volume} />
                {person.volume} g
              </span>
            </Detail>
            <Detail label="Fibres">
              <span className={person.fibre === "faible" ? "font-semibold text-clay-700" : "font-semibold"}>{FIBRE_LABEL[person.fibre]}</span>
            </Detail>
            <Detail label="Allergènes">
              <span className="font-semibold">
                {person.allergenes.length ? person.allergenes.map((name) => ALLERGEN_LABEL[name]).join(", ") : "Aucun"}
              </span>
            </Detail>
          </dl>
        </article>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Constraint label="Volume gastrique" value={`${rule.volume} g / repas`} hint={`Le bol de ${rule.id}`} />
        <Constraint
          label="Texture"
          value={mixeCount && hacheCount ? "IDDSI 4 et 5" : mixeCount ? "IDDSI 4" : "IDDSI 5"}
          hint={mixeCount && hacheCount ? `${mixeCount} purées · ${hacheCount} hachés` : mixeCount ? "Sans aucun morceau" : "Particules ≤ 4 mm"}
        />
        <Constraint label="Fibres" value={FIBRE_LABEL[fibreFloor]} hint={`Le seuil de ${fibrePerson.id}`} />
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-soft">Regroupement IDDSI</p>
            <p className="font-serif text-3xl text-sage-800">{deficitSum} g à combler</p>
          </div>
          <p className="max-w-md text-sm text-ink-soft">
            Les niveaux 0 à 2 concernent les boissons. IDDSI 4 : purée sans morceau. IDDSI 5 : particules de 4 mm au plus, dans une sauce.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {IDDSI.map((item) => {
            const count = item.level === 4 ? mixeCount : item.level === 5 ? hacheCount : 0;
            const active = count > 0;
            return (
              <div key={item.level} className={`rounded-2xl px-3 py-3 ${active ? "bg-sage-700 text-white" : "bg-linen-50"}`}>
                <p className={`font-serif text-2xl ${active ? "text-linen-50" : "text-sage-700"}`}>{item.level}</p>
                <p className="text-sm font-semibold leading-tight">{item.name}</p>
                <p className={`mt-1 text-xs leading-snug ${active ? "text-sage-100" : "text-ink-soft"}`}>
                  {item.detail}
                </p>
                {active && <p className="mt-1 text-xs font-semibold text-linen-50">{count} résidents</p>}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-10 flex justify-center">
        <button
          onClick={onNext}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-sage-700 px-7 py-4 text-base font-bold text-white transition hover:bg-sage-800"
        >
          Composer le repas de l’unité
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function Tag({ children, tone }) {
  const toneClass = tone === "severe"
    ? "bg-clay-100 text-clay-700"
    : tone === "modere"
      ? "bg-honey-100 text-[#8C5340]"
      : tone === "leger"
        ? "bg-sage-100 text-sage-800"
        : "bg-linen-100 text-ink-soft";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

function Constraint({ label, value, hint }) {
  return (
    <article className="rounded-2xl border border-clay-100 bg-clay-50 px-4 py-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-clay-700">
        <Lock className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
      <p className="text-sm text-ink-soft">{hint}</p>
    </article>
  );
}

function Detail({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ElderFace({ hair, glasses, cloth, compact = false }) {
  return (
    <svg viewBox={compact ? "28 36 84 84" : "0 0 140 150"} className={compact ? "h-11 w-11" : "mx-auto h-28 w-28"} aria-hidden="true">
      <path d="M22 150c4-28 18-44 48-44s44 16 48 44" fill={cloth} />
      <circle cx="26" cy="78" r="7" fill="#E4C3A4" />
      <circle cx="114" cy="78" r="7" fill="#E4C3A4" />
      <circle cx="70" cy="72" r="34" fill="#E4C3A4" />
      {hair === "bob" && <path d="M36 70c2-28 16-42 34-42s32 14 34 40c-6 10-14 6-20 2-8-6-16-6-28-2-8 3-16 6-20 2z" fill="#F4F0EA" />}
      {hair === "short" && <path d="M40 62c2-24 14-36 30-36s28 12 30 34c-8-6-16-4-24-2-10 2-18 0-26-4-4-2-8 4-10 8z" fill="#F7F4EF" />}
      {hair === "wave" && <path d="M34 74c0-30 16-48 36-48 18 0 34 16 36 44-8 2-10-10-18-14-6-3-8 6-16 8-8 2-12-8-20-6-8 2-14 10-18 16z" fill="#EFEAE3" />}
      {hair === "bun" && (
        <>
          <path d="M42 66c2-22 14-34 28-34s26 12 28 32c-8-4-18-2-28 0s-20 2-28 2z" fill="#F4F0EA" />
          <circle cx="70" cy="34" r="10" fill="#F4F0EA" />
        </>
      )}
      {hair === "thin" && <path d="M48 58c4-16 12-24 22-24s18 8 22 22c-6-8-14-6-22-4-8 2-16-2-22 6z" fill="#F7F4EF" />}
      <path d="M52 86c6 4 12 4 18 2" stroke="#D7B496" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="57" cy="74" r="2" fill="#3A322C" />
      <circle cx="83" cy="74" r="2" fill="#3A322C" />
      {glasses && (
        <>
          <circle cx="57" cy="74" r="8" fill="none" stroke="#6F645B" strokeWidth="1.6" />
          <circle cx="83" cy="74" r="8" fill="none" stroke="#6F645B" strokeWidth="1.6" />
          <path d="M65 74h10" stroke="#6F645B" strokeWidth="1.6" />
        </>
      )}
      <path d="M56 90c6 6 16 6 24 0" stroke="#8C5340" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PortionBowl({ grams }) {
  const width = 28 + ((grams - 120) / 60) * 18;
  return (
    <svg viewBox="0 0 48 28" style={{ width, height: width * 0.58 }} aria-hidden="true">
      <path d="M6 10c1 10 8 14 18 14s17-4 18-14" fill="#F3E2D8" stroke="#A86B52" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 10c2-4 8-6 14-6s12 2 14 6" fill="#E7C7A2" />
    </svg>
  );
}

function StepOptimizing({ onComplete }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const delay = active >= SOLVER.length ? 700 : active === SOLVER.length - 1 ? 1400 : 900;
    const timeout = setTimeout(() => {
      if (active >= SOLVER.length) onComplete();
      else setActive((value) => value + 1);
    }, delay);
    return () => clearTimeout(timeout);
  }, [active, onComplete]);

  return (
    <div className="animate-in fade-in duration-500 mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center py-8">
      <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-sage-300" />
        <div className="absolute inset-2 rounded-full border-2 border-sage-500 border-b-transparent animate-spin-slow" />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-50 text-sage-700">
          <Leaf className="h-7 w-7" />
        </div>
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage-700">Base Ciqual · quelques millisecondes</p>
      <h2 className="mt-3 text-center font-serif text-4xl">Le plus de protéines, dans le plus petit bol</h2>
      <p className="mt-3 text-center text-ink-soft">
        Chaque code IDDSI est une ligne rouge. Si l’ingrédient cuit ne peut pas la tenir, il sort de la formule.
      </p>
      <ol className="mt-8 w-full space-y-3">
        {SOLVER.map((item, index) => {
          if (index > active) return null;
          const done = index < active;
          return (
            <li
              key={item.title}
              className={`animate-in fade-in slide-in-from-bottom-2 rounded-2xl border px-4 py-4 ${
                done ? "border-linen-200 bg-white" : "border-sage-300 bg-sage-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-sage-100 text-sage-800" : "bg-sage-700 text-white"}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span>
                  <span className="block font-semibold">{item.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{item.text}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepMetiers({ onNext }) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-sage-700">Étape 3 · Trois métiers</p>
        <h2 className="font-serif text-4xl">Le même repas, trois lecteurs</h2>
        <p className="mt-2 text-ink-soft">
          L’acheteur voit le coût, la cuisine voit la texture, le soin voit la chambre. Chacun reçoit seulement sa feuille.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-3">
        <article className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="bg-clay-50 px-4 pt-4">
            <PersonBuyer />
            <p className="pb-4 text-center text-sm font-semibold text-clay-700">Pour l’acheteur</p>
          </div>
          <div className="p-5">
            <p className="text-sm text-ink-soft">Bon de commande</p>
            <h3 className="font-serif text-2xl leading-tight">150 € deviennent 12 €</h3>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl bg-clay-50 px-4 py-3">
                <p className="text-sm text-clay-700">CNO du jour</p>
                <p className="font-serif text-3xl text-clay-700 line-through decoration-clay-400">150 €</p>
                <p className="text-sm text-ink-soft">3,33 € / résident</p>
              </div>
              <div className="rounded-2xl bg-sage-50 px-4 py-3">
                <p className="text-sm text-sage-800">Préparation végétale</p>
                <p className="font-serif text-3xl text-sage-800">12 €</p>
                <p className="text-sm text-sage-700">0,27 € / résident · achat −92 %</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-linen-50 px-4 py-3">
              <p className="text-sm font-semibold">Gramme avalé</p>
              <p className="text-xs text-ink-soft">Cost per Effective Protein</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-clay-700">CNO</p>
                  <p className="font-serif text-2xl text-clay-700">0,38 €</p>
                  <p className="text-xs leading-snug text-ink-soft">étiquette 0,20 €, puis 48 % jetés</p>
                </div>
                <div>
                  <p className="text-xs text-sage-800">Préparation</p>
                  <p className="font-serif text-2xl text-sage-800">0,018 €</p>
                  <p className="text-xs leading-snug text-ink-soft">704 g couverts, 94 % d’assiettes finies</p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Dijon : 61 % des CNO bus en entier, 94 % pour une texture de plat. Ici, 12 € couvrent le déficit du groupe.
              </p>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <OrderLine name="Lentilles corail" qty="2,43 kg" share="45 %" />
              <OrderLine name="Avoine" qty="1,89 kg" share="35 %" />
              <OrderLine name="Légumes racines" qty="1,08 kg" share="20 %" />
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              45 portions × 120 g = 5,4 kg. Scénario de démonstration.
            </p>
          </div>
        </article>

        <article className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="bg-honey-100 px-4 pt-4">
            <PersonCook />
            <p className="pb-4 text-center text-sm font-semibold text-clay-700">Pour la cuisine</p>
          </div>
          <div className="p-5">
            <p className="text-sm text-ink-soft">Fiche cuisine · groupe IDDSI 4</p>
            <h3 className="font-serif text-2xl leading-tight">La recette, puis le contrôle</h3>
            <p className="mt-4 text-sm font-semibold text-ink-soft">Ratio du jour</p>
            <div className="mt-2 flex h-3 overflow-hidden rounded-full">
              <div className="w-[45%] bg-clay-400" />
              <div className="w-[35%] bg-honey-500" />
              <div className="w-[20%] bg-sage-500" />
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              <Recipe name="Lentilles corail" share="45 %" swatch="bg-clay-400" />
              <Recipe name="Avoine" share="35 %" swatch="bg-honey-500" />
              <Recipe name="Légumes racines" share="20 %" swatch="bg-sage-500" />
            </ul>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-honey-100/80 p-4">
                <p className="text-sm font-semibold text-clay-700">Contrôle qualité · IDDSI 4</p>
                <p className="mt-2 text-sm leading-relaxed">
                  Ne coule pas à travers les dents d’une fourchette et garde sa forme dans l’assiette.
                </p>
              </div>
              <div className="rounded-2xl bg-linen-50 p-4">
                <p className="text-sm font-semibold text-sage-800">Contrôle qualité · IDDSI 5</p>
                <p className="mt-2 text-sm leading-relaxed">
                  Petits morceaux mélangés à une sauce, taille maximale de 4 mm.
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="bg-sage-50 px-4 pt-4">
            <PersonCare />
            <p className="pb-4 text-center text-sm font-semibold text-sage-800">Pour le soin</p>
          </div>
          <div className="p-5">
            <p className="text-sm text-ink-soft">Liste de service</p>
            <h3 className="font-serif text-2xl leading-tight">Chaque chambre, son bol</h3>
            <ul className="mt-4 divide-y divide-linen-100">
              {SERVICE.map((row) => (
                <li key={row.room} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <span className="block font-semibold">{row.room}</span>
                    <span className="text-ink-soft">{row.note}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-linen-100 px-3 py-1 font-semibold">{row.portion}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              41 autres chambres suivent la même fiche. Le plus petit appétit atteint sa cible dans 120 g.
            </p>
          </div>
        </article>
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-3 rounded-full bg-sage-700 px-7 py-4 text-base font-bold text-white hover:bg-sage-800"
        >
          Ouvrir le bilan EGAlim
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function StepEgalim({ onReset }) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-sage-700">Étape 4 · Agribalyse · loi EGAlim</p>
          <h2 className="font-serif text-4xl">Le carbone du repas, prêt pour l’audit</h2>
          <p className="mt-2 text-ink-soft">
            Une fois les trois feuilles parties en cuisine et en chambre, le même calcul alimente le bordereau environnemental.
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-linen-200 bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <RefreshCcw className="h-4 w-4" />
          Revoir le secteur
        </button>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl bg-sage-800 p-8 text-linen-50 shadow-card sm:p-10">
          <p className="text-sm text-sage-100">Empreinte du service, face aux protéines animales et aux CNO</p>
          <p className="mt-4 font-serif text-7xl leading-none sm:text-8xl">−85 %</p>
          <p className="mt-4 max-w-md text-sage-100">de CO₂ sur ce scénario de démonstration.</p>
          <div className="mt-8 space-y-4">
            <CarbonRow label="CNO et protéines animales" width="100%" muted />
            <CarbonRow label="Préparation végétale du jour" width="15%" />
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-card">
          <div>
            <p className="text-sm font-semibold text-sage-700">Ce que le bordereau contient</p>
            <ul className="mt-4 space-y-4">
              <AuditPoint title="Base Agribalyse">Le repas est rattaché aux facteurs d’émission des ingrédients, sans tableur à part.</AuditPoint>
              <AuditPoint title="Loi EGAlim">La part végétale et l’achat durable sont lisibles pour le contrôle de l’établissement.</AuditPoint>
              <AuditPoint title="Même service">Les 5,4 kg commandés à l’étape précédente sont la base du calcul, pas un second menu.</AuditPoint>
            </ul>
          </div>
          <p className="mt-6 rounded-2xl bg-sage-50 px-4 py-3 text-sm leading-relaxed text-sage-800">
            Document de démonstration, à joindre tel quel à un dossier d’audit seulement après branchement des achats réels.
          </p>
        </article>
      </div>
    </div>
  );
}

function PersonBuyer() {
  return (
    <svg viewBox="0 0 220 150" className="mx-auto h-36 w-full max-w-[240px]" aria-hidden="true">
      <ellipse cx="110" cy="140" rx="62" ry="6" fill="#E7D9C8" />
      <rect x="138" y="58" width="48" height="62" rx="6" fill="#FFFBF6" stroke="#A86B52" strokeWidth="2.5" />
      <path d="M150 74h26M150 86h20M150 98h24" stroke="#C4846A" strokeWidth="2.5" strokeLinecap="round" />
      <text x="162" y="112" fill="#8C5340" fontSize="13" fontFamily="Georgia, serif">€</text>
      <path d="M78 142c1-36 16-52 40-52 18 0 32 12 36 36" fill="#3F5C46" />
      <path d="M112 96c16 6 28 4 40-8" stroke="#E4C3A4" strokeWidth="10" strokeLinecap="round" />
      <circle cx="104" cy="62" r="22" fill="#E4C3A4" />
      <path d="M84 60c1-20 14-30 26-28 10 2 18 12 18 24-8-2-16 2-24 8-8 4-16 2-20-4z" fill="#3A322C" />
      <circle cx="96" cy="64" r="1.6" fill="#3A322C" />
      <circle cx="108" cy="64" r="1.6" fill="#3A322C" />
      <path d="M96 74c4 4 10 4 14 0" stroke="#8C5340" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PersonCook() {
  return (
    <svg viewBox="0 0 220 150" className="mx-auto h-36 w-full max-w-[240px]" aria-hidden="true">
      <ellipse cx="108" cy="140" rx="62" ry="6" fill="#E7D9C8" />
      <path d="M70 142c2-34 16-48 38-48s36 14 38 48" fill="#F6F1EA" />
      <path d="M86 142c2-22 10-32 22-32s20 10 22 32" fill="#FBF3EE" stroke="#A86B52" strokeWidth="2" />
      <path d="M148 108c18 2 28 14 24 28" stroke="#C6A15B" strokeWidth="6" strokeLinecap="round" />
      <circle cx="176" cy="108" r="14" fill="#F4EDE3" stroke="#A86B52" strokeWidth="2.5" />
      <path d="M170 108h12" stroke="#C4846A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="108" cy="68" r="22" fill="#E4C3A4" />
      <path d="M78 62c6-8 16-16 30-16s24 8 30 16c-6 6-14 4-22 2-8-2-16 0-24 2-8 2-12-1-14-4z" fill="#FBF7F2" stroke="#E7D9C8" strokeWidth="2" />
      <path d="M92 46h32c2 8-4 14-16 14s-18-6-16-14z" fill="#FFFBF6" stroke="#E7D9C8" strokeWidth="2" />
      <circle cx="100" cy="70" r="1.6" fill="#3A322C" />
      <circle cx="112" cy="70" r="1.6" fill="#3A322C" />
      <path d="M100 80c4 3 10 3 14 0" stroke="#8C5340" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PersonCare() {
  return (
    <svg viewBox="0 0 220 150" className="mx-auto h-36 w-full max-w-[240px]" aria-hidden="true">
      <ellipse cx="100" cy="140" rx="58" ry="6" fill="#E7D9C8" />
      <rect x="156" y="46" width="40" height="70" rx="6" fill="#FBF7F2" stroke="#6E9474" strokeWidth="2.5" />
      <circle cx="176" cy="62" r="3" fill="#C6A15B" />
      <text x="166" y="92" fill="#3F5C46" fontSize="11" fontFamily="Nunito, sans-serif" fontWeight="700">102</text>
      <path d="M62 142c2-34 14-50 36-50 16 0 28 10 34 32" fill="#E3EDE3" />
      <path d="M96 100c14 2 26 10 36 22" stroke="#E4C3A4" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="142" cy="118" rx="16" ry="7" fill="#FBF7F2" stroke="#6E9474" strokeWidth="2" />
      <path d="M130 118c4-8 20-8 24 0" fill="#C4846A" />
      <circle cx="92" cy="64" r="22" fill="#E4C3A4" />
      <path d="M70 66c2-22 16-34 28-32 14 2 22 14 22 28-6-8-16-8-26-4-8 3-16 4-24 8z" fill="#5C463C" />
      <circle cx="84" cy="66" r="1.6" fill="#3A322C" />
      <circle cx="96" cy="66" r="1.6" fill="#3A322C" />
      <path d="M84 76c4 4 10 4 14 0" stroke="#8C5340" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CarbonRow({ label, width, muted }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className={muted ? "text-sage-100" : "text-white"}>{label}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${muted ? "bg-clay-400" : "bg-sage-300"}`} style={{ width }} />
      </div>
    </div>
  );
}

function AuditPoint({ title, children }) {
  return (
    <li>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{children}</p>
    </li>
  );
}

function IntakeBar({ label, value, width, tone }) {
  const bar = tone === "clay" ? "bg-clay-400" : "bg-sage-500";
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-serif text-xl text-ink">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-linen-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width }} />
      </div>
    </li>
  );
}

function OrderLine({ name, qty, share }) {
  return (
    <li className="flex items-center justify-between rounded-xl bg-linen-50 px-3 py-2">
      <span>{name}</span>
      <span className="text-ink-soft">
        {qty} · {share}
      </span>
    </li>
  );
}

function Recipe({ name, share, swatch }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${swatch}`} />
        {name}
      </span>
      <span className="font-semibold text-sage-800">{share}</span>
    </li>
  );
}
