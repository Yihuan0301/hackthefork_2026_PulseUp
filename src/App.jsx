import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Leaf,
  Lock,
  Shield,
  X,
} from "lucide-react";
import { CNO, COMPLIANCE } from "./data/references";
import {
  co2AvoidedPct,
  cnoCo2PerBottleKg,
  coverageRate,
  effectiveProteinCost,
  recipeFor,
} from "./lib/nutrition";
import StepSources from "./StepSources";

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
const PORTION_G = 120;
const PORTION = recipeFor(PORTION_G);
const DAY_COUNT = RESIDENTS.length;
const BATCH = recipeFor(DAY_COUNT * PORTION_G);
const CNO_DAY = DAY_COUNT * CNO.pricePerBottle;
const WASTE = 1 - COMPLIANCE.cno.value;
const CNO_LABEL = CNO.pricePerBottle / CNO.proteinPerBottle;
const CNO_EFFECTIVE = effectiveProteinCost(CNO.pricePerBottle, CNO.proteinPerBottle, COMPLIANCE.cno.value);
const VEG_EFFECTIVE = effectiveProteinCost(PORTION.costEur, PORTION.proteinG, COMPLIANCE.texturedDishFirst.value);
const SAVINGS = 1 - BATCH.costEur / CNO_DAY;
const GROUP_DEFICIT = RESIDENTS.reduce((sum, person) => sum + person.deficit, 0);
const GROUP_COVERAGE = coverageRate(BATCH.proteinG, GROUP_DEFICIT);
const CNO_CO2 = DAY_COUNT * cnoCo2PerBottleKg();
const CO2_CUT = co2AvoidedPct(CNO_CO2, BATCH.co2Kg);
const MONTH_DAYS = 30;
const MONTH_BOTTLES = DAY_COUNT * MONTH_DAYS;
const MONTH_WASTED = WASTE * CNO_DAY * MONTH_DAYS;

function formatEur(value, decimals = 0) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} €`;
}

function formatPct(ratio) {
  return `${Math.round(ratio * 100)} %`;
}

function formatG(value, decimals = 1) {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatKgFromG(grams) {
  return `${(grams / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
}

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
    text: `45 % lentilles corail, 35 % avoine, 20 % légumes racines. ${formatG(PORTION.proteinG)} g de protéines pour un bol de ${PORTION_G} g.`,
  },
];

export default function CantineShift() {
  const [step, setStep] = useState(1);
  const [solverReady, setSolverReady] = useState(false);
  const [residentImport, setResidentImport] = useState({ ready: false, folder: "" });

  function goTo(next) {
    if (!residentImport.ready && next !== 1) return;
    if (typeof next !== "number" || next < 2) setSolverReady(false);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 border-b border-linen-200/80 bg-linen-50/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <img src="/pulseup-logo.png" alt="PulseUp" className="h-9 w-auto self-start sm:h-11" />
            <div className="sm:border-l sm:border-linen-200 sm:pl-3">
              <p className="text-sm leading-snug text-ink-soft">Restauration en EHPAD</p>
              <p className="text-sm leading-snug text-ink-soft">La protéine végétale, vraiment mangée.</p>
            </div>
          </div>
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {FLOW.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2">
                <StepPill
                  current={step === item.id}
                  disabled={!residentImport.ready && item.id !== 1}
                  onClick={() => goTo(item.id)}
                >
                  <span className="font-semibold">{item.id}</span>
                  {item.label}
                </StepPill>
                {index < FLOW.length - 1 && <span className="text-linen-200">/</span>}
              </li>
            ))}
            <li className="ml-2">
              <button
                type="button"
                onClick={() => goTo(5)}
                disabled={!residentImport.ready}
                aria-current={step === 5 ? "page" : undefined}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  !residentImport.ready
                    ? "cursor-not-allowed border-linen-200 bg-transparent text-ink-soft/40"
                    : step === 5
                      ? "border-ink bg-white text-ink"
                      : "border-linen-200 bg-white text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                Méthode
              </button>
            </li>
          </ol>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-12">
        {step === 1 && (
          <StepResidents
            onNext={() => goTo(2)}
            imported={residentImport.ready}
            folderName={residentImport.folder}
            onImport={(folder = "") => setResidentImport((current) => ({ ready: true, folder: folder || current.folder }))}
          />
        )}
        {step === 2 && (
          <StepOptimizing
            settled={solverReady}
            onSettled={() => setSolverReady(true)}
            onComplete={() => goTo(3)}
          />
        )}
        {step === 3 && <StepMetiers onNext={() => goTo(4)} />}
        {step === 4 && <StepEgalim onNext={() => goTo(5)} />}
        {step === 5 && <StepSources />}
      </main>
    </div>
  );
}

function StepAction({ onClick, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
        disabled
          ? "cursor-not-allowed bg-linen-200 text-ink-soft/50"
          : "bg-sage-700 text-white hover:bg-sage-800"
      }`}
    >
      {children}
    </button>
  );
}

function StepPill({ current, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={current ? "page" : undefined}
      className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 ${
        disabled
          ? "cursor-not-allowed bg-linen-200 text-ink-soft/45"
          : current
            ? "bg-sage-700 text-white"
            : "bg-sage-100 text-sage-800 hover:bg-sage-300"
      }`}
    >
      {children}
    </button>
  );
}

