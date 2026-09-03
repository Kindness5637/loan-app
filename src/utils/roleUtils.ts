// Role bit values based on backend API response
export const ROLE_BITS = {
  SYSTEM_ADMINISTRATOR: 1,
  LOAN_OFFICER: 2,
  APPROVER: 4,
  CLIENT: 8,
  AUDITOR: 16,
} as const;

// Role value mappings
export const ROLES = {
  system_administrator: ROLE_BITS.SYSTEM_ADMINISTRATOR,
  loan_officer: ROLE_BITS.LOAN_OFFICER,
  approver: ROLE_BITS.APPROVER,
  client: ROLE_BITS.CLIENT,
  auditor: ROLE_BITS.AUDITOR,
} as const;

/**
 * Check if user has a specific role
 * @param roles - User's roles bitmask from backend
 * @param roleToCheck - Role bit value to check for
 * @returns boolean indicating if user has the role
 */
export function hasRole(roles: number, roleToCheck: number): boolean {
  return (roles & roleToCheck) !== 0;
}

/**
 * Check if user has only the client role (and no other roles)
 * @param roles - User's roles bitmask from backend
 * @returns boolean indicating if user is client-only
 */
export function isClientOnly(roles: number | undefined): boolean {
  // console.log('🔍 isClientOnly called with:', {
  //   roles,
  //   type: typeof roles,
  //   CLIENT_BIT: ROLE_BITS.CLIENT,
  //   strictEqual: roles === ROLE_BITS.CLIENT,
  //   looseEqual: roles == ROLE_BITS.CLIENT,
  // });

  if (roles === undefined || roles === null) {
    // console.warn('⚠️ isClientOnly: roles is undefined or null');
    return false;
  }

  // Handle string conversion if needed
  const rolesNum = typeof roles === 'string' ? Number(roles) : roles;
  
  if (isNaN(rolesNum)) {
    // console.error('❌ isClientOnly: Invalid roles value', roles);
    return false;
  }

  const result = rolesNum === ROLE_BITS.CLIENT;
  // console.log('✅ isClientOnly result:', result);
  
  return result;
}

/**
 * Check if user should be redirected to admin dashboard
 * This is true for any user who has roles other than just client
 * @param roles - User's roles bitmask from backend
 * @returns boolean indicating if user should access admin dashboard
 */
export function shouldAccessAdminDashboard(roles: number): boolean {
  return !isClientOnly(roles);
}

/**
 * Get array of role names that user has
 * @param roles - User's roles bitmask from backend
 * @returns array of role names
 */
export function getUserRoleNames(roles: number): string[] {
  const roleNames: string[] = [];

  if (hasRole(roles, ROLE_BITS.SYSTEM_ADMINISTRATOR)) {
    roleNames.push("System Administrator");
  }
  if (hasRole(roles, ROLE_BITS.LOAN_OFFICER)) {
    roleNames.push("Loan Officer");
  }
  if (hasRole(roles, ROLE_BITS.APPROVER)) {
    roleNames.push("Approver/Manager");
  }
  if (hasRole(roles, ROLE_BITS.CLIENT)) {
    roleNames.push("Client/Member");
  }
  if (hasRole(roles, ROLE_BITS.AUDITOR)) {
    roleNames.push("Auditor");
  }

  return roleNames;
}

/**
 * Determine the appropriate dashboard route based on user roles
 * @param roles - User's roles bitmask from backend
 * @returns route string for navigation
 */
export function getDashboardRoute(roles: number): string {
  const route = isClientOnly(roles) ? "/client" : "/";
  // console.log('🔍 getDashboardRoute:', { roles, route });
  return route;
}

/**
 * Determine the appropriate view type based on user roles
 * @param roles - User's roles bitmask from backend
 * @returns view type for context initialization
 */
export function getViewType(roles: number): "admin" | "client" {
  const viewType = isClientOnly(roles) ? "client" : "admin";
  // console.log('🔍 getViewType:', { roles, viewType });
  return viewType;
}

/**
 * Check if user can access admin features
 * @param roles - User's roles bitmask from backend
 * @returns boolean indicating if user has admin access
 */
export function canAccessAdmin(roles: number): boolean {
  return (
    hasRole(roles, ROLE_BITS.SYSTEM_ADMINISTRATOR) ||
    hasRole(roles, ROLE_BITS.LOAN_OFFICER) ||
    hasRole(roles, ROLE_BITS.APPROVER) ||
    hasRole(roles, ROLE_BITS.AUDITOR)
  );
}

/**
 * Check if user can switch between views
 * Users with multiple roles (including client) can switch views
 * @param roles - User's roles bitmask from backend
 * @returns boolean indicating if user can switch views
 */
export function canSwitchViews(roles: number): boolean {
  const hasClientRole = hasRole(roles, ROLE_BITS.CLIENT);
  const hasOtherRoles = canAccessAdmin(roles);
  return hasClientRole && hasOtherRoles;
}