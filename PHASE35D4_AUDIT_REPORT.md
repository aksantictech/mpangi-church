# Audit Phase 35D-4

| Fichier | Existe | Tables | Fixed | Absolute | Grands textes | Overflow hidden |
|---|---:|---:|---:|---:|---:|---:|
| src/app/dashboard/page.tsx | oui | 0 | 0 | 0 | 0 | 0 |
| src/app/super-admin/dashboard/page.tsx | oui | 1 | 0 | 0 | 0 | 1 |
| src/app/church/[slug]/page.tsx | oui | 0 | 0 | 2 | 0 | 3 |
| src/app/attendance/scanner/page.tsx | oui | 0 | 0 | 0 | 0 | 0 |
| src/app/notifications/page.tsx | oui | 0 | 0 | 0 | 0 | 0 |
| src/app/install/page.tsx | oui | 0 | 0 | 0 | 0 | 0 |
| src/components/layout/MobileTopBar.tsx | oui | 0 | 1 | 2 | 0 | 0 |
| src/components/layout/ChurchDesktopTopBar.tsx | oui | 0 | 0 | 1 | 0 | 1 |
| src/components/public/PublicMobileBottomNav.tsx | oui | 0 | 1 | 0 | 0 | 0 |
| src/app/manifest.ts | oui | 0 | 0 | 0 | 0 | 0 |
| public/sw.js | oui | 0 | 0 | 0 | 0 | 0 |

## Tests manuels

- dashboard église en 360 × 800
- dashboard super admin en 390 × 844
- page publique d’une église
- ouverture du menu supérieur
- scanner QR avec caméra
- notifications longues
- page /install sur Chrome Android
- page /install sur iPhone/iPad