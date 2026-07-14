# Priorités Phase 35E-2B

Layouts sans garde : 1
Actions/routes sans garde détectée : 56

## Layouts à corriger

- src/app/extensions/layout.tsx — route /extensions — modules : extensions

## Priorité 1 — données sensibles

- src/app/api/finance/reports/export/route.ts
- src/app/api/members/actions/route.ts
- src/app/api/settings/users/new/actions.ts
- src/app/finance/actions.ts
- src/app/finance/budgets/actions.ts
- src/app/finance/donations/actions.ts
- src/app/patrimony/actions.ts
- src/app/settings/users/new/actions.ts

## Priorité 2 — opérations métier

- src/app/administration/correspondence/actions.ts
- src/app/administration/minutes/actions.ts
- src/app/administration/tasks/actions.ts
- src/app/administration/transmissions/actions.ts
- src/app/api/attendance/event-presence/route.ts
- src/app/api/attendance/export/route.ts
- src/app/api/attendance/scan/route.ts
- src/app/api/souls/[id]/convert-to-member/route.ts

## Priorité 3 — autres fichiers

- src/app/api/account/me/route.ts
- src/app/api/bible/books/route.ts
- src/app/api/bible/chapter/route.ts
- src/app/api/bible/passage/route.ts
- src/app/api/bible/search/route.ts
- src/app/api/bible/versions/route.ts
- src/app/api/dashboard/role/route.ts
- src/app/api/documents/download/route.ts
- src/app/api/modules/my-modules/route.ts
- src/app/api/notifications/broadcast/route.ts
- src/app/api/notifications/subscribe/route.ts
- src/app/api/public/church-donations/route.ts
- src/app/api/public/member-registration/route.ts
- src/app/api/publications/route.ts
- src/app/api/push/subscribe/route.ts
- src/app/api/pwa/icon/[size]/route.ts
- src/app/api/pwa/icon/route.ts
- src/app/api/pwa/manifest/route.ts
- src/app/api/pwa/tenant/route.ts
- src/app/api/security/my-access/route.ts
- src/app/api/security/navigation/route.ts
- src/app/api/settings/live-stream/route.ts
- src/app/api/settings/member-registration/route.ts
- src/app/api/super-admin/church-modules/route.ts
- src/app/api/super-admin/church-users/[profileId]/route.ts
- src/app/api/super-admin/church-users/route.ts
- src/app/api/super-admin/modules/toggle/route.ts
- src/app/api/super-admin/onboarding/route.ts
- src/app/api/super-admin/route.ts
- src/app/api/super-admin/users/new/actions.ts
- src/app/church/[slug]/icon.png/route.ts
- src/app/church/[slug]/manifest.webmanifest/route.ts
- src/app/extensions/actions.ts
- src/app/manifest.json/route.ts
- src/app/profile/actions.ts
- src/app/settings/donations/actions.ts
- src/app/super-admin/profile/actions.ts
- src/app/super-admin/users/new/actions.ts
- src/app/teachings/actions.ts
- src/app/transmissions/actions.ts