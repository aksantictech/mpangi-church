Mpangi-church — Pack audit sécurité des routes

Fichiers ajoutés :
- scripts/audit-route-security.js
- src/app/super-admin/security/page.tsx
- STABILISATION_V1_NEXT_STEPS.md
- PATCH_super_admin_settings_security_card.txt

Installation :
Dézipper à la racine du projet.

Puis :
npm run build
node scripts/audit-route-security.js

Tester :
/super-admin/security

Si tout passe :
git add .
git commit -m "Add route security audit tools"
git push
