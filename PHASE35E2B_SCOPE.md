# Périmètre Phase 35E-2B

Le rapport initial contient 56 fichiers sans garde statiquement détectée.

Tous ces fichiers ne doivent pas être protégés de la même manière.

## Corrigés automatiquement dans ce lot

### Priorité 1

- export financier ;
- actions membres ;
- création des utilisateurs ;
- actions financières ;
- budgets ;
- confirmation des dons ;
- patrimoine.

### Priorité 2

- courriers ;
- procès-verbaux ;
- tâches administratives ;
- transmissions ;
- présence événement ;
- export présence ;
- scanner QR ;
- conversion d’une âme en membre.

## Volontairement non protégés par une garde utilisateur

Ces routes ont une vocation publique ou technique :

- API Bible ;
- manifeste PWA ;
- icônes PWA ;
- manifeste d’une église ;
- inscription publique d’un membre ;
- intention publique de don ;
- abonnement Push public.

Les protéger avec `requireAnyModulePermission()` casserait la page publique.

## À examiner séparément

- routes Super Admin ;
- téléchargement de documents ;
- paramètres de diffusion en direct ;
- profil utilisateur ;
- publications ;
- notifications broadcast.

Ces éléments nécessitent une lecture du code réel et seront traités dans le lot 35E-2C.
