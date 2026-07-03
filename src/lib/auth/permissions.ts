import { USER_ROLES, type UserRole } from "@/lib/constants/roles";

export function isSuperAdmin(role?: UserRole | null) {
  return role === USER_ROLES.SUPER_ADMIN;
}

export function isChurchAdmin(role?: UserRole | null) {
  return role === USER_ROLES.CHURCH_ADMIN;
}

export function canManageMembers(role?: UserRole | null) {
  return [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.CHURCH_ADMIN,
    USER_ROLES.PASTOR,
  ].includes(role as UserRole);
}

export function canManageAttendance(role?: UserRole | null) {
  return [
    USER_ROLES.CHURCH_ADMIN,
    USER_ROLES.PASTOR,
    USER_ROLES.DEPARTMENT_LEADER,
    USER_ROLES.WORKER,
  ].includes(role as UserRole);
}