# Mpangi-church — Correction ChunkLoadError local

## Symptôme

Même avec `next dev --webpack`, le terminal peut afficher :

```txt
[browser] unhandledRejection: ChunkLoadError
Failed to load chunk /_next/static/chunks/...
[turbopack]/browser/dev/hmr-client
```

## Cause probable

Le navigateur ou un ancien service worker PWA garde en cache d'anciens chunks `_next`.

## Correction

1. Ajouter `DevServiceWorkerCleanup` dans le layout.
2. Ouvrir `/dev/clear-cache`.
3. Cliquer sur "Nettoyer maintenant".
4. Fermer tous les onglets localhost.
5. Relancer le serveur avec `npm run dev:clean`.
6. Ouvrir `http://localhost:3000`.

## Commandes

```bash
node scripts/patch-dev-sw-cleanup-layout.js
npm run dev:clean
```

Puis ouvrir :

```txt
http://localhost:3000/dev/clear-cache
```

## Alternative console navigateur

```bash
node scripts/print-clear-cache-console-snippet.js
```

Copier le script affiché dans la console du navigateur.
