# Phase 28 — Correction pages critiques

## Basé sur l'audit

L'audit Phase 27 a trouvé :

- 126 pages analysées
- 9 pages critiques
- 66 pages avec avertissements

## Corrections appliquées

### Redirections legacy

- `/` -> `/dashboard`
- `/account/profile` -> `/profile`
- `/account/security` -> `/profile/password`
- `/super-admin` -> `/super-admin/dashboard`
- `/super-admin/users/new` -> `/super-admin/settings/users/new`

### Fonds noirs enseignements

Les pages enseignements sont corrigées pour ne plus s'afficher avec un fond noir :

- `/church/[slug]/teachings`
- `/church/[slug]/teachings/[id]`
- `/teachings`
- `/teachings/[id]`

## Commandes

```bash
node scripts/patch-phase28-critical-pages.js
npm run build
node scripts/audit-page-stability.js
```

## Objectif attendu

Les pages critiques doivent fortement diminuer, idéalement passer de 9 à 0 ou 1.
