# Phase 32 — Onboarding contrôlé de 5 églises

## Objectif

Mettre en place une procédure propre pour ajouter et valider 5 églises pilotes sans casser les modules.

## Étapes de validation

1. Identité de l’église
2. Logo et identité visuelle
3. Domaine privé
4. Page publique
5. Modules activés
6. Utilisateurs et rôles
7. Membres de départ
8. Installation mobile PWA
9. Notifications
10. Validation finale

## Pages

```txt
/super-admin/onboarding
/super-admin/churches/[id]/onboarding
```

## API

```txt
GET  /api/super-admin/onboarding
POST /api/super-admin/onboarding
```

## SQL

```txt
church_onboarding_steps
initialize_church_onboarding(church_id)
reset_church_onboarding(church_id)
complete_church_onboarding(church_id, completed_by)
```

## Processus recommandé pour les 5 églises

1. Créer l’église dans Super Admin.
2. Ouvrir `/super-admin/onboarding`.
3. Cliquer sur l’église.
4. Valider les étapes une par une.
5. Activer les modules via le bouton “Gérer les modules”.
6. Tester l’espace privé et la page publique.
7. Marquer “Validation finale”.
