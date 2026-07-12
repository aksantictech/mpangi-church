# Phase 30 — États vides, erreurs et chargements

## Objectif

Rendre l'application plus stable et plus maintenable en ajoutant des états standards :

- erreur de route
- chargement de route
- page introuvable
- tableau vide
- rapports d'audit plus précis

## Fichiers clés

```txt
src/components/common/RouteErrorView.tsx
src/components/common/RouteLoadingView.tsx
src/components/common/RouteNotFoundView.tsx
src/components/common/EmptyTablesEnhancer.tsx
src/styles/empty-tables.css
```

## Segments couverts

- membres
- départements
- événements
- âmes
- finances
- patrimoine
- administration
- extensions
- paramètres
- super admin
- enseignements
- profil
- page publique église

## Commandes

```bash
node scripts/patch-phase30-layout-state-enhancers.js
node scripts/audit-route-states.js
node scripts/audit-page-stability.js
npm run build
```

## Résultat attendu

- Pages critiques : 0
- Diminution forte des avertissements `no_error_state_hint`
- Les tableaux vides affichent automatiquement un message clair
