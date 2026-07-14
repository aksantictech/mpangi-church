# Secrets GitHub Actions

Dans le dépôt GitHub :

```txt
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Créer :

```txt
SUPABASE_DB_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BACKUP_ARCHIVE_PASSWORD
```

Le workflow :

- sauvegarde la base et Storage ;
- crée un manifest SHA-256 ;
- chiffre l’archive avec AES-256 ;
- publie uniquement l’archive chiffrée ;
- ne commite aucune donnée sensible.

Conserver `BACKUP_ARCHIVE_PASSWORD` dans un gestionnaire de mots de passe distinct de GitHub.
