# Exemples de protection des Server Actions

## Création

```ts
"use server";

import { requireActionPermission } from "@/lib/security/secureAction";

export async function createMemberAction(formData: FormData) {
  const context = await requireActionPermission(
    "members",
    "create"
  );

  // Toujours utiliser context.churchId dans l’insertion.
}
```

## Modification

```ts
export async function updateExpenseAction(formData: FormData) {
  const context = await requireActionPermission(
    "expenses",
    "update"
  );

  const { error } = await admin
    .from("expenses")
    .update(payload)
    .eq("id", expenseId)
    .eq("church_id", context.churchId);
}
```

## Suppression

```ts
export async function deleteAssetAction(formData: FormData) {
  const context = await requireActionPermission(
    "assets",
    "delete"
  );

  await admin
    .from("assets")
    .delete()
    .eq("id", assetId)
    .eq("church_id", context.churchId);
}
```

## Validation

```ts
export async function approveDonationAction(formData: FormData) {
  const context = await requireActionPermission(
    "donations",
    "approve"
  );

  // Filtrer obligatoirement par church_id.
}
```

## Principe multi-église

Une permission ne remplace jamais le filtre de données.

Chaque mutation doit cumuler :

```ts
.eq("church_id", context.churchId)
```

et, lorsque pertinent :

```ts
.eq("assigned_to", context.userId)
```
