# Mpangi-church — Audit mobile page par page

Date: 2026-07-08T21:03:13.711Z

## Résumé

- Pages analysées: 113
- Priorité P1: 22
- Priorité P2: 12
- Pages avec tables: 10
- Pages avec formulaires longs: 20

## Priorité P1 — à corriger d’abord

| Route | Fichier | Score | Problèmes détectés |
|---|---|---:|---|
| `/patrimony/assets/[id]/edit` | `src/app/patrimony/assets/[id]/edit/page.tsx` | 17 | complex_grid, long_form_mobile |
| `/patrimony/assets/new` | `src/app/patrimony/assets/new/page.tsx` | 16 | complex_grid, long_form_mobile |
| `/administration/minutes/[id]/edit` | `src/app/administration/minutes/[id]/edit/page.tsx` | 12 | long_form_mobile |
| `/administration/correspondence/new` | `src/app/administration/correspondence/new/page.tsx` | 11 | complex_grid, long_form_mobile |
| `/administration/minutes/new` | `src/app/administration/minutes/new/page.tsx` | 11 | long_form_mobile |
| `/super-admin/churches/[id]` | `src/app/super-admin/churches/[id]/page.tsx` | 11 | table_desktop, min_width_desktop, horizontal_scroll, complex_grid, fixed_width |
| `/finance/expenses/new` | `src/app/finance/expenses/new/page.tsx` | 10 | long_form_mobile |
| `/finance/offerings/new` | `src/app/finance/offerings/new/page.tsx` | 10 | long_form_mobile |
| `/administration/tasks/[id]/edit` | `src/app/administration/tasks/[id]/edit/page.tsx` | 8 | long_form_mobile |
| `/finance/reports` | `src/app/finance/reports/page.tsx` | 8 | table_desktop, min_width_desktop, horizontal_scroll, complex_grid, fixed_width |
| `/administration/tasks/new` | `src/app/administration/tasks/new/page.tsx` | 7 | long_form_mobile |
| `/departments` | `src/app/departments/page.tsx` | 7 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| `/events` | `src/app/events/page.tsx` | 7 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| `/members` | `src/app/members/page.tsx` | 7 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| `/patrimony/maintenance/new` | `src/app/patrimony/maintenance/new/page.tsx` | 7 | long_form_mobile |
| `/souls` | `src/app/souls/page.tsx` | 7 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| `/super-admin/security` | `src/app/super-admin/security/page.tsx` | 7 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| `/super-admin/users` | `src/app/super-admin/users/page.tsx` | 7 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| `/patrimony/movements/new` | `src/app/patrimony/movements/new/page.tsx` | 6 | long_form_mobile |
| `/administration/transmissions/[id]/edit` | `src/app/administration/transmissions/[id]/edit/page.tsx` | 5 | long_form_mobile |
| `/settings/users` | `src/app/settings/users/page.tsx` | 5 | min_width_desktop, complex_grid, fixed_width |
| `/finance/budgets/[id]/edit` | `src/app/finance/budgets/[id]/edit/page.tsx` | 4 | long_form_mobile |

## Pages avec tables

| Route | Fichier | Tables | min-w | overflow-x |
|---|---|---:|---:|---:|
| `/super-admin/churches/[id]` | `src/app/super-admin/churches/[id]/page.tsx` | 1 | 1 | 1 |
| `/finance/reports` | `src/app/finance/reports/page.tsx` | 1 | 1 | 1 |
| `/departments` | `src/app/departments/page.tsx` | 1 | 1 | 1 |
| `/events` | `src/app/events/page.tsx` | 1 | 1 | 1 |
| `/members` | `src/app/members/page.tsx` | 1 | 1 | 1 |
| `/souls` | `src/app/souls/page.tsx` | 1 | 1 | 1 |
| `/super-admin/security` | `src/app/super-admin/security/page.tsx` | 1 | 1 | 1 |
| `/super-admin/users` | `src/app/super-admin/users/page.tsx` | 1 | 1 | 1 |
| `/super-admin/dashboard` | `src/app/super-admin/dashboard/page.tsx` | 1 | 0 | 0 |
| `/settings/trainings` | `src/app/settings/trainings/page.tsx` | 1 | 0 | 0 |

## Pages avec formulaires longs

