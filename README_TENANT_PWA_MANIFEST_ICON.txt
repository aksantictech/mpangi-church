Mpangi-church — Hotfix icône PWA par église / sous-domaine

Problème :
MDM installé depuis mdm.mpangi-church.app affiche encore le logo Mpangi-church.

Cause probable :
Le précédent correctif concernait /church/[slug]/manifest.webmanifest,
mais l’app MDM privée est installée depuis le sous-domaine :
mdm.mpangi-church.app

Donc elle utilise le manifest racine :
/manifest.webmanifest

Correction :
Ce pack rend le manifest racine dynamique selon le host/subdomain.

Fichiers ajoutés/remplacés :
src/lib/tenant/pwa.ts
src/app/manifest.ts
src/app/api/pwa/icon/route.ts
src/app/api/pwa/tenant/route.ts
src/app/church/[slug]/manifest.webmanifest/route.ts

SQL diagnostic :
phase18_pwa_mdm_icon_check.sql

Étapes :
1. Dézipper à la racine.
2. Exécuter le SQL diagnostic dans Supabase.
3. Vérifier que churches.logo_url pour maison-misericorde-cmp est le vrai logo MDM.
4. npm run build
5. git add .
6. git commit -m "Fix tenant pwa manifest icons"
7. git push

Tests après déploiement :
https://mdm.mpangi-church.app/api/pwa/tenant
https://mdm.mpangi-church.app/manifest.webmanifest
https://mdm.mpangi-church.app/api/pwa/icon?slug=maison-misericorde-cmp

Important Android :
Désinstaller l’ancienne app MDM du téléphone, vider si possible le raccourci,
puis réinstaller depuis Chrome. Android garde fortement l’ancienne icône en cache.
