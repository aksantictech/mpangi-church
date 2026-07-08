export {
  getChurchModuleAccess,
  getSecurityContext,
  requireActiveProfile,
  requireChurchAdmin,
  requireChurchModuleAccess,
  requireSameChurchProfile,
  requireSuperAdmin,
} from "@/lib/security/access";

export type {
  ModuleAccessResult,
  ModulePermission,
  PermissionAction,
  SecurityContext,
  SecurityProfile,
} from "@/lib/security/access";
