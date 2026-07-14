# Procédure de restauration Mpangi-Church

## Règle principale

Ne jamais tester une restauration sur la production.

Créer un projet Supabase de test ou de reprise et renseigner `TARGET_DB_URL`.

## 1. Vérifier la sauvegarde

```powershell
node scripts/backup/verify-backup.js `
  --backup-dir "backups/mpangi-church/AAAA-MM-JJ_HH-mm-ss"
```

Résultat requis :

```txt
Anomalies : 0
✅ Sauvegarde intègre.
```

## 2. Préparer la cible

- créer un projet Supabase séparé ;
- activer les extensions nécessaires ;
- préparer les fournisseurs Auth ;
- documenter les webhooks ;
- préparer les publications Realtime ;
- ne pas réutiliser les secrets de production.

## 3. Dry-run

```powershell
powershell -ExecutionPolicy Bypass `
  -File scripts/backup/restore-database.ps1 `
  -BackupDirectory "backups/mpangi-church/AAAA-MM-JJ_HH-mm-ss"
```

## 4. Restaurer dans la base de test

```powershell
$env:CONFIRM_DATABASE_RESTORE="RESTORE_TO_TEST_DATABASE"

powershell -ExecutionPolicy Bypass `
  -File scripts/backup/restore-database.ps1 `
  -BackupDirectory "backups/mpangi-church/AAAA-MM-JJ_HH-mm-ss" `
  -Execute
```

## 5. Contrôles après restauration

- connexion utilisateur ;
- liaison `profiles.user_id = auth.users.id` ;
- isolation entre deux églises ;
- membres ;
- présences ;
- finances ;
- patrimoine ;
- documents ;
- dons ;
- rôles et permissions ;
- RLS ;
- journal de sécurité.

## 6. Réactiver les services

- publications Realtime ;
- Edge Functions ;
- webhooks ;
- tâches planifiées ;
- secrets de la cible.

## Critères de réussite

- restauration SQL sans erreur bloquante ;
- checksums valides ;
- données principales présentes ;
- aucune donnée croisée entre églises ;
- RLS fonctionnel ;
- application compilée et accessible.
