# Phase 35E-2 — matrice de tests

## Navigation filtrée

Tester :

- `/modules`
- `/api/security/navigation`

Pour chaque rôle, vérifier que les modules interdits ne sont pas retournés.

## Routes

Tester avec un rôle sans droit :

- `/members`
- `/finance`
- `/patrimony`
- `/administration`
- `/settings/users`
- `/settings/roles`

Résultat attendu :

- redirection vers `/unauthorized` ;
- aucun contenu sensible rendu.

## Rôles

### Chargé AFP

Autorisé :

- `/finance`
- `/finance/donations`
- `/my-work`

Interdit sauf configuration explicite :

- `/settings/users`
- `/settings/roles`
- `/patrimony`

### Logisticien

Autorisé :

- `/patrimony`
- `/patrimony/assets`
- `/patrimony/maintenance`

Interdit :

- `/finance`
- `/settings/roles`

### Secrétaire

Autorisé :

- `/administration/correspondence`
- `/administration/transmissions`
- `/administration/minutes`
- `/my-work`

### Lecture seule

- pages autorisées consultables ;
- actions Créer, Modifier et Supprimer refusées.

## Isolation multi-église

Avec un compte de l’église A :

- modifier une URL contenant un identifiant de l’église B ;
- tenter une mutation avec cet identifiant ;
- confirmer que la requête applique `church_id = context.churchId`.

## Proxy Next.js

- `npm run build` ne doit plus afficher l’avertissement middleware déprécié ;
- le fichier actif doit être `src/proxy.ts` ou `proxy.ts` ;
- le matcher existant doit être conservé.
