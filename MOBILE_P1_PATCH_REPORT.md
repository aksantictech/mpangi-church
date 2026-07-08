# Patch mobile P1 — formulaires et pages lourdes

Date: 2026-07-08T20:53:33.596Z

| Fichier | Statut | Changements |
|---|---|---:|
| `src/app/patrimony/assets/[id]/edit/page.tsx` | patched | 8 |
| `src/app/patrimony/assets/new/page.tsx` | patched | 8 |
| `src/app/administration/minutes/[id]/edit/page.tsx` | patched | 7 |
| `src/app/administration/correspondence/new/page.tsx` | patched | 8 |
| `src/app/administration/minutes/new/page.tsx` | patched | 7 |
| `src/app/finance/expenses/new/page.tsx` | patched | 7 |
| `src/app/finance/offerings/new/page.tsx` | patched | 7 |
| `src/app/super-admin/churches/[id]/page.tsx` | patched | 16 |
| `src/app/administration/tasks/[id]/edit/page.tsx` | patched | 7 |
| `src/app/finance/reports/page.tsx` | patched | 10 |
| `src/app/administration/tasks/new/page.tsx` | patched | 7 |
| `src/app/departments/page.tsx` | patched | 6 |
| `src/app/events/page.tsx` | patched | 7 |
| `src/app/members/page.tsx` | patched | 6 |
| `src/app/patrimony/maintenance/new/page.tsx` | patched | 6 |

## Notes

- Un backup `.mobile-p1.bak` est créé pour chaque fichier modifié.
- Le patch est volontairement prudent : il améliore les espacements, titres et grilles sans casser la logique serveur.
- Après build, vérifier les pages P1 sur petit écran.
