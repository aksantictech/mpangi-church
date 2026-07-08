# Mpangi-church — Stabilisation V1

## Étape actuelle : audit sécurité des routes

### Commandes

```bash
node scripts/audit-route-security.js
```

Le script génère :

```txt
SECURITY_ROUTE_AUDIT_REPORT.md
security-route-audit-report.json
```

### Page super admin

```txt
/super-admin/security
```

Elle affiche : profils, comptes inactifs, permissions personnalisées, modules actifs et audit des permissions via `v_profile_module_access_audit`.

## Prochaine étape

Après exécution du script, envoyer le résumé du fichier `SECURITY_ROUTE_AUDIT_REPORT.md`.
Ensuite on fera le pack de correction des routes critiques.
