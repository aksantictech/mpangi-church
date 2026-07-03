export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  CHURCH_ADMIN: "church_admin",
  PASTOR: "pastor",
  DEPARTMENT_LEADER: "department_leader",
  WORKER: "worker",
  MEMBER: "member",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];