# Mpangi-church — Audit sécurité des routes

Date: 2026-07-08T18:17:50.286Z

## Résumé

- Fichiers analysés: 145
- Routes à vérifier: 70
- Imports createAdminClient dans fichiers client: 0

## Routes à corriger en priorité

| Fichier | Route | Protection attendue | Module attendu |
|---|---|---|---|
| `src/app/account/profile/page.tsx` | `/account/profile` | `à définir` | `-` |
| `src/app/account/security/page.tsx` | `/account/security` | `à définir` | `-` |
| `src/app/administration/inbox/page.tsx` | `/administration/inbox` | `requireChurchModuleAccess` | `document_transmissions` |
| `src/app/appointments/page.tsx` | `/appointments` | `requireChurchModuleAccess` | `appointments` |
| `src/app/attendance/page.tsx` | `/attendance` | `requireChurchModuleAccess` | `attendance` |
| `src/app/attendance/reports/[eventId]/page.tsx` | `/attendance/reports/[eventId]` | `requireChurchModuleAccess` | `attendance` |
| `src/app/attendance/scanner/page.tsx` | `/attendance/scanner` | `requireChurchModuleAccess` | `attendance` |
| `src/app/attendance/scanner/[eventId]/page.tsx` | `/attendance/scanner/[eventId]` | `requireChurchModuleAccess` | `attendance` |
| `src/app/dashboard/page.tsx` | `/dashboard` | `requireChurchModuleAccess` | `dashboard` |
| `src/app/departments/new/page.tsx` | `/departments/new` | `requireChurchModuleAccess` | `departments` |
| `src/app/departments/page.tsx` | `/departments` | `requireChurchModuleAccess` | `departments` |
| `src/app/departments/[id]/edit/page.tsx` | `/departments/[id]/edit` | `requireChurchModuleAccess` | `departments` |
| `src/app/departments/[id]/page.tsx` | `/departments/[id]` | `requireChurchModuleAccess` | `departments` |
| `src/app/events/new/page.tsx` | `/events/new` | `requireChurchModuleAccess` | `events` |
| `src/app/events/page.tsx` | `/events` | `requireChurchModuleAccess` | `events` |
| `src/app/events/[id]/edit/page.tsx` | `/events/[id]/edit` | `requireChurchModuleAccess` | `events` |
| `src/app/events/[id]/page.tsx` | `/events/[id]` | `requireChurchModuleAccess` | `events` |
| `src/app/finance/actions.ts` | `/finance` | `requireChurchModuleAccess` | `finance_dashboard` |
| `src/app/finance/expenses/new/page.tsx` | `/finance/expenses/new` | `requireChurchModuleAccess` | `expenses` |
| `src/app/finance/expenses/page.tsx` | `/finance/expenses` | `requireChurchModuleAccess` | `expenses` |
| `src/app/finance/expenses/[id]/page.tsx` | `/finance/expenses/[id]` | `requireChurchModuleAccess` | `expenses` |
| `src/app/finance/offerings/new/page.tsx` | `/finance/offerings/new` | `requireChurchModuleAccess` | `offerings` |
| `src/app/finance/offerings/page.tsx` | `/finance/offerings` | `requireChurchModuleAccess` | `offerings` |
| `src/app/finance/offerings/[id]/page.tsx` | `/finance/offerings/[id]` | `requireChurchModuleAccess` | `offerings` |
| `src/app/inbox/page.tsx` | `/inbox` | `à définir` | `-` |
| `src/app/members/new/page.tsx` | `/members/new` | `requireChurchModuleAccess` | `members` |
| `src/app/members/page.tsx` | `/members` | `requireChurchModuleAccess` | `members` |
| `src/app/members/[id]/card/page.tsx` | `/members/[id]/card` | `requireChurchModuleAccess` | `members` |
| `src/app/members/[id]/departments/page.tsx` | `/members/[id]/departments` | `requireChurchModuleAccess` | `members` |
| `src/app/members/[id]/edit/page.tsx` | `/members/[id]/edit` | `requireChurchModuleAccess` | `members` |
| `src/app/members/[id]/page.tsx` | `/members/[id]` | `requireChurchModuleAccess` | `members` |
| `src/app/members/[id]/photo/page.tsx` | `/members/[id]/photo` | `requireChurchModuleAccess` | `members` |
| `src/app/members/[id]/qr/page.tsx` | `/members/[id]/qr` | `requireChurchModuleAccess` | `members` |
| `src/app/members/[id]/trainings/page.tsx` | `/members/[id]/trainings` | `requireChurchModuleAccess` | `members` |
| `src/app/mobile-menu/page.tsx` | `/mobile-menu` | `à définir` | `-` |
| `src/app/notifications/page.tsx` | `/notifications` | `requireChurchModuleAccess` | `notifications` |
| `src/app/offline/page.tsx` | `/offline` | `à définir` | `-` |
| `src/app/page.tsx` | `/page.tsx` | `à définir` | `-` |
| `src/app/patrimony/actions.ts` | `/patrimony` | `requireChurchModuleAccess` | `patrimony_dashboard` |
| `src/app/public-requests/page.tsx` | `/public-requests` | `requireChurchModuleAccess` | `public_requests` |
| `src/app/publications/page.tsx` | `/publications` | `requireChurchModuleAccess` | `publications` |
| `src/app/settings/live-stream/page.tsx` | `/settings/live-stream` | `requireChurchModuleAccess` | `settings` |
| `src/app/settings/member-registration/page.tsx` | `/settings/member-registration` | `requireChurchModuleAccess` | `settings` |
| `src/app/settings/page.tsx` | `/settings` | `requireChurchModuleAccess` | `settings` |
| `src/app/settings/public-page/page.tsx` | `/settings/public-page` | `requireChurchModuleAccess` | `settings` |
| `src/app/settings/system-check/page.tsx` | `/settings/system-check` | `requireChurchModuleAccess` | `settings` |
| `src/app/settings/trainings/page.tsx` | `/settings/trainings` | `requireChurchModuleAccess` | `settings` |
| `src/app/settings/trainings/[id]/edit/page.tsx` | `/settings/trainings/[id]/edit` | `requireChurchModuleAccess` | `settings` |
| `src/app/settings/trainings/[id]/page.tsx` | `/settings/trainings/[id]` | `requireChurchModuleAccess` | `settings` |
| `src/app/settings/users/new/actions.ts` | `/settings/users/new` | `requireChurchAdmin` | `-` |
| `src/app/settings/users/new/page.tsx` | `/settings/users/new` | `requireChurchAdmin` | `-` |
| `src/app/settings/users/page.tsx` | `/settings/users` | `requireChurchAdmin` | `-` |
| `src/app/souls/new/page.tsx` | `/souls/new` | `requireChurchModuleAccess` | `souls` |
| `src/app/souls/page.tsx` | `/souls` | `requireChurchModuleAccess` | `souls` |
| `src/app/souls/[id]/edit/page.tsx` | `/souls/[id]/edit` | `requireChurchModuleAccess` | `souls` |
| `src/app/souls/[id]/page.tsx` | `/souls/[id]` | `requireChurchModuleAccess` | `souls` |
| `src/app/super-admin/churches/new/page.tsx` | `/super-admin/churches/new` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/churches/page.tsx` | `/super-admin/churches` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/churches/[id]/edit/page.tsx` | `/super-admin/churches/[id]/edit` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/churches/[id]/page.tsx` | `/super-admin/churches/[id]` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/churches/[id]/users/new/page.tsx` | `/super-admin/churches/[id]/users/new` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/dashboard/page.tsx` | `/super-admin/dashboard` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/modules/page.tsx` | `/super-admin/modules` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/page.tsx` | `/super-admin` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/users/new/actions.ts` | `/super-admin/users/new` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/users/new/page.tsx` | `/super-admin/users/new` | `requireSuperAdmin` | `-` |
| `src/app/super-admin/users/page.tsx` | `/super-admin/users` | `requireSuperAdmin` | `-` |
| `src/app/teachings/new/page.tsx` | `/teachings/new` | `requireChurchModuleAccess` | `teachings` |
| `src/app/testimonies/page.tsx` | `/testimonies` | `requireChurchModuleAccess` | `testimonies` |
| `src/app/transmissions/actions.ts` | `/transmissions` | `à définir` | `-` |

## Risques service role côté client

Aucun import `createAdminClient` détecté dans un fichier `use client`.

## Détail complet

| Statut | Fichier | Route | Type | Helper | Module |
|---|---|---|---|---|---|
| À CORRIGER | `src/app/account/profile/page.tsx` | `/account/profile` | unknown | `-` | `-` |
| À CORRIGER | `src/app/account/security/page.tsx` | `/account/security` | unknown | `-` | `-` |
| OK | `src/app/administration/correspondence/actions.ts` | `/administration/correspondence` | church_module | `requireChurchModuleAccess` | `correspondence` |
| OK | `src/app/administration/correspondence/new/page.tsx` | `/administration/correspondence/new` | church_module | `requireChurchModuleAccess` | `correspondence` |
| OK | `src/app/administration/correspondence/page.tsx` | `/administration/correspondence` | church_module | `requireChurchModuleAccess` | `correspondence` |
| OK | `src/app/administration/correspondence/[id]/page.tsx` | `/administration/correspondence/[id]` | church_module | `requireChurchModuleAccess` | `correspondence` |
| À CORRIGER | `src/app/administration/inbox/page.tsx` | `/administration/inbox` | church_module | `requireChurchModuleAccess` | `document_transmissions` |
| OK | `src/app/administration/minutes/actions.ts` | `/administration/minutes` | church_module | `requireChurchModuleAccess` | `meetings_minutes` |
| OK | `src/app/administration/minutes/new/page.tsx` | `/administration/minutes/new` | church_module | `requireChurchModuleAccess` | `meetings_minutes` |
| OK | `src/app/administration/minutes/page.tsx` | `/administration/minutes` | church_module | `requireChurchModuleAccess` | `meetings_minutes` |
| OK | `src/app/administration/minutes/[id]/edit/page.tsx` | `/administration/minutes/[id]/edit` | church_module | `requireChurchModuleAccess` | `meetings_minutes` |
| OK | `src/app/administration/minutes/[id]/page.tsx` | `/administration/minutes/[id]` | church_module | `requireChurchModuleAccess` | `meetings_minutes` |
| OK | `src/app/administration/tasks/actions.ts` | `/administration/tasks` | church_module | `requireChurchModuleAccess` | `administrative_tasks` |
| OK | `src/app/administration/tasks/new/page.tsx` | `/administration/tasks/new` | church_module | `requireChurchModuleAccess` | `administrative_tasks` |
| OK | `src/app/administration/tasks/page.tsx` | `/administration/tasks` | church_module | `requireChurchModuleAccess` | `administrative_tasks` |
| OK | `src/app/administration/tasks/[id]/edit/page.tsx` | `/administration/tasks/[id]/edit` | church_module | `requireChurchModuleAccess` | `administrative_tasks` |
| OK | `src/app/administration/tasks/[id]/page.tsx` | `/administration/tasks/[id]` | church_module | `requireChurchModuleAccess` | `administrative_tasks` |
| OK | `src/app/administration/transmissions/actions.ts` | `/administration/transmissions` | church_module | `requireChurchModuleAccess` | `document_transmissions` |
| OK | `src/app/administration/transmissions/new/page.tsx` | `/administration/transmissions/new` | church_module | `requireChurchModuleAccess` | `document_transmissions` |
| OK | `src/app/administration/transmissions/page.tsx` | `/administration/transmissions` | church_module | `requireChurchModuleAccess` | `document_transmissions` |
| OK | `src/app/administration/transmissions/[id]/edit/page.tsx` | `/administration/transmissions/[id]/edit` | church_module | `requireChurchModuleAccess` | `document_transmissions` |
| OK | `src/app/administration/transmissions/[id]/page.tsx` | `/administration/transmissions/[id]` | church_module | `requireChurchModuleAccess` | `document_transmissions` |
| PUBLIC | `src/app/api/attendance/event-presence/route.ts` | `/api/attendance/event-presence` | public | `-` | `-` |
| PUBLIC | `src/app/api/attendance/export/route.ts` | `/api/attendance/export` | public | `-` | `-` |
| PUBLIC | `src/app/api/attendance/scan/route.ts` | `/api/attendance/scan` | public | `-` | `-` |
| PUBLIC | `src/app/api/documents/download/route.ts` | `/api/documents/download` | public | `-` | `-` |
| PUBLIC | `src/app/api/finance/reports/export/route.ts` | `/api/finance/reports/export` | public | `-` | `-` |
| PUBLIC | `src/app/api/members/actions/route.ts` | `/api/members/actions` | public | `-` | `-` |
| PUBLIC | `src/app/api/modules/my-modules/route.ts` | `/api/modules/my-modules` | public | `-` | `-` |
| PUBLIC | `src/app/api/notifications/broadcast/route.ts` | `/api/notifications/broadcast` | public | `-` | `-` |
| PUBLIC | `src/app/api/notifications/subscribe/route.ts` | `/api/notifications/subscribe` | public | `-` | `-` |
| PUBLIC | `src/app/api/public/member-registration/route.ts` | `/api/public/member-registration` | public | `-` | `-` |
| PUBLIC | `src/app/api/publications/route.ts` | `/api/publications` | public | `-` | `-` |
| PUBLIC | `src/app/api/push/subscribe/route.ts` | `/api/push/subscribe` | public | `-` | `-` |
| PUBLIC | `src/app/api/security/my-access/route.ts` | `/api/security/my-access` | public | `-` | `-` |
| PUBLIC | `src/app/api/settings/live-stream/route.ts` | `/api/settings/live-stream` | public | `-` | `-` |
| PUBLIC | `src/app/api/settings/member-registration/route.ts` | `/api/settings/member-registration` | public | `-` | `-` |
| PUBLIC | `src/app/api/souls/[id]/convert-to-member/route.ts` | `/api/souls/[id]/convert-to-member` | public | `-` | `-` |
| PUBLIC | `src/app/api/super-admin/church-users/route.ts` | `/api/super-admin/church-users` | public | `-` | `-` |
| PUBLIC | `src/app/api/super-admin/church-users/[profileId]/route.ts` | `/api/super-admin/church-users/[profileId]` | public | `-` | `-` |
| PUBLIC | `src/app/api/super-admin/modules/toggle/route.ts` | `/api/super-admin/modules/toggle` | public | `-` | `-` |
| PUBLIC | `src/app/api/super-admin/route.ts` | `/api/super-admin` | public | `-` | `-` |
| À CORRIGER | `src/app/appointments/page.tsx` | `/appointments` | church_module | `requireChurchModuleAccess` | `appointments` |
| À CORRIGER | `src/app/attendance/page.tsx` | `/attendance` | church_module | `requireChurchModuleAccess` | `attendance` |
| À CORRIGER | `src/app/attendance/reports/[eventId]/page.tsx` | `/attendance/reports/[eventId]` | church_module | `requireChurchModuleAccess` | `attendance` |
| À CORRIGER | `src/app/attendance/scanner/page.tsx` | `/attendance/scanner` | church_module | `requireChurchModuleAccess` | `attendance` |
| À CORRIGER | `src/app/attendance/scanner/[eventId]/page.tsx` | `/attendance/scanner/[eventId]` | church_module | `requireChurchModuleAccess` | `attendance` |
| PUBLIC | `src/app/church/[slug]/appointment/page.tsx` | `/church/[slug]/appointment` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/icon.png/route.ts` | `/church/[slug]/icon.png` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/install/page.tsx` | `/church/[slug]/install` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/join/page.tsx` | `/church/[slug]/join` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/manifest.webmanifest/route.ts` | `/church/[slug]/manifest.webmanifest` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/member-registration/page.tsx` | `/church/[slug]/member-registration` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/page.tsx` | `/church/[slug]` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/prayer/page.tsx` | `/church/[slug]/prayer` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/teachings/page.tsx` | `/church/[slug]/teachings` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/teachings/[id]/page.tsx` | `/church/[slug]/teachings/[id]` | public | `-` | `-` |
| PUBLIC | `src/app/church/[slug]/testimony/page.tsx` | `/church/[slug]/testimony` | public | `-` | `-` |
| À CORRIGER | `src/app/dashboard/page.tsx` | `/dashboard` | church_module | `requireChurchModuleAccess` | `dashboard` |
| À CORRIGER | `src/app/departments/new/page.tsx` | `/departments/new` | church_module | `requireChurchModuleAccess` | `departments` |
| À CORRIGER | `src/app/departments/page.tsx` | `/departments` | church_module | `requireChurchModuleAccess` | `departments` |
| À CORRIGER | `src/app/departments/[id]/edit/page.tsx` | `/departments/[id]/edit` | church_module | `requireChurchModuleAccess` | `departments` |
| À CORRIGER | `src/app/departments/[id]/page.tsx` | `/departments/[id]` | church_module | `requireChurchModuleAccess` | `departments` |
| À CORRIGER | `src/app/events/new/page.tsx` | `/events/new` | church_module | `requireChurchModuleAccess` | `events` |
| À CORRIGER | `src/app/events/page.tsx` | `/events` | church_module | `requireChurchModuleAccess` | `events` |
| À CORRIGER | `src/app/events/[id]/edit/page.tsx` | `/events/[id]/edit` | church_module | `requireChurchModuleAccess` | `events` |
| À CORRIGER | `src/app/events/[id]/page.tsx` | `/events/[id]` | church_module | `requireChurchModuleAccess` | `events` |
| À CORRIGER | `src/app/finance/actions.ts` | `/finance` | church_module | `requireChurchModuleAccess` | `finance_dashboard` |
| OK | `src/app/finance/budgets/actions.ts` | `/finance/budgets` | church_module | `requireChurchModuleAccess` | `budgets` |
| OK | `src/app/finance/budgets/new/page.tsx` | `/finance/budgets/new` | church_module | `requireChurchModuleAccess` | `budgets` |
| OK | `src/app/finance/budgets/page.tsx` | `/finance/budgets` | church_module | `requireChurchModuleAccess` | `budgets` |
| OK | `src/app/finance/budgets/[id]/edit/page.tsx` | `/finance/budgets/[id]/edit` | church_module | `requireChurchModuleAccess` | `budgets` |
| OK | `src/app/finance/budgets/[id]/page.tsx` | `/finance/budgets/[id]` | church_module | `requireChurchModuleAccess` | `budgets` |
| À CORRIGER | `src/app/finance/expenses/new/page.tsx` | `/finance/expenses/new` | church_module | `requireChurchModuleAccess` | `expenses` |
| À CORRIGER | `src/app/finance/expenses/page.tsx` | `/finance/expenses` | church_module | `requireChurchModuleAccess` | `expenses` |
| À CORRIGER | `src/app/finance/expenses/[id]/page.tsx` | `/finance/expenses/[id]` | church_module | `requireChurchModuleAccess` | `expenses` |
| À CORRIGER | `src/app/finance/offerings/new/page.tsx` | `/finance/offerings/new` | church_module | `requireChurchModuleAccess` | `offerings` |
| À CORRIGER | `src/app/finance/offerings/page.tsx` | `/finance/offerings` | church_module | `requireChurchModuleAccess` | `offerings` |
| À CORRIGER | `src/app/finance/offerings/[id]/page.tsx` | `/finance/offerings/[id]` | church_module | `requireChurchModuleAccess` | `offerings` |
| OK | `src/app/finance/page.tsx` | `/finance` | church_module | `requireChurchModuleAccess` | `finance_dashboard` |
| OK | `src/app/finance/reports/page.tsx` | `/finance/reports` | church_module | `requireChurchModuleAccess` | `financial_reports` |
| À CORRIGER | `src/app/inbox/page.tsx` | `/inbox` | unknown | `-` | `-` |
| PUBLIC | `src/app/install/page.tsx` | `/install` | public | `-` | `-` |
| PUBLIC | `src/app/login/page.tsx` | `/login` | public | `-` | `-` |
| À CORRIGER | `src/app/members/new/page.tsx` | `/members/new` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/members/page.tsx` | `/members` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/members/[id]/card/page.tsx` | `/members/[id]/card` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/members/[id]/departments/page.tsx` | `/members/[id]/departments` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/members/[id]/edit/page.tsx` | `/members/[id]/edit` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/members/[id]/page.tsx` | `/members/[id]` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/members/[id]/photo/page.tsx` | `/members/[id]/photo` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/members/[id]/qr/page.tsx` | `/members/[id]/qr` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/members/[id]/trainings/page.tsx` | `/members/[id]/trainings` | church_module | `requireChurchModuleAccess` | `members` |
| À CORRIGER | `src/app/mobile-menu/page.tsx` | `/mobile-menu` | unknown | `-` | `-` |
| À CORRIGER | `src/app/notifications/page.tsx` | `/notifications` | church_module | `requireChurchModuleAccess` | `notifications` |
| À CORRIGER | `src/app/offline/page.tsx` | `/offline` | unknown | `-` | `-` |
| À CORRIGER | `src/app/page.tsx` | `/page.tsx` | unknown | `-` | `-` |
| À CORRIGER | `src/app/patrimony/actions.ts` | `/patrimony` | church_module | `requireChurchModuleAccess` | `patrimony_dashboard` |
| OK | `src/app/patrimony/assets/new/page.tsx` | `/patrimony/assets/new` | church_module | `requireChurchModuleAccess` | `assets` |
| OK | `src/app/patrimony/assets/page.tsx` | `/patrimony/assets` | church_module | `requireChurchModuleAccess` | `assets` |
| OK | `src/app/patrimony/assets/[id]/edit/page.tsx` | `/patrimony/assets/[id]/edit` | church_module | `requireChurchModuleAccess` | `assets` |
| OK | `src/app/patrimony/assets/[id]/page.tsx` | `/patrimony/assets/[id]` | church_module | `requireChurchModuleAccess` | `assets` |
| OK | `src/app/patrimony/maintenance/new/page.tsx` | `/patrimony/maintenance/new` | church_module | `requireChurchModuleAccess` | `asset_maintenance` |
| OK | `src/app/patrimony/maintenance/page.tsx` | `/patrimony/maintenance` | church_module | `requireChurchModuleAccess` | `asset_maintenance` |
| OK | `src/app/patrimony/movements/new/page.tsx` | `/patrimony/movements/new` | church_module | `requireChurchModuleAccess` | `asset_movements` |
| OK | `src/app/patrimony/movements/page.tsx` | `/patrimony/movements` | church_module | `requireChurchModuleAccess` | `asset_movements` |
| OK | `src/app/patrimony/page.tsx` | `/patrimony` | church_module | `requireChurchModuleAccess` | `patrimony_dashboard` |
| À CORRIGER | `src/app/public-requests/page.tsx` | `/public-requests` | church_module | `requireChurchModuleAccess` | `public_requests` |
| À CORRIGER | `src/app/publications/page.tsx` | `/publications` | church_module | `requireChurchModuleAccess` | `publications` |
| À CORRIGER | `src/app/settings/live-stream/page.tsx` | `/settings/live-stream` | church_module | `requireChurchModuleAccess` | `settings` |
| À CORRIGER | `src/app/settings/member-registration/page.tsx` | `/settings/member-registration` | church_module | `requireChurchModuleAccess` | `settings` |
| À CORRIGER | `src/app/settings/page.tsx` | `/settings` | church_module | `requireChurchModuleAccess` | `settings` |
| À CORRIGER | `src/app/settings/public-page/page.tsx` | `/settings/public-page` | church_module | `requireChurchModuleAccess` | `settings` |
| À CORRIGER | `src/app/settings/system-check/page.tsx` | `/settings/system-check` | church_module | `requireChurchModuleAccess` | `settings` |
| À CORRIGER | `src/app/settings/trainings/page.tsx` | `/settings/trainings` | church_module | `requireChurchModuleAccess` | `settings` |
| À CORRIGER | `src/app/settings/trainings/[id]/edit/page.tsx` | `/settings/trainings/[id]/edit` | church_module | `requireChurchModuleAccess` | `settings` |
| À CORRIGER | `src/app/settings/trainings/[id]/page.tsx` | `/settings/trainings/[id]` | church_module | `requireChurchModuleAccess` | `settings` |
| À CORRIGER | `src/app/settings/users/new/actions.ts` | `/settings/users/new` | church_admin | `requireChurchAdmin` | `-` |
| À CORRIGER | `src/app/settings/users/new/page.tsx` | `/settings/users/new` | church_admin | `requireChurchAdmin` | `-` |
| À CORRIGER | `src/app/settings/users/page.tsx` | `/settings/users` | church_admin | `requireChurchAdmin` | `-` |
| À CORRIGER | `src/app/souls/new/page.tsx` | `/souls/new` | church_module | `requireChurchModuleAccess` | `souls` |
| À CORRIGER | `src/app/souls/page.tsx` | `/souls` | church_module | `requireChurchModuleAccess` | `souls` |
| À CORRIGER | `src/app/souls/[id]/edit/page.tsx` | `/souls/[id]/edit` | church_module | `requireChurchModuleAccess` | `souls` |
| À CORRIGER | `src/app/souls/[id]/page.tsx` | `/souls/[id]` | church_module | `requireChurchModuleAccess` | `souls` |
| À CORRIGER | `src/app/super-admin/churches/new/page.tsx` | `/super-admin/churches/new` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/churches/page.tsx` | `/super-admin/churches` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/churches/[id]/edit/page.tsx` | `/super-admin/churches/[id]/edit` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/churches/[id]/page.tsx` | `/super-admin/churches/[id]` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/churches/[id]/users/new/page.tsx` | `/super-admin/churches/[id]/users/new` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/dashboard/page.tsx` | `/super-admin/dashboard` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/modules/page.tsx` | `/super-admin/modules` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/page.tsx` | `/super-admin` | super_admin | `requireSuperAdmin` | `-` |
| OK | `src/app/super-admin/security/page.tsx` | `/super-admin/security` | super_admin | `requireSuperAdmin` | `-` |
| OK | `src/app/super-admin/settings/page.tsx` | `/super-admin/settings` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/users/new/actions.ts` | `/super-admin/users/new` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/users/new/page.tsx` | `/super-admin/users/new` | super_admin | `requireSuperAdmin` | `-` |
| À CORRIGER | `src/app/super-admin/users/page.tsx` | `/super-admin/users` | super_admin | `requireSuperAdmin` | `-` |
| OK | `src/app/teachings/actions.ts` | `/teachings` | church_module | `requireChurchModuleAccess` | `teachings` |
| À CORRIGER | `src/app/teachings/new/page.tsx` | `/teachings/new` | church_module | `requireChurchModuleAccess` | `teachings` |
| OK | `src/app/teachings/page.tsx` | `/teachings` | church_module | `requireChurchModuleAccess` | `teachings` |
| OK | `src/app/teachings/[id]/edit/page.tsx` | `/teachings/[id]/edit` | church_module | `requireChurchModuleAccess` | `teachings` |
| OK | `src/app/teachings/[id]/page.tsx` | `/teachings/[id]` | church_module | `requireChurchModuleAccess` | `teachings` |
| À CORRIGER | `src/app/testimonies/page.tsx` | `/testimonies` | church_module | `requireChurchModuleAccess` | `testimonies` |
| À CORRIGER | `src/app/transmissions/actions.ts` | `/transmissions` | unknown | `-` | `-` |
| PUBLIC | `src/app/unauthorized/page.tsx` | `/unauthorized` | public | `-` | `-` |

## Exemples de correction

```ts
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

await requireChurchModuleAccess("expenses");
await requireChurchModuleAccess("expenses", "can_create");
```
