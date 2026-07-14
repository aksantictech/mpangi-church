# Rapport performance mobile

Fichiers analysés : 443
Poids total source : 2053503 octets

## 30 fichiers les plus volumineux

| Fichier | Taille | Lignes | Client | Images | Iframes | Animations |
|---|---:|---:|---:|---:|---:|---:|
| src/components/bible/BibleReaderClient.tsx | 25822 | 862 | oui | 0 | 0 | 2 |
| src/components/members/MemberForm.tsx | 22892 | 689 | oui | 1 | 0 | 0 |
| src/app/church/[slug]/page.tsx | 21219 | 657 | non | 2 | 1 | 6 |
| src/components/super-admin/SuperAdminChurchForm.tsx | 20217 | 626 | oui | 1 | 0 | 0 |
| src/app/attendance/reports/[eventId]/page.tsx | 19697 | 622 | non | 1 | 0 | 0 |
| src/components/settings/PublicPageSettingsForm.tsx | 19611 | 563 | oui | 0 | 0 | 1 |
| src/app/page.tsx | 18953 | 438 | non | 2 | 0 | 8 |
| src/app/inbox/page.tsx | 18645 | 476 | non | 0 | 0 | 0 |
| src/app/administration/inbox/page.tsx | 18491 | 515 | non | 0 | 0 | 0 |
| src/app/settings/system-check/page.tsx | 17995 | 612 | non | 0 | 0 | 0 |
| src/app/settings/users/page.tsx | 16846 | 491 | non | 0 | 0 | 0 |
| src/app/super-admin/churches/[id]/page.tsx | 16250 | 456 | non | 2 | 0 | 0 |
| src/app/administration/transmissions/page.tsx | 15160 | 402 | non | 0 | 0 | 0 |
| src/components/public/PublicMemberRegistrationForm.tsx | 14989 | 492 | oui | 1 | 0 | 1 |
| src/app/administration/tasks/page.tsx | 14932 | 364 | non | 0 | 0 | 0 |
| src/app/login/page.tsx | 14870 | 403 | oui | 2 | 0 | 0 |
| src/app/dashboard/page.tsx | 14378 | 483 | non | 0 | 0 | 0 |
| src/components/donations/PublicDonationForm.tsx | 14058 | 432 | oui | 0 | 0 | 1 |
| src/components/attendance/EventQrScannerClient.tsx | 13548 | 433 | oui | 0 | 0 | 2 |
| src/app/administration/minutes/page.tsx | 13414 | 324 | non | 0 | 0 | 0 |
| src/app/finance/offerings/page.tsx | 13393 | 337 | non | 0 | 0 | 0 |
| src/app/finance/expenses/page.tsx | 13376 | 337 | non | 0 | 0 | 0 |
| src/app/patrimony/assets/[id]/edit/page.tsx | 13197 | 255 | non | 0 | 0 | 0 |
| src/app/finance/reports/page.tsx | 13066 | 346 | non | 0 | 0 | 0 |
| src/app/administration/transmissions/[id]/edit/page.tsx | 12923 | 343 | non | 0 | 0 | 0 |
| src/app/souls/[id]/page.tsx | 12819 | 410 | non | 2 | 0 | 0 |
| src/app/public-requests/page.tsx | 12768 | 444 | non | 0 | 0 | 0 |
| src/app/extensions/activities/new/page.tsx | 12670 | 309 | non | 0 | 0 | 0 |
| src/app/administration/tasks/[id]/edit/page.tsx | 12614 | 268 | non | 0 | 0 | 0 |
| src/app/administration/minutes/[id]/edit/page.tsx | 12446 | 264 | non | 0 | 0 | 0 |

## Recommandations

- Examiner en priorité les fichiers client très volumineux.
- Fractionner les composants dépassant environ 500 lignes.
- Charger les iframes et médias uniquement lorsque nécessaires.
- Conserver les images publiques sous 500 Ko lorsque possible.
- Éviter plusieurs enhancers globaux redondants à terme.