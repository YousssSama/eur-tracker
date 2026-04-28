# 💱 EUR Tracker

Suivi du taux de change Euro vers **Roupie indonésienne (IDR)** et **Ringgit malaisien (MYR)**, avec convertisseur en temps réel.

## ✨ Fonctionnalités

- 🇮🇩 🇲🇾 Bascule entre IDR et MYR en un clic
- 📈 Historique sur 1 mois / 3 mois / 6 mois / 1 an
- 🧮 Convertisseur bidirectionnel (EUR ↔ devise)
- 🔄 Auto-refresh toutes les 5 minutes + au retour sur l'onglet
- 🎯 Signal "bon / mauvais moment" basé sur la moyenne de la période
- 📊 Graphique interactif avec stats (plus haut, plus bas, moyenne, variation)

## 🛰️ Source des données

[api.frankfurter.app](https://www.frankfurter.app) — taux officiels de la **Banque centrale européenne**, mis à jour chaque jour ouvré vers 16h CET. API gratuite, sans clé, sans limite.

## 🚀 Déployer sur Vercel (3 minutes)

### Option 1 — depuis GitHub (recommandée)

1. Crée un nouveau repo sur GitHub et pousse ce dossier dedans :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<ton-user>/<ton-repo>.git
   git push -u origin main
   ```
2. Va sur [vercel.com/new](https://vercel.com/new), connecte ton GitHub, importe le repo.
3. Vercel détecte Next.js automatiquement → clique **Deploy**. C'est tout.

### Option 2 — Vercel CLI (sans GitHub)

```bash
npm i -g vercel
vercel
```

Suis les prompts. Ton app sera live en ~30 secondes.

## 💻 Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## 📁 Structure

```
eur-tracker/
├── app/
│   ├── layout.jsx       # Layout racine + fonts
│   ├── page.jsx         # Page d'entrée
│   ├── Tracker.jsx      # Composant principal (toute la logique UI)
│   ├── utils.js         # Helpers : API, formatage, config devises
│   └── globals.css      # Reset CSS minimal
├── package.json
└── next.config.mjs
```

## 🎨 Personnalisation

Pour ajouter une nouvelle devise, ajoute-la dans `app/utils.js` :

```js
export const CURRENCIES = {
  IDR: { code: "IDR", name: "Roupie indonésienne", flag: "🇮🇩", decimals: 0, short: "Rp" },
  MYR: { code: "MYR", name: "Ringgit malaisien", flag: "🇲🇾", decimals: 2, short: "RM" },
  THB: { code: "THB", name: "Baht thaïlandais", flag: "🇹🇭", decimals: 2, short: "฿" },
};
```

Tant que la devise existe sur Frankfurter (toutes les majeures + une trentaine d'autres), ça marche directement.

## 📝 Licence

MIT — fais-en ce que tu veux.
