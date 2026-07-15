MPANGI-CHURCH — PHASE 35S
DIAGNOSTIC DE STABILISATION PRODUCTION

Ce pack collecte uniquement les fichiers nécessaires pour corriger :
- routage des sous-domaines ;
- page publique par église ;
- login tenant-aware ;
- liens de la liste des églises ;
- menu Super Admin desktop/mobile ;
- barre mobile inférieure ;
- lanceur de modules type Odoo ;
- page Bible et erreur API 400 ;
- CSS responsive global.

Installation :
1. Dézipper ce pack à la racine du projet.
2. Exécuter :

powershell -ExecutionPolicy Bypass `
  -File collect-production-stabilization-context.ps1

3. Téléverser le fichier créé :

mpangi-production-stabilization-context.zip

Le script ne modifie aucun fichier applicatif.
Il ne collecte pas les fichiers .env ni les clés Supabase.