| Route | Fichier | Champs | Actions |
|---|---|---:|---:|
| `/patrimony/assets/[id]/edit` | `src/app/patrimony/assets/[id]/edit/page.tsx` | 22 | 3 |
| `/patrimony/assets/new` | `src/app/patrimony/assets/new/page.tsx` | 21 | 3 |
| `/administration/minutes/[id]/edit` | `src/app/administration/minutes/[id]/edit/page.tsx` | 18 | 3 |
| `/administration/correspondence/new` | `src/app/administration/correspondence/new/page.tsx` | 16 | 3 |
| `/administration/minutes/new` | `src/app/administration/minutes/new/page.tsx` | 17 | 3 |
| `/finance/expenses/new` | `src/app/finance/expenses/new/page.tsx` | 16 | 3 |
| `/finance/offerings/new` | `src/app/finance/offerings/new/page.tsx` | 16 | 3 |
| `/administration/tasks/[id]/edit` | `src/app/administration/tasks/[id]/edit/page.tsx` | 14 | 3 |
| `/administration/tasks/new` | `src/app/administration/tasks/new/page.tsx` | 13 | 3 |
| `/patrimony/maintenance/new` | `src/app/patrimony/maintenance/new/page.tsx` | 13 | 3 |
| `/patrimony/movements/new` | `src/app/patrimony/movements/new/page.tsx` | 12 | 3 |
| `/administration/transmissions/[id]/edit` | `src/app/administration/transmissions/[id]/edit/page.tsx` | 11 | 3 |
| `/finance/budgets/[id]/edit` | `src/app/finance/budgets/[id]/edit/page.tsx` | 10 | 3 |
| `/administration/tasks` | `src/app/administration/tasks/page.tsx` | 8 | 6 |
| `/administration/transmissions/new` | `src/app/administration/transmissions/new/page.tsx` | 9 | 3 |
| `/finance/budgets/new` | `src/app/finance/budgets/new/page.tsx` | 9 | 3 |
| `/finance/expenses` | `src/app/finance/expenses/page.tsx` | 8 | 5 |
| `/finance/offerings` | `src/app/finance/offerings/page.tsx` | 8 | 5 |
| `/inbox` | `src/app/inbox/page.tsx` | 8 | 8 |
| `/teachings/[id]/edit` | `src/app/teachings/[id]/edit/page.tsx` | 8 | 3 |

## Détail complet

