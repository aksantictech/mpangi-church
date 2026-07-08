# Mpangi-church — Checklist correction mobile page par page

## Objectif
Rendre la version mobile utilisable par des utilisateurs non techniques avant le pilote 5 églises.

## Ordre de correction recommandé

### P1 — critique
- `/dashboard`
- `/mobile-menu`
- `/settings/users`
- `/members`
- `/attendance/scanner`
- `/notifications`
- `/teachings`
- `/administration/inbox`
- `/finance`
- `/patrimony/assets`

### P2 — important
- `/administration/correspondence`
- `/administration/transmissions`
- `/administration/tasks`
- `/administration/minutes`
- `/finance/offerings`
- `/finance/expenses`
- `/finance/budgets`
- `/patrimony/maintenance`
- `/patrimony/movements`

### P3 — confort
- pages détail
- pages edit
- pages super admin

## Règles UX mobile

1. Une table desktop doit avoir une version cartes mobile.
2. Aucun bouton important ne doit être uniquement visible à droite d’un scroll horizontal.
3. Les formulaires longs doivent être en blocs :
   - Informations principales
   - Détails
   - Document
   - Validation
4. Les titres doivent être courts :
   - `text-2xl` mobile
   - `text-3xl` tablette
   - `text-4xl` desktop
5. Les actions principales doivent être :
   - en haut de page
   - ou en barre sticky mobile
6. Le menu mobile ne doit montrer que les modules autorisés.

## Tests Android

- Ouvrir depuis Chrome Android
- Installer la PWA
- Tester login
- Tester dashboard
- Tester scanner QR
- Tester notifications
- Tester création membre
- Tester enseignement YouTube
- Tester déconnexion
