# Phase 35E — matrice de tests d’accès

## Comptes à tester

Créer ou utiliser au moins un compte pour chaque rôle :

- Administrateur église
- Pasteur titulaire
- Pasteur assistant
- Chargé AFP
- Responsable de département
- Logisticien
- Secrétaire
- Ouvrier
- Lecture seule
- Membre

## Routes nouvelles

- `/dashboard/role`
- `/my-work`
- `/settings/roles`
- `/api/security/my-capabilities`

## Vérifications principales

### Administrateur église

- voit `/settings/roles` ;
- modifie les droits de son église ;
- ne modifie aucune autre église ;
- voit les utilisateurs, finances et paramètres.

### Pasteur titulaire

- voit le dashboard pastoral ;
- voit les demandes publiques et suivis ;
- peut valider selon les droits configurés.

### Pasteur assistant

- voit les suivis et tâches ;
- ne voit pas la configuration de sécurité ;
- ne voit pas les finances si elles sont désactivées.

### Chargé AFP

- voit finances, dons, budgets et rapports ;
- ne voit pas les utilisateurs ;
- ne voit pas les paramètres de sécurité.

### Responsable de département

- voit membres, présences, département et événements ;
- ne voit pas les finances globales.

### Logisticien

- voit patrimoine, biens, maintenance et mouvements ;
- ne voit pas les courriers ni la sécurité.

### Secrétaire

- voit courriers, transmissions, PV et tâches ;
- ne voit pas les paramètres de sécurité.

### Lecture seule

- ne peut ni créer, ni modifier, ni supprimer ;
- accède uniquement aux modules de consultation.

### Isolation multi-église

Avec deux églises différentes :

- un compte de l’église A ne lit aucune permission de B ;
- il ne voit aucune tâche de B ;
- il ne modifie aucun widget de B ;
- les dashboards affichent uniquement les données de leur church_id.
