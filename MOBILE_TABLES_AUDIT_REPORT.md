# Mpangi-church — Audit tables mobiles

Date: 2026-07-12T10:30:43.800Z

## Résumé

- Pages avec tableaux : 13
- Pages couvertes par cartes automatiques globales : 10
- Pages ayant déjà une logique mobile manuelle : 3

## Pages couvertes par les cartes automatiques

| Route | Tables | Fichier |
|---|---:|---|
| `/departments` | 1 | `src/app/departments/page.tsx` |
| `/events` | 1 | `src/app/events/page.tsx` |
| `/finance/reports` | 1 | `src/app/finance/reports/page.tsx` |
| `/members` | 1 | `src/app/members/page.tsx` |
| `/settings/trainings` | 1 | `src/app/settings/trainings/page.tsx` |
| `/souls` | 1 | `src/app/souls/page.tsx` |
| `/super-admin/churches/[id]` | 1 | `src/app/super-admin/churches/[id]/page.tsx` |
| `/super-admin/dashboard` | 1 | `src/app/super-admin/dashboard/page.tsx` |
| `/super-admin/security` | 1 | `src/app/super-admin/security/page.tsx` |
| `/super-admin/users` | 1 | `src/app/super-admin/users/page.tsx` |

## Pages avec mobile manuel déjà détecté

| Route | Tables | Fichier |
|---|---:|---|
| `/extensions` | 1 | `src/app/extensions/page.tsx` |
| `/extensions/activities` | 1 | `src/app/extensions/activities/page.tsx` |
| `/extensions/reports` | 1 | `src/app/extensions/reports/page.tsx` |

## Note

Cette phase ajoute une transformation mobile globale. Elle améliore rapidement toutes les tables sans modifier la logique des pages.
La prochaine phase pourra remplacer progressivement certaines pages par des cartes React sur mesure.
