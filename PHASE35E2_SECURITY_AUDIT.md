# Audit sécurité Phase 35E-2

## Layouts

| Route | Layout | Existe | Garde détectée | Modules |
|---|---|---:|---:|---|
| /members | src/app/members/layout.tsx | oui | oui | members |
| /attendance | src/app/attendance/layout.tsx | oui | oui | attendance |
| /souls | src/app/souls/layout.tsx | oui | oui | souls |
| /departments | src/app/departments/layout.tsx | oui | oui | departments |
| /events | src/app/events/layout.tsx | oui | oui | events |
| /public-requests | src/app/public-requests/layout.tsx | oui | oui | public_requests |
| /teachings | src/app/teachings/layout.tsx | oui | oui | teachings |
| /notifications | src/app/notifications/layout.tsx | oui | oui | notifications |
| /finance | src/app/finance/layout.tsx | oui | oui | finance_dashboard, offerings, expenses, budgets, finance_reports, donations |
| /patrimony | src/app/patrimony/layout.tsx | oui | oui | patrimony, assets, maintenance, movements |
| /administration | src/app/administration/layout.tsx | oui | oui | correspondence, inbox, transmissions, tasks, minutes |
| /extensions | src/app/extensions/layout.tsx | oui | oui | extensions |
| /settings/users | src/app/settings/users/layout.tsx | oui | oui | users |
| /settings/roles | src/app/settings/roles/layout.tsx | oui | oui | security |
| /dashboard/role | src/app/dashboard/role/layout.tsx | oui | oui | role_dashboard |
| /my-work | src/app/my-work/layout.tsx | oui | oui | my_work |

## Server Actions et Route Handlers sans garde détectée

- src/app/api/account/me/route.ts — route_handler — 1 export(s)
- src/app/api/bible/books/route.ts — route_handler — 1 export(s)
- src/app/api/bible/chapter/route.ts — route_handler — 1 export(s)
- src/app/api/bible/passage/route.ts — route_handler — 1 export(s)
- src/app/api/bible/search/route.ts — route_handler — 1 export(s)
- src/app/api/bible/versions/route.ts — route_handler — 1 export(s)
- src/app/api/dashboard/role/route.ts — route_handler — 1 export(s)
- src/app/api/documents/download/route.ts — route_handler — 1 export(s)
- src/app/api/modules/my-modules/route.ts — route_handler — 1 export(s)
- src/app/api/notifications/broadcast/route.ts — route_handler — 1 export(s)
- src/app/api/notifications/subscribe/route.ts — route_handler — 1 export(s)
- src/app/api/public/church-donations/route.ts — route_handler — 1 export(s)
- src/app/api/public/member-registration/route.ts — route_handler — 1 export(s)
- src/app/api/publications/route.ts — route_handler — 2 export(s)
- src/app/api/push/subscribe/route.ts — route_handler — 1 export(s)
- src/app/api/pwa/icon/route.ts — route_handler — 1 export(s)
- src/app/api/pwa/icon/[size]/route.ts — route_handler — 1 export(s)
- src/app/api/pwa/manifest/route.ts — route_handler — 1 export(s)
- src/app/api/pwa/tenant/route.ts — route_handler — 1 export(s)
- src/app/api/security/my-access/route.ts — route_handler — 1 export(s)
- src/app/api/security/navigation/route.ts — route_handler — 1 export(s)
- src/app/api/settings/live-stream/route.ts — route_handler — 1 export(s)
- src/app/api/settings/member-registration/route.ts — route_handler — 1 export(s)
- src/app/api/super-admin/church-modules/route.ts — route_handler — 2 export(s)
- src/app/api/super-admin/church-users/route.ts — route_handler — 1 export(s)
- src/app/api/super-admin/church-users/[profileId]/route.ts — route_handler — 1 export(s)
- src/app/api/super-admin/modules/toggle/route.ts — route_handler — 1 export(s)
- src/app/api/super-admin/onboarding/route.ts — route_handler — 2 export(s)
- src/app/api/super-admin/route.ts — route_handler — 1 export(s)
- src/app/api/super-admin/users/new/actions.ts — server_action — 1 export(s)
- src/app/church/[slug]/icon.png/route.ts — route_handler — 1 export(s)
- src/app/church/[slug]/manifest.webmanifest/route.ts — route_handler — 1 export(s)
- src/app/extensions/actions.ts — server_action — 4 export(s)
- src/app/manifest.json/route.ts — route_handler — 1 export(s)
- src/app/profile/actions.ts — server_action — 1 export(s)
- src/app/settings/donations/actions.ts — server_action — 1 export(s)
- src/app/super-admin/profile/actions.ts — server_action — 1 export(s)
- src/app/super-admin/users/new/actions.ts — server_action — 1 export(s)
- src/app/teachings/actions.ts — server_action — 4 export(s)
- src/app/transmissions/actions.ts — server_action — 2 export(s)

La détection est statique : une garde indirecte peut ne pas être reconnue.