# Correction locale — ChunkLoadError Turbopack

## Problème

En local, la page se rafraîchit souvent avec :

```txt
ChunkLoadError: Failed to load chunk /_next/static/chunks/...
```

C'est lié au client HMR de Turbopack en développement local.

## Correction appliquée

Le script `dev` passe en Webpack :

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "dev:turbo": "next dev",
    "dev:clean": "node scripts/reset-next-dev-cache.js && next dev --webpack",
    "build:webpack": "next build --webpack"
  }
}
```

## Commandes

```bash
node scripts/patch-local-dev-webpack.js
npm run dev:clean
```

## Ensuite

Ouvrir :

```txt
http://localhost:3000
```

Ne pas utiliser `mpangi-church.app` en local, sauf configuration volontaire du fichier hosts.

## Production

Cette correction ne modifie pas la logique de sécurité ni le rendu en production.
Elle stabilise seulement le mode développement local.
