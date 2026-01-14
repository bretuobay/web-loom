export const USER_ROLES = ['member', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const formatUserRole = (role: UserRole) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};
