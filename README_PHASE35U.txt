MPANGI-CHURCH — PHASE 35U
DIAGNOSTIC BIBLE, PUBLICATIONS, NOTIFICATIONS ET MOBILE

PROBLÈMES CIBLÉS
- barre mobile Accueil / Modules / Scanner / Alertes / Plus affichée verticalement ;
- lien Alertes ouvrant une page introuvable ;
- menu Configuration des dons absent ;
- publication impossible car la colonne `description` manque ;
- ajout d’une photo de couverture aux publications ;
- mise en vedette sur la page publique ;
- notification Push des abonnés ;
- amélioration du lecteur Bible ;
- ajout dynamique de versions accessibles à la clé API.Bible.

HOTFIX IMMÉDIAT PUBLICATION
Dans Supabase SQL Editor, exécuter :

phase35u_emergency_publications_description.sql

COLLECTE DU CODE
1. Dézipper le pack à la racine du projet.
2. Exécuter :

powershell -ExecutionPolicy Bypass `
  -File collect-phase35u-context.ps1

3. Téléverser :

mpangi-phase35u-context.zip

DIAGNOSTIC SUPABASE
Exécuter également si possible :

phase35u_schema_diagnostic.sql

AUCUN SECRET N’EST COLLECTÉ
Le script ne copie pas :
- .env.local ;
- clés API ;
- sauvegardes ;
- dumps SQL ;
- node_modules.
