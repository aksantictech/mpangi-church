Mpangi-church — Hotfix Module Extensions V1

Ce pack corrige les deux problèmes montrés :

1. SQL
Erreur :
column "is_active" of relation "app_modules" does not exist

Correction :
phase21_hotfix_extensions_schema_menu.sql
- n'utilise plus is_active
- garde category obligatoire
- crée les tables extensions si elles n'ont pas été créées
- active le module
- ajoute les permissions

2. Menu
Erreur :
Structure de moduleRegistry non reconnue.

Correction :
scripts/patch-menu-extensions-v2.js
- plus robuste
- tente d'ajouter le groupe Extensions
- si la structure n'est toujours pas reconnue, utiliser PATCH_MENU_EXTENSIONS.md

Installation :
1. Exécuter dans Supabase :
   phase21_hotfix_extensions_schema_menu.sql

2. Dans VS Code :
   node scripts/patch-menu-extensions-v2.js

3. Si le script dit encore structure non reconnue :
   ouvrir PATCH_MENU_EXTENSIONS.md
   copier le snippet dans src/lib/modules/moduleRegistry.ts

4. Build :
   npm run build

Tests :
/extensions
/extensions/new
/extensions/activities
/extensions/activities/new
/extensions/reports
