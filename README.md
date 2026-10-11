# Plan d'allure — Tour du Nipalou

Mini-site statique (mobile first) : le coureur saisit son temps visé et obtient, pour chaque montée et chaque descente du parcours, un coefficient, une allure et un temps de passage. Il peut télécharger son plan en image 9:16 pour l'avoir sur son téléphone pendant la course.

Aucun serveur : build Vite statique, hébergé sur Vercel. Tout le calcul se fait dans le navigateur.

## Commandes

```bash
npm install
npm run dev        # serveur local ; /export-preview.html montre les images exportées
npm test           # valeurs de contrôle du modèle
npm run build      # typecheck + build dans dist/
```

## Architecture

Trois couches séparées (cf. `.claude/INTEGRATION.md`) :

1. **Données** : un JSON de profil par course, généré depuis le GPX par `scripts/gpx-to-course.mjs`.
2. **Calcul** : `src/lib/pace-model.ts`, identique pour toutes les courses.
3. **Interface** : composants React écrits avec le design system Tour du Nipalou.

```
.claude/                        Livrables d'origine : notice, modèle .mjs, page de référence validée
design/nipalou-design-system/   Design system, importé tel quel (lire son CLAUDE.md)
scripts/gpx-to-course.mjs       GPX → JSON de course
src/
  data/courses/                 JSON des courses + index.ts (registre) — voir src/data/README.md
  lib/
    pace-model.ts               Modèle : lissage, découpage, coefficients, passages (pur, testé)
    format.ts                   Formats d'affichage (2:36:45, 20,9 km, −5 %)
    usePlanSettings.ts          Réglages mémorisés dans localStorage
  components/
    PlanControls                Temps visé / allure (synchronisés), découpage, profil du coureur
    PaceSummary                 Allures moyenne, en montée, en descente
    SectionProfile              Profil coloré par section, survol avec temps de passage
    SectionsTable               Tableau des sections (empilé sous 640 px)
    MethodSection               Méthode et coût selon la pente
    ExportButton                Génère et partage l'image
    ds/                         Composants du design system portés en TSX
  export/
    renderPlanImage.ts          Image 1080×1920 : réglages, sections, profil en bas (rendu clair fixe)
    shareImage.ts               Feuille de partage native sur mobile, sinon téléchargement PNG
  styles/
    tokens-plan.css             Jetons climb / descent (composés depuis les gammes ours / ciel)
    global.css                  Styles de la page de référence, sur les jetons du design system
```

## Ajouter une course

Voir `src/data/README.md` : une commande pour convertir le GPX, une ligne dans `src/data/courses/index.ts`. Le sélecteur de course apparaît dès la deuxième.

## Design system

- Jetons et composants : `design/nipalou-design-system/` (ne pas modifier, remplacer le dossier pour une nouvelle version).
- Écarts documentés : teintes montée / descente (`tokens-plan.css`), profil coloré par section (variante d'`ElevationProfile`), icônes `trend-up`, `trend-down` et `download` ajoutées.
- Thème Jour / Nuit selon le système ; l'image exportée reste en thème Jour, lisible dehors.
- Polices Barlow / Barlow Condensed auto-hébergées via `@fontsource`.
- Le logo est une capture basse définition : remplacer `src/assets/logo-tour-du-nipalou.png` et `public/favicon.png` par le fichier source.

## Déploiement Vercel

Importer le repo dans Vercel : preset Vite détecté automatiquement (build `npm run build`, sortie `dist`). Aucune configuration nécessaire.
