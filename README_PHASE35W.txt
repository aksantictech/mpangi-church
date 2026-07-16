MPANGI-CHURCH — PHASE 35W
NOTIFICATIONS MULTI-NAVIGATEUR + CONTENUS EN VEDETTE + RETOUR ENSEIGNEMENTS

CORRECTIONS

1. Notifications
- suppression des instructions codées uniquement pour Chrome ;
- détection de Samsung Internet, Edge, Firefox, Opera, Chrome et Safari ;
- instructions génériques selon le navigateur ;
- revérification automatique lors du retour dans l’application ;
- bouton Revérifier l’autorisation.

IMPORTANT
Une application web ne peut pas contourner une permission déjà refusée.
L’utilisateur doit autoriser les notifications dans les permissions du site.

2. Page d’accueil publique
- ajout d’un bloc Actualités et événements ;
- lecture des publications marquées publiées + en vedette ;
- lecture compatible des tables events ou church_events ;
- image de couverture ;
- classement par date ;
- page publique forcée en mode dynamique pour éviter un ancien cache.

3. Publications
- ajout des types Événement et Actualité ;
- titre Push générique Nouvelle publication.

4. Enseignements publics
- bouton Retour à la page de l’église ;
- barre mobile publique sur la liste et la fiche d’enseignement.

INSTALLATION

1. Dézipper à la racine du projet.

2. Installer :
   node scripts/install-phase35w.js

3. Exécuter dans Supabase SQL Editor :
   phase35w_public_experience.sql

4. Vérifier :
   node scripts/check-phase35w.js
   npx tsc --noEmit --pretty false
   npm run build

TESTS

Notifications :
- ouvrir la page sur Samsung Internet, Firefox ou Edge ;
- vérifier que le texte n’impose plus Chrome ;
- autoriser dans les permissions du site ;
- revenir dans l’application ;
- appuyer sur Revérifier l’autorisation.

Vedette :
- publier une Annonce, Actualité ou Événement ;
- cocher Publier et Mettre en vedette ;
- recharger la page publique ;
- vérifier le bloc Actualités et événements.

Enseignements :
- ouvrir /public-teachings ;
- ouvrir une vidéo ;
- vérifier le bouton Retour à la page de l’église ;
- vérifier la barre mobile publique.

ROLLBACK
node scripts/rollback-phase35w.js
