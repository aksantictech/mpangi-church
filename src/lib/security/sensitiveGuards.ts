import { redirect } from "next/navigation";
import {
  getCurrentSecurityContext,
  type CurrentSecurityContext,
} from "@/lib/security/permissionEngine";

const CHURCH_ADMIN_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
]);

export async function requireAuthenticatedAccess() {
  return getCurrentSecurityContext();
}

export async function requireSuperAdminAccess() {
  const context = await getCurrentSecurityContext();

  if (context.role !== "super_admin") {
    redirect("/unauthorized?reason=super_admin_required");
  }

  return context;
}

export async function requireChurchAdministratorAccess() {
  const context = await getCurrentSecurityContext();

  if (!CHURCH_ADMIN_ROLES.has(context.role)) {
    redirect("/unauthorized?reason=church_admin_required");
  }

  return context;
}

export async function requireSameChurchAccess(
  targetChurchId: string | null | undefined
): Promise<CurrentSecurityContext> {
  const context = await getCurrentSecurityContext();

  if (context.role === "super_admin") {
    return context;
  }

  if (
    !targetChurchId ||
    !context.churchId ||
    targetChurchId !== context.churchId
  ) {
    redirect("/unauthorized?reason=cross_church_access");
  }

  return context;
}
