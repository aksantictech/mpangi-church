# Phase 29 — Tables mobiles en cartes automatiques

## Objectif

Corriger rapidement les pages avec tableaux larges sur mobile, sans réécrire toute la logique métier page par page.

## Principe

Le composant `ResponsiveTablesEnhancer` lit les en-têtes `<th>` de chaque tableau puis ajoute automatiquement `data-label` aux cellules `<td>`.

Le CSS transforme ensuite les lignes de tableaux en cartes mobiles.

## Fichiers ajoutés

```txt
src/components/mobile/ResponsiveTablesEnhancer.tsx
src/styles/responsive-tables.css
scripts/patch-phase29-responsive-tables-layout.js
scripts/audit-mobile-tables.js
```

## Installation

```bash
node scripts/patch-phase29-responsive-tables-layout.js
node scripts/audit-mobile-tables.js
npm run build
```

## Résultat attendu

Sur mobile, les tableaux de pages comme :

```txt
/members
/departments
/events
/souls
/finance/reports
/super-admin/users
/super-admin/churches/[id]
```

s'affichent sous forme de cartes lisibles.

## Désactiver sur une table spécifique

Ajouter l'attribut :

```tsx
<table data-mobile-table="off">
```

## Prochaine étape

Faire des cartes React sur mesure pour les pages les plus importantes :

1. `/members`
2. `/extensions/activities`
3. `/finance/offerings`
4. `/finance/expenses`
5. `/super-admin/users`
