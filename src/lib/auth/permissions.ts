import { USER_ROLES, type UserRole } from "@/lib/constants/roles";

export function isSuperAdmin(role?: UserRole | null) {
  return role === USER_ROLES.SUPER_ADMIN;
}

export function isChurchAdmin(role?: UserRole | null) {
  return role === USER_ROLES.CHURCH_ADMIN;
}

export function canManageChurch(role?: UserRole | null) {
  if (!role) return false;

  const allowedRoles: UserRole[] = [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.CHURCH_ADMIN,
    USER_ROLES.PASTOR,
  ];

  return allowedRoles.includes(role);
}

export function canManageAttendance(role?: UserRole | null) {
  if (!role) return false;

  const allowedRoles: UserRole[] = [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.CHURCH_ADMIN,
    USER_ROLES.PASTOR,
  ];

  return allowedRoles.includes(role);
}