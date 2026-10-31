# PulseUp

A demo for meals in a nursing home: import the residents, compose the meal, then read the cost, the kitchen sheet, and the EGAlim declaration.

Nothing to configure. No API key, no backend. The app runs in the browser on the computer that starts it.

## Run it locally

Install [Node.js 20.19 or newer](https://nodejs.org) (Node 22 is fine). Then, in a terminal:

```bash
git clone https://github.com/Yihuan0301/hackthefork_2026_PulseUp.git
cd hackthefork_2026_PulseUp
npm install
npm run dev
```

Open the address printed in the terminal, usually `http://localhost:5173`.

The first page stays empty until the residents are loaded. Click **Importer les 45 résidents**. The later steps and **Méthode** become clickable after that.

## Screens

1. **Résidents** — the ward, IDDSI textures, and one person’s card.
2. **Optimisation** — the calculation runs, then moves on to the three jobs.
3. **Métiers** — buyer, kitchen, and care.
4. **EGAlim** — the carbon of the service and the declaration.
**Méthode** sits beside the steps. It shows Ciqual, Agribalyse, the price records, and the formulas. It is not step 5.

## Build a static copy

```bash
npm run build
npm run preview
```

`preview` serves the built files, usually at `http://localhost:4173`.
