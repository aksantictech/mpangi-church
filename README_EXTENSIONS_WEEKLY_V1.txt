Mpangi-church — Module Activités hebdomadaires des extensions V1

Objectif :
Ajouter un module isolé pour suivre les activités des extensions sans casser les modules existants.

Ce pack ajoute :

SQL :
- phase21_extensions_weekly_activities.sql

Pages :
- /extensions
- /extensions/new
- /extensions/[id]/edit
- /extensions/activities
- /extensions/activities/new
- /extensions/reports

Fichiers :
- src/app/extensions/actions.ts
- src/app/extensions/page.tsx
- src/app/extensions/new/page.tsx
- src/app/extensions/[id]/edit/page.tsx
- src/app/extensions/activities/page.tsx
- src/app/extensions/activities/new/page.tsx
- src/app/extensions/reports/page.tsx
- src/components/extensions/ExtensionPageHeader.tsx
- src/components/extensions/ExtensionKpiCard.tsx
- src/components/extensions/ExtensionStatusBadge.tsx
- src/lib/extensions/dates.ts
- src/lib/extensions/types.ts

Menu :
- scripts/patch-menu-extensions.js
- PATCH_MENU_EXTENSIONS.md

Installation :
1. Dézipper à la racine du projet.
2. Exécuter dans Supabase SQL Editor :
   phase21_extensions_weekly_activities.sql
3. Ajouter le menu :
   node scripts/patch-menu-extensions.js
4. Tester :
   npm run build
5. Ouvrir :
   /extensions

Tests fonctionnels :
1. Créer 5 extensions.
2. Créer une activité pour chaque extension.
3. Vérifier /extensions/activities.
4. Vérifier /extensions/reports.
5. Tester sur mobile.

Notes :
- Le module utilise le code de permission : extension_activities
- Les finances enregistrées ici sont des chiffres de reporting par extension.
- Elles ne modifient pas les modules Finance existants.
- Le module est volontairement léger pour éviter de surcharger l’application.
