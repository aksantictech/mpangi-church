# Phase 28 — Correction pages critiques

Date: 2026-07-12T10:16:54.861Z

## Redirections stabilisées

| Fichier | Redirection |
|---|---|
| `src/app/page.tsx` | `/dashboard` |
| `src/app/account/profile/page.tsx` | `/profile` |
| `src/app/account/security/page.tsx` | `/profile/password` |
| `src/app/super-admin/page.tsx` | `/super-admin/dashboard` |
| `src/app/super-admin/users/new/page.tsx` | `/super-admin/settings/users/new` |

## Fonds enseignements corrigés

| Fichier | Statut | Changements |
|---|---|---:|
| `src/app/church/[slug]/teachings/page.tsx` | patched | 2 |
| `src/app/church/[slug]/teachings/[id]/page.tsx` | patched | 1 |
| `src/app/teachings/page.tsx` | patched | 3 |
| `src/app/teachings/[id]/page.tsx` | patched | 1 |

## À faire ensuite

1. `npm run build`
2. `node scripts/audit-page-stability.js`
3. Vérifier que les 9 pages critiques ont disparu ou diminué fortement.
