# Phase 35U finale — matrice de tests

## 1. Mobile administratif

Sur un téléphone réel :

- [ ] Accueil, Modules, Scanner, Alertes et Plus sont sur une seule ligne.
- [ ] Aucun texte vertical.
- [ ] Aucun défilement horizontal.
- [ ] Le bouton Alertes ouvre `/notifications`.
- [ ] `/alerts` redirige vers `/notifications`.
- [ ] Le bouton Plus ouvre le drawer sans déplacer la page.
- [ ] La barre reste fixée en bas pendant le défilement.

## 2. Paramètres

Dans `/settings` :

- [ ] La carte « Configuration des dons » apparaît.
- [ ] La carte ouvre `/settings/donations`.
- [ ] Les champs restent lisibles sur mobile.

## 3. Publications

Dans `/publications` :

- [ ] Créer une actualité sans photo.
- [ ] Créer un événement avec photo JPG.
- [ ] Créer une annonce avec photo WebP.
- [ ] Refuser une photo de plus de 4 Mo.
- [ ] Publier sur la page publique.
- [ ] Mettre une publication en vedette.
- [ ] Masquer puis republier.
- [ ] Supprimer une publication de test.
- [ ] Vérifier que la photo apparaît sur la page publique.

### Notification

- [ ] Activer les notifications sur un deuxième téléphone.
- [ ] Publier avec « Notifier les abonnés ».
- [ ] Vérifier la réception de la notification.
- [ ] Toucher la notification et vérifier l’ouverture de la page publique.
- [ ] Vérifier le journal dans `church_notification_logs`.

## 4. Notifications publiques

Sur le sous-domaine de l’église :

- [ ] Ouvrir `/public-notifications`.
- [ ] La page existe.
- [ ] Le bouton d’activation déclenche la demande du navigateur.
- [ ] L’abonnement est créé dans `church_notification_subscriptions`.
- [ ] Une autorisation refusée affiche un message explicite.

## 5. Bible

Sur `/bible` :

- [ ] Les versions françaises autorisées sont chargées.
- [ ] Le nom du livre est court, par exemple « Genèse ».
- [ ] Le changement de version recharge les livres.
- [ ] Le changement de livre recharge les chapitres.
- [ ] Le chapitre s’affiche sans erreur 400.
- [ ] Précédent et Suivant fonctionnent.
- [ ] La taille du texte est mémorisée.
- [ ] Clair, Sépia et Nuit fonctionnent.
- [ ] Recherche fonctionne.
- [ ] Favori et Partager fonctionnent.
- [ ] La barre publique reste horizontale en bas.

## 6. Cache PWA

Après déploiement :

- [ ] Fermer tous les onglets du site.
- [ ] Rouvrir le site.
- [ ] Vérifier que le Service Worker utilise `mpangi-church-pwa-v5`.
- [ ] Désinstaller puis réinstaller la PWA si une ancienne interface persiste.
