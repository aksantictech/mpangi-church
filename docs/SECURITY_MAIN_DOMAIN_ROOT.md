# Mpangi-church — Sécurité domaine principal

## Problème corrigé

Le domaine principal `mpangi-church.app` ne doit pas rediriger automatiquement vers `/dashboard`.

Le domaine principal doit afficher une page générale publique.

## Règle de sécurité

```txt
mpangi-church.app/                 => page publique générale
mpangi-church.app/dashboard        => bloqué / redirigé
mpangi-church.app/members          => bloqué / redirigé
mpangi-church.app/settings         => bloqué / redirigé
mdm.mpangi-church.app/dashboard    => espace privé MDM, login requis
icckinshasa.mpangi-church.app/...  => espace privé ICC, login requis
```

## Fichiers

```txt
src/app/page.tsx
src/app/main-domain-required/page.tsx
src/middleware.ts
```

## Tests

Après déploiement :

```txt
https://mpangi-church.app/
```

Doit afficher la page publique générale.

```txt
https://mpangi-church.app/dashboard
```

Ne doit jamais afficher les données d’une église.

```txt
https://mdm.mpangi-church.app/dashboard
```

Doit respecter le login et afficher uniquement MDM après connexion.

## Important

Les routes API gardent leurs protections internes dans leurs handlers.
La protection principale ici empêche surtout l’accès accidentel aux dashboards d’église depuis le domaine racine.