| Priorité | Route | Fichier | Score | Tables | Forms | Grids | Widths | Issues |
|---|---|---|---:|---:|---:|---:|---:|---|
| P1 | `/patrimony/assets/[id]/edit` | `src/app/patrimony/assets/[id]/edit/page.tsx` | 17 | 0 | 22 | 3 | 0 | complex_grid, long_form_mobile |
| P1 | `/patrimony/assets/new` | `src/app/patrimony/assets/new/page.tsx` | 16 | 0 | 21 | 3 | 0 | complex_grid, long_form_mobile |
| P1 | `/administration/minutes/[id]/edit` | `src/app/administration/minutes/[id]/edit/page.tsx` | 12 | 0 | 18 | 2 | 0 | long_form_mobile |
| P1 | `/administration/correspondence/new` | `src/app/administration/correspondence/new/page.tsx` | 11 | 0 | 16 | 3 | 0 | complex_grid, long_form_mobile |
| P1 | `/administration/minutes/new` | `src/app/administration/minutes/new/page.tsx` | 11 | 0 | 17 | 2 | 0 | long_form_mobile |
| P1 | `/super-admin/churches/[id]` | `src/app/super-admin/churches/[id]/page.tsx` | 11 | 1 | 0 | 6 | 1 | table_desktop, min_width_desktop, horizontal_scroll, complex_grid, fixed_width |
| P1 | `/finance/expenses/new` | `src/app/finance/expenses/new/page.tsx` | 10 | 0 | 16 | 2 | 0 | long_form_mobile |
| P1 | `/finance/offerings/new` | `src/app/finance/offerings/new/page.tsx` | 10 | 0 | 16 | 2 | 0 | long_form_mobile |
| P1 | `/administration/tasks/[id]/edit` | `src/app/administration/tasks/[id]/edit/page.tsx` | 8 | 0 | 14 | 2 | 0 | long_form_mobile |
| P1 | `/finance/reports` | `src/app/finance/reports/page.tsx` | 8 | 1 | 4 | 3 | 1 | table_desktop, min_width_desktop, horizontal_scroll, complex_grid, fixed_width |
| P1 | `/administration/tasks/new` | `src/app/administration/tasks/new/page.tsx` | 7 | 0 | 13 | 2 | 0 | long_form_mobile |
| P1 | `/departments` | `src/app/departments/page.tsx` | 7 | 1 | 1 | 2 | 1 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| P1 | `/events` | `src/app/events/page.tsx` | 7 | 1 | 1 | 2 | 1 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| P1 | `/members` | `src/app/members/page.tsx` | 7 | 1 | 1 | 2 | 1 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| P1 | `/patrimony/maintenance/new` | `src/app/patrimony/maintenance/new/page.tsx` | 7 | 0 | 13 | 1 | 0 | long_form_mobile |
| P1 | `/souls` | `src/app/souls/page.tsx` | 7 | 1 | 1 | 2 | 1 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| P1 | `/super-admin/security` | `src/app/super-admin/security/page.tsx` | 7 | 1 | 0 | 1 | 1 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| P1 | `/super-admin/users` | `src/app/super-admin/users/page.tsx` | 7 | 1 | 0 | 1 | 1 | table_desktop, min_width_desktop, horizontal_scroll, fixed_width |
| P1 | `/patrimony/movements/new` | `src/app/patrimony/movements/new/page.tsx` | 6 | 0 | 12 | 2 | 0 | long_form_mobile |
| P1 | `/administration/transmissions/[id]/edit` | `src/app/administration/transmissions/[id]/edit/page.tsx` | 5 | 0 | 11 | 2 | 0 | long_form_mobile |
| P1 | `/settings/users` | `src/app/settings/users/page.tsx` | 5 | 0 | 5 | 3 | 1 | min_width_desktop, complex_grid, fixed_width |
| P1 | `/finance/budgets/[id]/edit` | `src/app/finance/budgets/[id]/edit/page.tsx` | 4 | 0 | 10 | 1 | 0 | long_form_mobile |
| P2 | `/` | `src/app/page.tsx` | 6 | 0 | 0 | 6 | 0 | complex_grid, large_title |
| P2 | `/public-requests` | `src/app/public-requests/page.tsx` | 5 | 0 | 0 | 3 | 1 | min_width_desktop, complex_grid, fixed_width |
| P2 | `/login` | `src/app/login/page.tsx` | 4 | 0 | 3 | 3 | 1 | complex_grid, fixed_width, large_title |
| P2 | `/super-admin/dashboard` | `src/app/super-admin/dashboard/page.tsx` | 4 | 1 | 0 | 3 | 0 | table_desktop, complex_grid |
| P2 | `/administration/tasks` | `src/app/administration/tasks/page.tsx` | 3 | 0 | 8 | 3 | 0 | complex_grid, long_form_mobile |
| P2 | `/administration/transmissions/new` | `src/app/administration/transmissions/new/page.tsx` | 3 | 0 | 9 | 2 | 0 | long_form_mobile |
| P2 | `/church/[slug]` | `src/app/church/[slug]/page.tsx` | 3 | 0 | 0 | 4 | 0 | complex_grid, large_title |
| P2 | `/finance/budgets/new` | `src/app/finance/budgets/new/page.tsx` | 3 | 0 | 9 | 1 | 0 | long_form_mobile |
| P2 | `/finance/expenses` | `src/app/finance/expenses/page.tsx` | 3 | 0 | 8 | 3 | 0 | complex_grid, long_form_mobile |
| P2 | `/finance/offerings` | `src/app/finance/offerings/page.tsx` | 3 | 0 | 8 | 3 | 0 | complex_grid, long_form_mobile |
| P2 | `/inbox` | `src/app/inbox/page.tsx` | 3 | 0 | 8 | 3 | 0 | horizontal_scroll, complex_grid, long_form_mobile |
| P2 | `/settings/trainings` | `src/app/settings/trainings/page.tsx` | 3 | 1 | 0 | 2 | 0 | table_desktop |
| P3 | `/administration/minutes` | `src/app/administration/minutes/page.tsx` | 2 | 0 | 7 | 3 | 0 | complex_grid |
| P3 | `/administration/transmissions` | `src/app/administration/transmissions/page.tsx` | 2 | 0 | 7 | 3 | 0 | complex_grid |
| P3 | `/finance/budgets` | `src/app/finance/budgets/page.tsx` | 2 | 0 | 7 | 3 | 0 | complex_grid |
| P3 | `/members/[id]` | `src/app/members/[id]/page.tsx` | 2 | 0 | 0 | 4 | 0 | complex_grid |
| P3 | `/settings/system-check` | `src/app/settings/system-check/page.tsx` | 2 | 0 | 0 | 4 | 0 | complex_grid |
| P3 | `/souls/[id]` | `src/app/souls/[id]/page.tsx` | 2 | 0 | 0 | 4 | 0 | complex_grid |
| P3 | `/super-admin/churches` | `src/app/super-admin/churches/page.tsx` | 2 | 0 | 1 | 4 | 0 | complex_grid |
| P3 | `/super-admin/modules` | `src/app/super-admin/modules/page.tsx` | 2 | 0 | 5 | 4 | 0 | complex_grid |
| P3 | `/teachings/[id]/edit` | `src/app/teachings/[id]/edit/page.tsx` | 2 | 0 | 8 | 1 | 0 | long_form_mobile |
| P3 | `/administration/correspondence` | `src/app/administration/correspondence/page.tsx` | 1 | 0 | 6 | 3 | 0 | complex_grid |
| P3 | `/administration/correspondence/[id]` | `src/app/administration/correspondence/[id]/page.tsx` | 1 | 0 | 2 | 3 | 0 | complex_grid |
| P3 | `/administration/inbox` | `src/app/administration/inbox/page.tsx` | 1 | 0 | 6 | 3 | 0 | horizontal_scroll, complex_grid |
| P3 | `/administration/tasks/[id]` | `src/app/administration/tasks/[id]/page.tsx` | 1 | 0 | 3 | 3 | 0 | complex_grid |
| P3 | `/administration/transmissions/[id]` | `src/app/administration/transmissions/[id]/page.tsx` | 1 | 0 | 3 | 3 | 0 | complex_grid |
| P3 | `/appointments` | `src/app/appointments/page.tsx` | 1 | 0 | 0 | 2 | 0 | large_title |
| P3 | `/attendance` | `src/app/attendance/page.tsx` | 1 | 0 | 0 | 3 | 0 | complex_grid |
| P3 | `/attendance/reports/[eventId]` | `src/app/attendance/reports/[eventId]/page.tsx` | 1 | 0 | 3 | 3 | 0 | complex_grid |
| P3 | `/church/[slug]/teachings` | `src/app/church/[slug]/teachings/page.tsx` | 1 | 0 | 0 | 2 | 0 | large_title |
| P3 | `/dashboard` | `src/app/dashboard/page.tsx` | 1 | 0 | 0 | 3 | 0 | complex_grid |
| P3 | `/events/[id]` | `src/app/events/[id]/page.tsx` | 1 | 0 | 0 | 3 | 0 | complex_grid |
| P3 | `/finance/budgets/[id]` | `src/app/finance/budgets/[id]/page.tsx` | 1 | 0 | 0 | 3 | 0 | complex_grid |
| P3 | `/finance/expenses/[id]` | `src/app/finance/expenses/[id]/page.tsx` | 1 | 0 | 3 | 3 | 0 | complex_grid |
| P3 | `/finance/offerings/[id]` | `src/app/finance/offerings/[id]/page.tsx` | 1 | 0 | 3 | 3 | 0 | complex_grid |
| P3 | `/finance` | `src/app/finance/page.tsx` | 1 | 0 | 2 | 3 | 0 | complex_grid |
| P3 | `/patrimony/assets` | `src/app/patrimony/assets/page.tsx` | 1 | 0 | 6 | 3 | 0 | complex_grid |
| P3 | `/patrimony/assets/[id]` | `src/app/patrimony/assets/[id]/page.tsx` | 1 | 0 | 0 | 3 | 0 | complex_grid |
| P3 | `/patrimony/maintenance` | `src/app/patrimony/maintenance/page.tsx` | 1 | 0 | 6 | 3 | 0 | complex_grid |
| P3 | `/patrimony/movements` | `src/app/patrimony/movements/page.tsx` | 1 | 0 | 5 | 3 | 0 | complex_grid |
| P3 | `/patrimony` | `src/app/patrimony/page.tsx` | 1 | 0 | 0 | 3 | 0 | complex_grid |
| P3 | `/publications` | `src/app/publications/page.tsx` | 1 | 0 | 0 | 1 | 0 | large_title |
| P3 | `/teachings/new` | `src/app/teachings/new/page.tsx` | 1 | 0 | 7 | 1 | 0 | - |
| P3 | `/teachings` | `src/app/teachings/page.tsx` | 1 | 0 | 4 | 3 | 0 | complex_grid |
| P3 | `/testimonies` | `src/app/testimonies/page.tsx` | 1 | 0 | 0 | 1 | 0 | large_title |
| P3 | `/account/profile` | `src/app/account/profile/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/account/security` | `src/app/account/security/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/administration/minutes/[id]` | `src/app/administration/minutes/[id]/page.tsx` | 0 | 0 | 2 | 2 | 0 | - |
| P3 | `/attendance/scanner` | `src/app/attendance/scanner/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/attendance/scanner/[eventId]` | `src/app/attendance/scanner/[eventId]/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/church/[slug]/appointment` | `src/app/church/[slug]/appointment/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/church/[slug]/install` | `src/app/church/[slug]/install/page.tsx` | 0 | 0 | 0 | 1 | 0 | - |
| P3 | `/church/[slug]/join` | `src/app/church/[slug]/join/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/church/[slug]/member-registration` | `src/app/church/[slug]/member-registration/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/church/[slug]/prayer` | `src/app/church/[slug]/prayer/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/church/[slug]/teachings/[id]` | `src/app/church/[slug]/teachings/[id]/page.tsx` | 0 | 0 | 0 | 1 | 0 | - |
| P3 | `/church/[slug]/testimony` | `src/app/church/[slug]/testimony/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/departments/new` | `src/app/departments/new/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/departments/[id]/edit` | `src/app/departments/[id]/edit/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/departments/[id]` | `src/app/departments/[id]/page.tsx` | 0 | 0 | 0 | 2 | 0 | - |
| P3 | `/events/new` | `src/app/events/new/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/events/[id]/edit` | `src/app/events/[id]/edit/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/install` | `src/app/install/page.tsx` | 0 | 0 | 0 | 1 | 0 | - |
| P3 | `/members/new` | `src/app/members/new/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/members/[id]/card` | `src/app/members/[id]/card/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/members/[id]/departments` | `src/app/members/[id]/departments/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/members/[id]/edit` | `src/app/members/[id]/edit/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/members/[id]/photo` | `src/app/members/[id]/photo/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/members/[id]/qr` | `src/app/members/[id]/qr/page.tsx` | 0 | 0 | 0 | 1 | 0 | - |
| P3 | `/members/[id]/trainings` | `src/app/members/[id]/trainings/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/mobile-menu` | `src/app/mobile-menu/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/notifications` | `src/app/notifications/page.tsx` | 0 | 0 | 3 | 2 | 0 | - |
| P3 | `/offline` | `src/app/offline/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/settings/live-stream` | `src/app/settings/live-stream/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/settings/member-registration` | `src/app/settings/member-registration/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/settings` | `src/app/settings/page.tsx` | 0 | 0 | 0 | 1 | 0 | - |
| P3 | `/settings/public-page` | `src/app/settings/public-page/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/settings/trainings/[id]/edit` | `src/app/settings/trainings/[id]/edit/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/settings/trainings/[id]` | `src/app/settings/trainings/[id]/page.tsx` | 0 | 0 | 0 | 2 | 0 | - |
| P3 | `/settings/users/new` | `src/app/settings/users/new/page.tsx` | 0 | 0 | 5 | 1 | 0 | - |
| P3 | `/souls/new` | `src/app/souls/new/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/souls/[id]/edit` | `src/app/souls/[id]/edit/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/super-admin/churches/new` | `src/app/super-admin/churches/new/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/super-admin/churches/[id]/edit` | `src/app/super-admin/churches/[id]/edit/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/super-admin/churches/[id]/users/new` | `src/app/super-admin/churches/[id]/users/new/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/super-admin/mobile-checklist` | `src/app/super-admin/mobile-checklist/page.tsx` | 0 | 0 | 0 | 2 | 0 | - |
| P3 | `/super-admin` | `src/app/super-admin/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |
| P3 | `/super-admin/settings` | `src/app/super-admin/settings/page.tsx` | 0 | 0 | 0 | 2 | 0 | - |
| P3 | `/super-admin/users/new` | `src/app/super-admin/users/new/page.tsx` | 0 | 0 | 6 | 1 | 0 | - |
| P3 | `/teachings/[id]` | `src/app/teachings/[id]/page.tsx` | 0 | 0 | 2 | 0 | 0 | - |
| P3 | `/unauthorized` | `src/app/unauthorized/page.tsx` | 0 | 0 | 0 | 0 | 0 | - |

## Règles de correction mobile

1. Transformer les tables critiques en cartes mobiles, garder la table seulement à partir de `md` ou `lg`.
2. Réduire les titres `text-4xl` en `text-2xl sm:text-3xl` sur mobile.
3. Remplacer les actions nombreuses par une barre sticky ou un menu d’actions.
4. Découper les formulaires longs en sections pliables.
5. Limiter les `min-w-[...]` aux vues desktop : `hidden md:block` ou `md:min-w-[...]`.
