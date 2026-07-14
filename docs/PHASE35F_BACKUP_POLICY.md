# Politique de sauvegarde Mpangi-Church

## Objectifs

- Perte maximale visée : 24 heures.
- Restauration de test vérifiée en moins de 4 heures.
- Copie indépendante du projet Supabase.
- Aucune sauvegarde en clair dans Git.

## Contenu d’une sauvegarde

- `roles.sql`
- `schema.sql`
- `data.sql`
- objets Supabase Storage
- `backup-manifest.json`
- empreintes SHA-256
- rapport de vérification

## Rétention locale

- 7 sauvegardes quotidiennes
- 4 sauvegardes hebdomadaires
- 6 sauvegardes mensuelles

Le script `apply-retention.js` conserve une sauvegarde représentative par jour, semaine et mois.

## Fréquence

- Base PostgreSQL : chaque nuit.
- Storage : chaque nuit si le volume reste raisonnable.
- Vérification d’intégrité : après chaque sauvegarde.
- Test de restauration : chaque mois.
- Exercice complet de reprise : chaque trimestre.

## Sécurité

Les archives peuvent contenir des membres, finances, demandes pastorales et documents privés. Elles doivent être :

- chiffrées au repos ;
- transférées via TLS ;
- accessibles uniquement aux responsables techniques ;
- exclues du dépôt Git ;
- supprimées conformément à la politique de rétention.

## Trois couches recommandées

1. Sauvegardes natives Supabase selon le plan.
2. Sauvegarde logique indépendante produite par ce pack.
3. Copie chiffrée hors site : stockage objet privé, coffre ou serveur de sauvegarde.

Les artefacts GitHub chiffrés servent principalement au court terme. Pour six mois de conservation réelle, utiliser une destination hors site dédiée.
