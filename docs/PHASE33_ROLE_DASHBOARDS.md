# Phase 33 — Dashboards personnalisés par rôle

## Objectif

Adapter le dashboard selon le rôle de l'utilisateur connecté.

## Rôles couverts

- super_admin
- church_admin / admin_eglise
- pastor / pasteur_t
- pasteur_a / assistant_pastor
- charge_afp
- responsable_d
- logisticien
- secretaire
- worker
- readonly

## Route

```txt
/dashboard/role
```

## API

```txt
/api/dashboard/role
```

## Composants

```txt
src/components/dashboard/RoleDashboardPanel.tsx
src/lib/dashboard/roleDashboard.ts
```

## Installation

```bash
node scripts/patch-dashboard-role-panel.js
node scripts/patch-role-dashboard-menu.js
npm run build
```

## Principe

Chaque rôle voit des cartes prioritaires :

- Pasteur : âmes, présences, demandes, membres, extensions
- Chargé AFP : administration, finances, patrimoine, extensions
- Responsable département : départements, membres, présences
- Logisticien : patrimoine, maintenance
- Secrétaire : courriers, rendez-vous, demandes, extensions
