# Politique des routes publiques

Les routes suivantes restent accessibles sans permission interne :

- API Bible ;
- manifeste PWA ;
- icônes PWA ;
- manifeste et icône d’une église ;
- formulaire public d’inscription ;
- intention publique de don.

Ces routes doivent valider leurs entrées, appliquer une limitation de débit lorsque nécessaire et ne jamais exposer de données privées.

Les routes suivantes nécessitent une session, mais pas nécessairement une permission de module :

- profil personnel ;
- informations du compte connecté ;
- abonnement aux notifications Push ;
- liste des modules du compte.

Les routes Super Admin nécessitent toujours `requireSuperAdminAccess()`.

Le téléchargement de documents nécessite au minimum une permission sur un module documentaire et doit ensuite vérifier le `church_id` ou le propriétaire du document.
