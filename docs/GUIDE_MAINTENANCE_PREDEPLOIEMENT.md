# Mpangi-church — Guide maintenance pré-déploiement

## Objectif

Avant chaque push important, vérifier :

1. stabilité des pages
2. tables mobiles
3. états erreur/loading
4. fichiers temporaires
5. build production

## Commandes recommandées

```bash
npm run audit:pages
npm run audit:mobile
npm run audit:states
npm run cleanup:scan
npm run build
```

Ou en une seule commande sans build :

```bash
npm run predeploy:check
```

Avec build :

```bash
npm run predeploy:build
```

## Nettoyage des fichiers temporaires

Scanner :

```bash
npm run cleanup:scan
```

Supprimer réellement :

```bash
npm run cleanup:apply
```

## Fichiers générés

```txt
PAGE_STABILITY_REPORT.md
MOBILE_TABLES_AUDIT_REPORT.md
ROUTE_STATES_COVERAGE_REPORT.md
PREDEPLOY_CHECK_REPORT.md
```

## Règle importante

Ne pas pousser les fichiers `.bak`, `.tmp`, `.old`, `manual_github_upload` ou rapports temporaires inutiles.
