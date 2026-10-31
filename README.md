# PulseUp

Démo de restauration en EHPAD : importer les résidents, composer le repas, puis lire le coût, la fiche cuisine et la déclaration EGAlim.

Rien à configurer. Pas de clé, pas de serveur. L’application tourne dans le navigateur, sur l’ordinateur de la personne qui la lance.

## Ouvrir le site

Il faut [Node.js 20.19 ou plus récent](https://nodejs.org) (la version 22 convient aussi). Dans un terminal :

```bash
git clone https://github.com/Yihuan0301/hackthefork_2026_Ve-ge-Soin.git
cd hackthefork_2026_Ve-ge-Soin
npm install
npm run dev
```

Le terminal affiche une adresse, en général `http://localhost:5173`. Ouvrez-la dans le navigateur.

La première page est vide tant que les résidents ne sont pas chargés. Cliquez sur **Importer les 45 résidents**. Les étapes suivantes et **Méthode** deviennent alors cliquables.

## Ce que fait chaque écran

1. **Résidents** — le secteur, les textures IDDSI, la fiche d’une personne.
2. **Optimisation** — le calcul se déroule, puis passe aux métiers.
3. **Métiers** — acheteur, cuisine, soin.
4. **EGAlim** — le carbone du service et la déclaration.
5. **Méthode** — Ciqual, Agribalyse, prix relevés, et les formules du service. Ce n’est pas une étape du parcours.

## Vérifier une version figée

```bash
npm run build
npm run preview
```

`preview` sert la version construite, en général sur `http://localhost:4173`.

## 在自己电脑上打开

需要安装 [Node.js 20.19 或更新版本](https://nodejs.org)。然后在终端里：

```bash
git clone https://github.com/Yihuan0301/hackthefork_2026_Ve-ge-Soin.git
cd hackthefork_2026_Ve-ge-Soin
npm install
npm run dev
```

浏览器打开终端里显示的地址，一般是 `http://localhost:5173`。

首页一开始是空的。点 **Importer les 45 résidents** 之后，后面的步骤和 **Méthode** 才能点。不需要账号，也不需要配置环境变量。
