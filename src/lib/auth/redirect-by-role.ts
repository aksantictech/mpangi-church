export function getDashboardPathByRole(role?: string | null) {
  if (role === "super_admin") {
    return "/super-admin/dashboard";
  }

  return "/dashboard";
}