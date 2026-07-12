# Phase 27 — Stabilisation layouts/pages

## Objectif

Stabiliser les pages avant d’ajouter encore des fonctionnalités.

## Contrôles prioritaires

1. Toutes les pages internes église doivent utiliser `AppShell`.
2. Toutes les pages super-admin doivent utiliser `SuperAdminShell`.
3. Les pages publiques peuvent rester sans shell interne.
4. Aucune page interne ne doit afficher un fond noir ou une structure autonome.
5. Chaque liste doit gérer l’état vide.
6. Chaque action importante doit afficher un retour utilisateur.
7. Les pages mobiles critiques doivent avoir une vue carte.

## Commandes

```bash
node scripts/audit-page-stability.js
node scripts/patch-common-page-backgrounds.js
npm run build
```

## Rapports générés

```txt
PAGE_STABILITY_REPORT.md
page-stability-report.json
PAGE_BACKGROUND_PATCH_REPORT.md
```

## Priorité de correction

1. Pages critiques `missing_app_shell`
2. Pages avec `black_background`
3. Pages avec tables sans cartes mobiles
4. Pages sans état vide
5. Pages sans gestion d’erreur
