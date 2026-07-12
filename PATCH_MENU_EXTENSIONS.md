# PATCH MENU EXTENSIONS — insertion manuelle

Ton script `patch-menu-extensions.js` indique :

```txt
Structure de moduleRegistry non reconnue.
```

Donc on ne force pas automatiquement. Fais ceci manuellement dans :

```txt
src/lib/modules/moduleRegistry.ts
```

## 1. Vérifie les imports lucide-react

Ajoute ces icônes dans l'import existant :

```ts
Network,
ClipboardList,
BarChart3,
MapPinned,
```

Exemple :

```ts
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  MapPinned,
  Network,
  Settings,
} from "lucide-react";
```

## 2. Ajoute le groupe Extensions

Dans le tableau des groupes de menu, ajoute ce bloc :

```ts
{
  key: "extensions",
  title: "Extensions",
  description: "Activités des extensions",
  icon: Network,
  items: [
    {
      code: "extension_activities",
      label: "Extensions",
      href: "/extensions",
      icon: MapPinned,
    },
    {
      code: "extension_activities",
      label: "Activités",
      href: "/extensions/activities",
      icon: ClipboardList,
    },
    {
      code: "extension_activities",
      label: "Rapports",
      href: "/extensions/reports",
      icon: BarChart3,
    },
  ],
},
```

## 3. Emplacement recommandé

Mets-le après le volet administratif ou avant le volet finances.

## 4. Si ta structure est en flat list

Si ton fichier n'utilise pas des groupes mais une simple liste, ajoute plutôt :

```ts
{
  code: "extension_activities",
  label: "Extensions",
  href: "/extensions",
  icon: Network,
},
{
  code: "extension_activities",
  label: "Activités extensions",
  href: "/extensions/activities",
  icon: ClipboardList,
},
{
  code: "extension_activities",
  label: "Rapports extensions",
  href: "/extensions/reports",
  icon: BarChart3,
},
```

## 5. Test

Après modification :

```bash
npm run build
```
