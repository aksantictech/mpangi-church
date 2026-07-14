# Phase 35D — guide de migration page par page

## Objectif

Chaque page doit fonctionner sans débordement horizontal entre 320 px et 430 px.

## Structure recommandée

```tsx
import MobilePageShell from "@/components/mobile/MobilePageShell";
import MobileHero from "@/components/mobile/MobileHero";
import MobileSection from "@/components/mobile/MobileSection";

export default function Page() {
  return (
    <MobilePageShell>
      <div className="mx-auto max-w-7xl space-y-4 py-4 sm:py-8">
        <MobileHero
          eyebrow="Volet concerné"
          title="Titre de la page"
          description="Description courte."
        />

        <MobileSection title="Contenu">
          ...
        </MobileSection>
      </div>
    </MobilePageShell>
  );
}
```

## Tableaux

Sur ordinateur :

```tsx
<div className="hidden md:block mobile-scroll-x">
  <table>...</table>
</div>
```

Sur mobile, utiliser `MobileDataCards`.

## Formulaires

Utiliser :

```tsx
<div className="mobile-form-grid">
  ...
</div>
```

Les actions finales peuvent utiliser :

```tsx
<div className="mobile-sticky-actions mobile-actions-stack">
  ...
</div>
```

## Ordre des pages à corriger

1. `/dashboard`
2. `/public-requests`
3. `/attendance/scanner`
4. `/members`
5. `/settings/users`
6. `/finance`
7. `/finance/donations`
8. `/extensions`
9. `/administration/*`
10. `/patrimony/*`

## Tests obligatoires

- 320 × 568
- 360 × 800
- 390 × 844
- 412 × 915
- orientation portrait
- clavier mobile ouvert sur les formulaires
- menu supérieur ouvert
- aucun texte masqué
- aucun bouton hors écran