function StepResidents({ onNext, imported, folderName, onImport }) {
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("CH_102");
  const listRef = useRef(null);
  const selectedRef = useRef(null);
  const folderRef = useRef(null);

  function openFolder() {
    const input = folderRef.current;
    if (!input) return;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.click();
  }

  function onFolder(event) {
    const files = event.target.files;
    if (files?.length) {
      const relative = files[0].webkitRelativePath || files[0].name;
      onImport(relative.split("/")[0]);
    }
    event.target.value = "";
  }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-sage-700">1 · Résidents</p>
          <h2 className="font-serif text-4xl">
            {imported ? "D’abord une catégorie, ensuite une personne" : "Importez d’abord les résidents"}
          </h2>
          <p className="mt-2 text-ink-soft">
            {imported
              ? "Le groupe se fait sur le code IDDSI, pas sur « mixer un peu » ou « ramollir ». La fiche à droite ouvre ensuite la personne choisie."
              : "Le secteur est encore vide. Importez le dossier : chambres, textures et déficits arrivent ensemble, et la liste s’ouvre ensuite."}
          </p>
          {imported && folderName && (
            <p className="mt-2 text-sm font-semibold text-sage-800">Dossier chargé : {folderName}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {imported && (
            <button
              type="button"
              onClick={openFolder}
              className="inline-flex items-center gap-2 rounded-full border border-linen-200 bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-linen-50"
            >
              <Download className="h-4 w-4" />
              Réimporter un dossier
            </button>
          )}
          <StepAction onClick={onNext} disabled={!imported}>
            Composer le repas de l’unité
            <ArrowRight className="h-4 w-4" />
          </StepAction>
        </div>
      </div>
      <input ref={folderRef} type="file" multiple className="hidden" onChange={onFolder} />

      {!imported && (
        <div className="mt-8 flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-linen-200 bg-white/70 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-sage-700">Secteur vide</p>
          <h3 className="mt-2 font-serif text-3xl">Aucun résident chargé</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            Les chambres, les textures et les déficits arrivent ensemble, depuis le dossier du secteur.
          </p>
          <button
            type="button"
            onClick={() => onImport()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sage-800"
          >
            <Download className="h-4 w-4" />
            Importer les {RESIDENTS.length} résidents
          </button>
        </div>
      )}

      {imported && (
      <div className="animate-in fade-in duration-500">
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
            <p className="mt-1 text-sm text-ink-soft">
              Recette à {rule.volume} g : {formatG(recipeFor(rule.volume).proteinG)} g de protéines par portion, {formatPct(coverageRate(recipeFor(rule.volume).proteinG * visible.length, deficitSum))} du déficit de ce groupe.
            </p>
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
      </div>
      )}
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

function StepOptimizing({ onComplete, onSettled, settled }) {
  const [active, setActive] = useState(settled ? SOLVER.length : 0);

  useEffect(() => {
    if (settled) return undefined;
    const delay = active >= SOLVER.length ? 700 : active === SOLVER.length - 1 ? 1400 : 900;
    const timeout = setTimeout(() => {
      if (active >= SOLVER.length) {
        onSettled();
        onComplete();
      } else setActive((value) => value + 1);
    }, delay);
    return () => clearTimeout(timeout);
  }, [active, onComplete, onSettled, settled]);

  return (
    <div className="animate-in fade-in duration-500 mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center py-8">
      <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-sage-300" />
        <div className={`absolute inset-2 rounded-full border-2 border-sage-500 ${settled ? "" : "border-b-transparent animate-spin-slow"}`} />
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
  const [sheet, setSheet] = useState(null);
  const middleRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sheet]);

  useEffect(() => {
    const node = middleRef.current;
    if (!node || sheet) return undefined;
    const measure = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      setCardHeight(wide ? node.offsetHeight : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [sheet]);

  const sideStyle = cardHeight ? { height: cardHeight } : undefined;

  if (sheet) {
    return <MetierSheet kind={sheet} onBack={() => setSheet(null)} onNext={onNext} />;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-sage-700">Étape 3 · Trois métiers</p>
          <h2 className="font-serif text-4xl">Le même repas, trois lecteurs</h2>
          <p className="mt-2 text-ink-soft">
            Chaque carte ouvre sa feuille : le coût pour l’achat, la fiche pour la cuisine, l’étiquette pour le soin.
          </p>
        </div>
        <StepAction onClick={onNext}>
          Ouvrir le bilan EGAlim
          <ArrowRight className="h-4 w-4" />
        </StepAction>
      </div>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-3">
        <button type="button" onClick={() => setSheet("acheteur")} style={sideStyle} className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl bg-white text-left shadow-card transition hover:-translate-y-0.5">
          <div className="shrink-0 bg-clay-50 px-4 pt-4">
            <PersonBuyer />
            <p className="pb-4 text-center text-sm font-semibold text-clay-700">Pour l’acheteur</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="text-sm text-ink-soft">Bon de commande</p>
            <h3 className="font-serif text-2xl leading-tight">{formatEur(CNO_DAY)} deviennent {formatEur(BATCH.costEur)}</h3>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl bg-clay-50 px-4 py-3">
                <p className="text-sm text-clay-700">CNO du jour</p>
                <p className="font-serif text-3xl text-clay-700 line-through decoration-clay-400">{formatEur(CNO_DAY)}</p>
                <p className="text-sm text-ink-soft">{formatEur(CNO.pricePerBottle, 2)} / résident</p>
              </div>
              <div className="rounded-2xl bg-sage-50 px-4 py-3">
                <p className="text-sm text-sage-800">Préparation végétale</p>
                <p className="font-serif text-3xl text-sage-800">{formatEur(BATCH.costEur)}</p>
                <p className="text-sm text-sage-700">{formatEur(BATCH.costEur / DAY_COUNT, 2)} / résident · achat −{formatPct(SAVINGS)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-linen-50 px-4 py-3">
              <p className="text-sm font-semibold">Gramme avalé</p>
              <p className="text-xs text-ink-soft">Cost per Effective Protein</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-clay-700">CNO</p>
                  <p className="font-serif text-2xl text-clay-700">{formatEur(CNO_EFFECTIVE, 2)}</p>
                  <p className="text-xs leading-snug text-ink-soft">étiquette {formatEur(CNO_LABEL, 2)}, puis {formatPct(WASTE)} non consommés</p>
                </div>
                <div>
                  <p className="text-xs text-sage-800">Préparation</p>
                  <p className="font-serif text-2xl text-sage-800">{formatEur(VEG_EFFECTIVE, 3)}</p>
                  <p className="text-xs leading-snug text-ink-soft">{Math.round(BATCH.proteinG)} g couverts, {formatPct(COMPLIANCE.texturedDishFirst.value)} d’assiettes finies</p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Kayser-Jones (1998) : {formatPct(COMPLIANCE.cno.value)} des CNO consommés. Ici, {formatEur(BATCH.costEur)} couvrent {formatPct(GROUP_COVERAGE)} du déficit du groupe.
              </p>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <OrderLine name="Lentilles corail" qty={formatKgFromG(BATCH.grams.lentillesCorail)} share="45 %" />
              <OrderLine name="Avoine" qty={formatKgFromG(BATCH.grams.avoine)} share="35 %" />
              <OrderLine name="Légumes racines" qty={formatKgFromG(BATCH.grams.legumesRacines)} share="20 %" />
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              45 portions × 120 g = 5,4 kg. Scénario de démonstration.
            </p>
            </div>
            <SheetLink>Ouvrir le bon et la conformité</SheetLink>
          </div>
        </button>

        <button type="button" ref={middleRef} onClick={() => setSheet("cuisine")} className="min-w-0 overflow-hidden rounded-3xl bg-white text-left shadow-card transition hover:-translate-y-0.5">
          <div className="bg-honey-100 px-4 pt-4">
            <PersonCook />
            <p className="pb-4 text-center text-sm font-semibold text-clay-700">Pour la cuisine</p>
          </div>
          <div className="p-5">
            <p className="text-sm text-ink-soft">Fiche cuisine · une seule marmite</p>
            <h3 className="font-serif text-2xl leading-tight">15 kg, puis le grammage de chacun</h3>
            <div className="mt-4 rounded-2xl bg-honey-100/80 p-4">
              <p className="text-sm font-semibold text-clay-700">Base IDDSI 4</p>
              <p className="mt-1 font-serif text-xl leading-tight">Lentilles, pois, avoine, pommes de terre, carottes</p>
            </div>
            <div className="mt-3 rounded-2xl bg-clay-50 p-4">
              <p className="text-sm font-semibold text-clay-700">Soja retiré · CH_102</p>
              <p className="mt-1 text-sm">La base unique passe à la protéine de pois.</p>
            </div>
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
            <SheetLink>Ouvrir la fiche technique</SheetLink>
          </div>
        </button>

        <button type="button" onClick={() => setSheet("soin")} style={sideStyle} className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl bg-white text-left shadow-card transition hover:-translate-y-0.5">
          <div className="shrink-0 bg-sage-50 px-4 pt-4">
            <PersonCare />
            <p className="pb-4 text-center text-sm font-semibold text-sage-800">Pour le soin</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <div className="min-h-0 flex-1">
            <p className="text-sm text-ink-soft">Liste de service</p>
            <h3 className="font-serif text-2xl leading-tight">Chaque chambre, son bol</h3>
            <ul className="mt-4 divide-y divide-linen-100">
              {RESIDENTS.slice(0, 4).map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-linen-100">
                    <ElderFace hair={item.hair} glasses={item.glasses} cloth={item.cloth} compact />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{item.id}</span>
                      <Tag tone={item.denutrition}>{DENUT_LABEL[item.denutrition]}</Tag>
                      <Tag>{TEXTURE_LABEL[item.texture]}</Tag>
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 font-semibold">{item.volume} g</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              45 étiquettes, une par personne. Chacune reprend la chambre, la texture et le volume.
            </p>
            </div>
            <SheetLink>Ouvrir les étiquettes</SheetLink>
          </div>
        </button>
      </div>
    </div>
  );
}

function SheetLink({ children }) {
  return (
    <span className="mt-4 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-sage-800">
      {children}
      <ArrowRight className="h-4 w-4" />
    </span>
  );
}

function MetierSheet({ kind, onBack, onNext }) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Les trois feuilles
        </button>
        <StepAction onClick={onNext}>
          Ouvrir le bilan EGAlim
          <ArrowRight className="h-4 w-4" />
        </StepAction>
      </div>
      {kind === "cuisine" && <KitchenSheet />}
      {kind === "acheteur" && <BuyerSheet />}
      {kind === "soin" && <CareSheet />}
    </div>
  );
}

const BASE_FOODS = [
  { name: "Lentilles corail", kg: 4, color: "#C4846A", src: "/foods/lentilles.png?v=4", aspect: 2.05 },
  { name: "Pois cassés", kg: 3, color: "#6E9474", src: "/foods/pois.png?v=3", aspect: 1.38 },
  { name: "Avoine", kg: 3, color: "#C6A15B", src: "/foods/avoine.png?v=3", aspect: 1 },
  { name: "Pommes de terre", kg: 3, color: "#E4C98A", src: "/foods/pommes.png?v=3", aspect: 1.34 },
  { name: "Carottes", kg: 2, color: "#C46B3A", src: "/foods/carottes.png?v=3", aspect: 1.45 },
];

function gramsOf(volume) {
  const rows = BASE_FOODS.map((food) => ({ ...food, grams: Math.floor((volume * food.kg) / 15) }));
  let leftover = volume - rows.reduce((sum, row) => sum + row.grams, 0);
  rows.forEach((row) => {
    if (leftover <= 0) return;
    row.grams += 1;
    leftover -= 1;
  });
  return rows;
}

function KitchenSheet() {
  const soyRooms = RESIDENTS.filter((item) => item.allergenes.includes("soja"));
  const served = RESIDENTS.reduce((sum, item) => sum + item.volume, 0);

  return (
    <div>
      <p className="mt-6 text-sm font-semibold text-clay-700">Pour la cuisine</p>
      <h2 className="mt-1 font-serif text-4xl">Une marmite, pas 45 recettes</h2>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">
        Le cuisinier fait la base une fois. Le grammage de chaque personne est déjà écrit.
      </p>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="overflow-hidden rounded-3xl bg-sage-800 text-linen-50 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sage-100">La recette unique</p>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">IDDSI 4</span>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-4 px-5 pb-4 pt-3 sm:px-6">
            <PotMark />
            <div>
              <h3 className="font-serif text-3xl leading-tight">15 kg de base</h3>
              <p className="mt-2 text-sm leading-relaxed text-sage-100">
                Une seule cuisson. Cinq ingrédients, plus 150 g de xanthane pour la tenue.
              </p>
            </div>
          </div>
          <ul className="grid gap-x-6 border-t border-white/15 px-5 py-1 text-sm sm:grid-cols-2 sm:px-6">
            {BASE_FOODS.map((food) => (
              <li key={food.name} className="flex items-baseline justify-between gap-3 border-b border-white/10 py-2">
                <span>{food.name}</span>
                <span>{food.kg} kg</span>
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-3 border-b border-white/10 py-2 sm:col-span-2">
              <span>Gomme xanthane (E415)</span>
              <span>150 g · dose du scénario</span>
            </li>
          </ul>
          <p className="px-5 pb-5 pt-3 text-sm text-sage-100 sm:px-6">Le cuisinier ne reçoit pas une fiche par chambre.</p>
        </article>

        <aside className="grid gap-3">
          <article className="rounded-3xl border border-clay-400 bg-clay-50 p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-700 text-white">
                <Shield className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-clay-700">Alerte allergène</p>
                <h3 className="mt-1 font-serif text-xl leading-tight">Le soja est déjà sorti de la marmite.</h3>
                <p className="mt-2 text-sm leading-relaxed">
                  CH_102 est allergique au soja, avec {soyRooms.length - 1} autres chambres. La base unique passe à la protéine de pois. Pas de seconde recette.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-3xl bg-honey-100/80 p-4">
            <p className="text-sm font-semibold text-clay-700">Avant de sortir · IDDSI 4</p>
            <p className="mt-2 text-sm leading-relaxed">
              Test à la fourchette : ne coule pas à travers les dents, ne rend pas de liquide, et garde sa forme dans l’assiette.
            </p>
          </article>
          <article className="rounded-3xl bg-white p-4 shadow-card">
            <p className="text-sm font-semibold text-sage-800">Avant de sortir · IDDSI 5</p>
            <p className="mt-2 text-sm leading-relaxed">
              Petits morceaux mélangés à une sauce, taille maximale de 4 mm.
            </p>
          </article>
        </aside>
      </div>

      <DressageBoard served={served} />
    </div>
  );
}

function DressageBoard({ served }) {
  const [selectedId, setSelectedId] = useState("CH_102");
  const person = RESIDENTS.find((item) => item.id === selectedId) ?? RESIDENTS[0];
  const parts = gramsOf(person.volume);
  const soy = person.allergenes.includes("soja");
  const smooth = person.texture === "mixe";

  return (
    <section className="mt-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sage-800">Plan de dressage</p>
          <h3 className="mt-1 font-serif text-3xl">Chaque assiette, son poids</h3>
        </div>
        <p className="text-right text-sm text-ink-soft">{RESIDENTS.length} personnes</p>
      </div>
      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex h-80 flex-col overflow-hidden rounded-3xl bg-white shadow-card lg:h-0 lg:min-h-full">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {RESIDENTS.map((item) => {
              const selected = item.id === person.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-linen-100 px-4 py-2.5 text-left ${
                    selected ? "bg-sage-50" : "hover:bg-linen-50"
                  }`}
                >
                  <span className="inline-flex h-11 w-11 overflow-hidden rounded-full bg-linen-100">
                    <ElderFace hair={item.hair} glasses={item.glasses} cloth={item.cloth} compact />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{item.id}</span>
                      <Tag>{TEXTURE_LABEL[item.texture]}</Tag>
                      {item.allergenes.includes("soja") && <span className="text-xs font-semibold text-clay-700">pois, pas soja</span>}
                    </span>
                  </span>
                  <span className="font-semibold">{item.volume} g</span>
                </button>
              );
            })}
          </div>
        </section>

        <article className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-sm text-ink-soft">Assiette de {person.id}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Tag>{TEXTURE_LABEL[person.texture]}</Tag>
            {soy && <span className="text-xs font-semibold text-clay-700">pois, pas soja</span>}
          </div>
          <MealPlate />
          <p className="text-center font-serif text-3xl leading-none">{person.volume} g</p>
          <p className="mt-1 text-center text-sm text-ink-soft">
            {smooth ? "Purée lisse, sans aucun morceau" : "Morceaux ≤ 4 mm, dans une sauce"}
          </p>
          <ul className="mt-3 grid grid-cols-6 gap-2 text-sm">
            {parts.map((part, index) => (
              <li
                key={part.name}
                className={`flex items-center justify-between gap-1.5 rounded-2xl bg-linen-50 px-2.5 py-2 ${
                  index < 3 ? "col-span-2" : "col-span-3"
                }`}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: part.color }} />
                  <span className="leading-tight">{part.name}</span>
                </span>
                <span className="shrink-0 font-semibold">{part.grams} g</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            {soy
              ? "Même base que la marmite, sans soja. La protéine de cette assiette est le pois."
              : "Même base que la marmite : lentilles, pois cassés, avoine, pommes de terre et carottes."}
          </p>
        </article>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Somme des {RESIDENTS.length} assiettes de ce secteur : {(served / 1000).toFixed(1).replace(".", ",")} kg.
      </p>
    </section>
  );
}

function MealPlate() {
  const lobes = 16;
  const rim = scallopedRim(100, 100, 78, 92, lobes);
  const total = BASE_FOODS.reduce((sum, food) => sum + food.kg, 0);
  let cursor = -Math.PI / 2;
  const slices = BASE_FOODS.map((food, index) => {
    const sweep = (food.kg / total) * Math.PI * 2;
    const start = cursor;
    cursor += sweep;
    const box = sectorBox(100, 100, 14, 58, start, cursor, food.aspect ?? 1);
    return { ...food, index, start, end: cursor, d: donutSlice(100, 100, 14, 58, start, cursor), box };
  });
  return (
    <svg viewBox="0 0 200 200" className="mx-auto mt-2 w-full max-w-[280px]" aria-hidden="true">
      <defs>
        {slices.map((food) => (
          <clipPath id={`plate-food-${food.index}`} key={food.name}>
            <path d={food.d} />
          </clipPath>
        ))}
      </defs>
      <ellipse cx="100" cy="168" rx="62" ry="7" fill="#E7D9C8" opacity="0.7" />
      <path d={rim} fill="#FFFcf8" stroke="#3F6B46" strokeWidth="1.7" />
      <circle cx="100" cy="100" r="62" fill="#FFFcf8" stroke="#E7E2D4" strokeWidth="1" />
      {Array.from({ length: lobes }, (_, index) => (
        <path key={index} d={rimCurl(100, 100, 84, index, lobes)} fill="none" stroke="#3F6B46" strokeWidth="1.15" strokeLinecap="round" />
      ))}
      {slices.map((food) => (
        <g key={food.name} clipPath={`url(#plate-food-${food.index})`}>
          <path d={food.d} fill={food.color} opacity="0.38" />
          <image href={food.src} x={food.box.x} y={food.box.y} width={food.box.width} height={food.box.height} preserveAspectRatio="xMidYMid meet" />
        </g>
      ))}
      {slices.map((food) => (
        <path key={`${food.name}-edge`} d={food.d} fill="none" stroke="#FFFcf8" strokeWidth="2.4" />
      ))}
    </svg>
  );
}

function sectorBox(cx, cy, inner, outer, start, end, aspect) {
  const mid = (start + end) / 2;
  const sweep = end - start;
  let height = (outer - inner) * 0.9;
  let width = height * aspect;
  let radius = (inner + outer) / 2;
  for (let step = 0; step < 16; step += 1) {
    const angular = 2 * radius * Math.tan(sweep / 2) * 0.9;
    width = Math.min(width, angular);
    height = width / aspect;
    height = Math.min(height, (outer - inner) * 0.88);
    width = height * aspect;
    const innerClear = inner + height / 2 + 1.2;
    const outerClear = outer - height / 2 - 1.2;
    radius = innerClear <= outerClear ? (innerClear + outerClear) / 2 : (inner + outer) / 2;
    const x = cx + radius * Math.cos(mid) - width / 2;
    const y = cy + radius * Math.sin(mid) - height / 2;
    const corners = [
      [x, y],
      [x + width, y],
      [x, y + height],
      [x + width, y + height],
    ];
    if (corners.every((point) => pointInSlice(point[0], point[1], cx, cy, inner, outer, start, end))) break;
    height *= 0.88;
    width = height * aspect;
  }
  return {
    x: cx + radius * Math.cos(mid) - width / 2,
    y: cy + radius * Math.sin(mid) - height / 2,
    width,
    height,
  };
}

function pointInSlice(x, y, cx, cy, inner, outer, start, end) {
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.hypot(dx, dy);
  if (distance < inner + 0.6 || distance > outer - 0.6) return false;
  let offset = Math.atan2(dy, dx) - start;
  while (offset < 0) offset += Math.PI * 2;
  while (offset >= Math.PI * 2) offset -= Math.PI * 2;
  return offset <= end - start;
}

function donutSlice(cx, cy, inner, outer, start, end) {
  const large = end - start > Math.PI ? 1 : 0;
  const point = (radius, angle) => [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  const [x0, y0] = point(outer, start);
  const [x1, y1] = point(outer, end);
  const [x2, y2] = point(inner, end);
  const [x3, y3] = point(inner, start);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${outer} ${outer} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${inner} ${inner} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
}

function scallopedRim(cx, cy, inner, outer, count) {
  let d = "";
  for (let i = 0; i < count; i += 1) {
    const a0 = (i / count) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / count) * Math.PI * 2 - Math.PI / 2;
    const mid = (a0 + a1) / 2;
    const x0 = cx + inner * Math.cos(a0);
    const y0 = cy + inner * Math.sin(a0);
    const x1 = cx + inner * Math.cos(a1);
    const y1 = cy + inner * Math.sin(a1);
    const qx = cx + outer * Math.cos(mid);
    const qy = cy + outer * Math.sin(mid);
    d += i === 0 ? `M ${x0.toFixed(2)} ${y0.toFixed(2)} ` : "";
    d += `Q ${qx.toFixed(2)} ${qy.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)} `;
  }
  return `${d}Z`;
}

function rimCurl(cx, cy, radius, index, count) {
  const mid = ((index + 0.5) / count) * Math.PI * 2 - Math.PI / 2;
  const side = mid + Math.PI / 2;
  const x = cx + radius * Math.cos(mid);
  const y = cy + radius * Math.sin(mid);
  const x1 = x - 5.5 * Math.cos(side) + 1.5 * Math.cos(mid);
  const y1 = y - 5.5 * Math.sin(side) + 1.5 * Math.sin(mid);
  const x2 = x + 4.2 * Math.cos(side) - 2.2 * Math.cos(mid);
  const y2 = y + 4.2 * Math.sin(side) - 2.2 * Math.sin(mid);
  const qx = x + 1.5 * Math.cos(mid);
  const qy = y + 1.5 * Math.sin(mid);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${qx.toFixed(2)} ${qy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function PotMark() {
  return (
    <svg viewBox="0 0 88 72" className="h-20 w-24" aria-hidden="true">
      <path d="M18 30h52v24a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10V30z" fill="#F4EDE3" />
      <path d="M12 28h64" stroke="#FBF7F2" strokeWidth="4" strokeLinecap="round" />
      <path d="M8 32c4 2 6 8 4 12" stroke="#E7D9C8" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M80 32c-4 2-6 8-4 12" stroke="#E7D9C8" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M34 28c1-10 6-16 10-16s9 6 10 16" fill="none" stroke="#E7D9C8" strokeWidth="3" />
      <text x="44" y="52" textAnchor="middle" fill="#3F5C46" fontFamily="Fraunces, Georgia, serif" fontSize="16">15 kg</text>
    </svg>
  );
}

function BuyerSheet() {
  return (
    <div>
      <p className="mt-6 text-sm font-semibold text-clay-700">Pour la direction</p>
      <h2 className="mt-1 font-serif text-4xl">Ce que le mois économise</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Le bon du jour est à {formatEur(CNO_DAY)} de compléments. Sur {MONTH_DAYS} jours, et avec {formatPct(WASTE)} qui ne sont pas mangés, le tableau devient celui-ci.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl bg-white p-6 shadow-card">
          <p className="text-sm text-ink-soft">Compléments remplacés</p>
          <p className="mt-2 font-serif text-4xl">{MONTH_BOTTLES.toLocaleString("fr-FR")}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">flacons sur le mois. {formatEur(CNO_DAY)} par jour, à {formatEur(CNO.pricePerBottle)} le flacon, pendant {MONTH_DAYS} jours.</p>
        </article>
        <article className="rounded-3xl bg-clay-50 p-6 shadow-card">
          <p className="text-sm text-clay-700">Budget jeté, évité</p>
          <p className="mt-2 font-serif text-4xl text-clay-700">{formatEur(MONTH_WASTED)}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{formatPct(WASTE)} de {formatEur(CNO_DAY)}, chaque jour. C’est la part du complément qui ne finit pas dans l’assiette.</p>
        </article>
        <article className="rounded-3xl bg-sage-800 p-6 text-linen-50 shadow-card">
          <p className="text-sm text-sage-100">Gramme avalé</p>
          <p className="text-xs text-sage-100">Cost per Effective Protein</p>
          <p className="mt-3 font-serif text-4xl">{formatEur(VEG_EFFECTIVE, 3)}</p>
          <p className="mt-2 text-sm leading-relaxed text-sage-100">contre {formatEur(CNO_EFFECTIVE, 2)} une fois les {formatPct(WASTE)} non consommés. {Math.round(BATCH.proteinG)} g couverts, {formatPct(COMPLIANCE.texturedDishFirst.value)} d’assiettes finies.</p>
        </article>
      </div>
    </div>
  );
}

const PLATE = [
  { id: "full", label: "Tout mangé", share: "100 %", dot: "bg-sage-500", on: "border-sage-500 bg-sage-50" },
  { id: "half", label: "À moitié", share: "50 %", dot: "bg-honey-500", on: "border-honey-500 bg-honey-100" },
  { id: "none", label: "Refusé", share: "0 %", dot: "bg-clay-600", on: "border-clay-600 bg-clay-50" },
];

function CareSheet() {
  const [selectedId, setSelectedId] = useState("CH_102");
  const [plates, setPlates] = useState({});
  const rule = ruleOf(RESIDENTS);
  const person = RESIDENTS.find((item) => item.id === selectedId) ?? rule;
  const textureName = person.texture === "mixe" ? "IDDSI 4 · Purée lisse" : "IDDSI 5 · Haché et lubrifié";
  const plate = plates[person.id];

  return (
    <div>
      <p className="mt-6 text-sm font-semibold text-sage-800">Pour le soin</p>
      <h2 className="mt-1 font-serif text-4xl">Les étiquettes du service</h2>
      <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex h-80 flex-col overflow-hidden rounded-3xl bg-white shadow-card lg:h-0 lg:min-h-full">
          <div className="flex items-end justify-between gap-4 border-b border-linen-100 px-5 py-4">
            <div>
              <p className="text-sm text-ink-soft">Liste de service</p>
              <h3 className="font-serif text-2xl">{RESIDENTS.length} étiquettes</h3>
            </div>
            <p className="text-right text-sm text-ink-soft">Une par personne</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {RESIDENTS.map((item) => {
              const selected = item.id === person.id;
              return (
                <button
                  key={item.id}
                  type="button"
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
                    <span className="mt-0.5 block truncate text-sm text-ink-soft">{item.secteur}</span>
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
          <div className="p-5">
            <p className="text-sm text-ink-soft">Étiquette à coller sur le plateau</p>
            <div className="mt-3 rounded-2xl border-2 border-dashed border-sage-500 bg-sage-50 px-4 py-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag tone={person.denutrition}>{DENUT_LABEL[person.denutrition]}</Tag>
                <Tag>{TEXTURE_LABEL[person.texture]}</Tag>
              </div>
              <p className="mt-3 text-sm font-semibold">{textureName}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {person.texture === "mixe" ? "Homogène, sans aucun morceau" : "Morceaux ≤ 4 mm, dans une sauce"}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <PortionBowl grams={person.volume} />
                {person.volume} g
              </p>
              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-sage-800">
                {formatG(recipeFor(person.volume).proteinG)} g de protéines · déficit {person.deficit} g
              </p>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold">Retour d’assiette</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PLATE.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={plate === item.id}
                    onClick={() => setPlates((current) => ({ ...current, [person.id]: item.id }))}
                    className={`rounded-2xl border px-2 py-3 text-center ${
                      plate === item.id ? item.on : "border-linen-200 bg-white hover:bg-linen-50"
                    }`}
                  >
                    <span className={`mx-auto block h-3 w-3 rounded-full ${item.dot}`} />
                    <span className="mt-2 block text-sm font-semibold leading-tight">{item.label}</span>
                    <span className="mt-1 block text-xs text-ink-soft">{item.share}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Les données ajusteront l’algorithme de demain.
              </p>
              {plate === "none" && (
                <p className="mt-2 rounded-2xl bg-clay-50 px-3 py-2 text-xs leading-relaxed text-clay-700">
                  Refus noté pour {person.id}. Demain, l’algorithme baisse la part de légumineuse de cette personne. La marmite du groupe ne change pas.
                </p>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function StepEgalim({ onNext }) {
  const [preview, setPreview] = useState(null);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-sage-700">Étape 4 · Agribalyse · loi EGAlim</p>
          <h2 className="font-serif text-4xl">Le carbone du repas, prêt pour l’audit</h2>
          <p className="mt-2 text-ink-soft">
            Une fois les trois feuilles parties en cuisine et en chambre, le même calcul alimente le bordereau environnemental.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview("egalim")}
            className="inline-flex items-center gap-2 rounded-full border border-linen-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-linen-50"
          >
            <Download className="h-4 w-4" />
            Télécharger la déclaration EGAlim
          </button>
          <StepAction onClick={onNext}>
            Voir la méthode
            <ArrowRight className="h-4 w-4" />
          </StepAction>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl bg-sage-800 p-8 text-linen-50 shadow-card sm:p-10">
          <p className="text-sm text-sage-100">Empreinte du service, face aux protéines animales et aux CNO</p>
          <p className="mt-4 font-serif text-7xl leading-none sm:text-8xl">−{formatPct(CO2_CUT)}</p>
          <p className="mt-4 max-w-md text-sage-100">de CO₂ sur ce scénario de démonstration.</p>
          <div className="mt-8 space-y-4">
            <CarbonRow label="CNO et protéines animales" width="100%" muted />
            <CarbonRow label="Préparation végétale du jour" width={`${Math.round((BATCH.co2Kg / CNO_CO2) * 100)}%`} />
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
      {preview && <ExportPreview kind={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function ExportPreview({ kind, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/55 px-4 py-16" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="w-full max-w-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {kind === "egalim" && <EgalimDeclaration onClose={onClose} />}
        {kind === "bon" && <PurchaseOrder onClose={onClose} />}
      </div>
    </div>
  );
}

function ClosePreview({ onClose }) {
  return (
    <button type="button" onClick={onClose} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-linen-100 px-3 py-1.5 text-sm font-semibold text-ink">
      <X className="h-4 w-4" />
      Fermer
    </button>
  );
}

function declarationText() {
  return [
    "Déclaration EGAlim — PulseUp",
    "Restauration collective · EHPAD",
    "Octobre 2026 · scénario de démonstration",
    "",
    "Ce bordereau reprend les rubriques de la télédéclaration annuelle sur ma cantine (ministère de l’Agriculture). Il ne remplace pas le formulaire officiel.",
    "",
    "1. Produits de qualité et durables — objectif légal : 50 % de la valeur d’achat",
    `Ce service protéiné : ${formatKgFromG(DAY_COUNT * PORTION_G)}, ${formatEur(BATCH.costEur)}.`,
    `Lentilles corail ${formatKgFromG(BATCH.grams.lentillesCorail)} · 45 %. Avoine ${formatKgFromG(BATCH.grams.avoine)} · 35 %. Légumes racines ${formatKgFromG(BATCH.grams.legumesRacines)} · 20 %.`,
    "Un végétal conventionnel n’entre pas automatiquement dans les 50 %. Seuls les achats avec un signe officiel (AB, Label Rouge, AOP, HVE, commerce équitable) comptent, sur toutes les factures de l’année.",
    "",
    "2. Produits biologiques — objectif légal : 20 %, compris dans les 50 %",
    "Non renseigné dans ce scénario. Le taux bio se lit sur les factures portant le label AB.",
    "",
    "3. Gaspillage alimentaire",
    "L’établissement doit tenir un diagnostic du gaspillage, à part des achats.",
    "Le 45 % cité dans l’outil est la part de compléments oraux non consommés (Kayser-Jones, 1998). Ce n’est pas le poids jeté en cuisine.",
    "",
    "4. Empreinte carbone — Agribalyse, hors rubrique EGAlim",
    `−${formatPct(CO2_CUT)} de CO₂ sur ce scénario, face aux CNO et aux protéines animales. Utile au dossier environnemental, pas une ligne du formulaire ma cantine.`,
    "",
    "À saisir sur ma-cantine.agriculture.gouv.fr une fois les achats réels branchés.",
  ].join("\n");
}

function downloadDeclaration() {
  const blob = new Blob([declarationText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "declaration-egalim-pulseup.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function EgalimDeclaration({ onClose }) {
  return (
    <article className="rounded-sm bg-[#FFFcf7] px-8 py-8 text-ink shadow-card sm:px-12">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-700">Télédéclaration · octobre 2026</p>
        <ClosePreview onClose={onClose} />
      </div>
      <h3 id="export-title" className="mt-3 font-serif text-3xl leading-tight">Déclaration EGAlim</h3>
      <p className="mt-1 text-sm text-ink-soft">Restauration collective · EHPAD · scénario de démonstration</p>
      <div className="my-6 h-px bg-linen-200" />
      <p className="text-sm leading-relaxed text-ink-soft">
        Les rubriques ci-dessous sont celles de la déclaration annuelle sur ma cantine, le site du ministère de l’Agriculture. Ce bordereau ne remplace pas le formulaire officiel.
      </p>
      <ul className="mt-6 space-y-3 text-sm">
        <li className="rounded-2xl bg-sage-50 px-4 py-3">
          <p className="font-semibold">Produits de qualité et durables · objectif 50 %</p>
          <p className="mt-1 leading-relaxed text-ink-soft">
            Ce service : {formatKgFromG(DAY_COUNT * PORTION_G)}, {formatEur(BATCH.costEur)}, lentilles, avoine et légumes racines.
            Un végétal sans signe officiel (AB, Label Rouge, AOP, HVE) n’entre pas dans les 50 %. Le taux se calcule sur toutes les factures de l’année.
          </p>
        </li>
        <li className="rounded-2xl bg-sage-50 px-4 py-3">
          <p className="font-semibold">Produits biologiques · objectif 20 %</p>
          <p className="mt-1 leading-relaxed text-ink-soft">Non renseigné ici. Le taux bio se lit sur les factures au label AB, et il est compris dans les 50 %.</p>
        </li>
        <li className="rounded-2xl bg-sage-50 px-4 py-3">
          <p className="font-semibold">Gaspillage alimentaire</p>
          <p className="mt-1 leading-relaxed text-ink-soft">
            Diagnostic à tenir à part. Le 45 % de l’outil est la part de compléments non consommés, pas le poids jeté en cuisine.
          </p>
        </li>
        <li className="rounded-2xl bg-linen-50 px-4 py-3">
          <p className="font-semibold">Empreinte Agribalyse · hors formulaire</p>
          <p className="mt-1 leading-relaxed text-ink-soft">
            −{formatPct(CO2_CUT)} de CO₂ sur ce scénario. Utile au dossier environnemental, ce n’est pas une ligne de ma cantine.
          </p>
        </li>
      </ul>
      <button
        type="button"
        onClick={downloadDeclaration}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sage-800"
      >
        <Download className="h-4 w-4" />
        Télécharger le fichier
      </button>
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">À saisir sur ma-cantine.agriculture.gouv.fr une fois les achats réels branchés.</p>
    </article>
  );
}

function PurchaseOrder({ onClose }) {
  return (
    <article className="rounded-sm bg-white px-8 py-8 text-ink shadow-card sm:px-12">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-700">Bon d’achat · service du jour</p>
        <ClosePreview onClose={onClose} />
      </div>
      <h3 id="export-title" className="mt-3 font-serif text-3xl leading-tight">{formatKgFromG(DAY_COUNT * PORTION_G)} · {formatEur(BATCH.costEur)}</h3>
      <ul className="mt-6 space-y-2 text-sm">
        <OrderLine name="Lentilles corail" qty={formatKgFromG(BATCH.grams.lentillesCorail)} share="45 %" />
        <OrderLine name="Avoine" qty={formatKgFromG(BATCH.grams.avoine)} share="35 %" />
        <OrderLine name="Légumes racines" qty={formatKgFromG(BATCH.grams.legumesRacines)} share="20 %" />
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-ink-soft">45 portions. Scénario de démonstration, à transmettre à l’approvisionnement.</p>
    </article>
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

