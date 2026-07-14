# Rapport d’installation Phase 35E-2

## Layouts sécurisés installés

- /members
- /attendance
- /souls
- /departments
- /events
- /public-requests
- /teachings
- /notifications
- /finance
- /patrimony
- /administration
- /settings/users
- /settings/roles
- /dashboard/role
- /my-work

## Layouts existants non modifiés

- /extensions — layout_exists_manual_integration_required

Un layout existant n’est jamais écrasé automatiquement.
Il doit intégrer requireAnyModulePermission() manuellement.

## Migration Proxy

- Statut : migrated
- Source : src\middleware.ts.deprecated
- Cible : src\proxy.ts