# Phase 35D-5 — tests réels et maintenance

## Tests appareils

### Android

- Chrome récent
- écran 360 × 800
- économie de données activée
- réseau 3G simulé
- application PWA installée
- scanner avec autorisation caméra

### iPhone/iPad

- Safari
- 390 × 844
- ajout à l’écran d’accueil
- clavier ouvert dans les formulaires
- mode Réduire les animations

### Ordinateur

- Chrome/Edge
- Firefox
- responsive 320, 360, 390 et 412 px

## Pages

- `/`
- `/login`
- `/dashboard`
- `/members`
- `/settings/users`
- `/notifications`
- `/attendance/scanner`
- `/install`
- `/church/maison-misericorde-cmp`
- `/church/maison-misericorde-cmp/bible`
- `/church/maison-misericorde-cmp/don`
- `/finance/donations`

## Maintenance

```bash
node scripts/audit-mobile-performance.js
node scripts/audit-public-assets.js
node scripts/audit-backup-files.js
node scripts/archive-backups.js
```

Le dernier script reste en simulation sans `--apply`.
