# Matrice de validation Phase 35E-3

## Accès
- Route interdite → `/unauthorized`
- `can_view=false` → module absent du menu
- `can_create=false` → création refusée
- `can_update=false` → modification refusée
- `can_delete=false` → suppression refusée
- `can_approve=false` → validation refusée
- Route Super Admin avec rôle normal → refus
- API Bible/PWA publique → accessible sans session

## Isolation multi-église
- Profil A ne lit aucun membre de B
- Profil A ne modifie aucune tâche de B
- Profil A ne télécharge aucun document de B
- Profil A ne confirme aucun don de B
- Profil A ne lit aucun journal de B
- Super Admin peut superviser A et B

## Validation
- aucune anomalie critique dans l’audit multi-église
- aucune révision critique dans l’audit des routes
- TypeScript sans erreur
- build production validé
- tests réels avec au moins cinq rôles
- journal visible uniquement aux rôles autorisés
