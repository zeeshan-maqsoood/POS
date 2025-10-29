// Define Permission type locally since we can't import from Prisma in frontend
export type Permission =
  | 'USER_CREATE' | 'USER_READ' | 'USER_UPDATE' | 'USER_DELETE'
  | 'ORDER_CREATE' | 'ORDER_READ' | 'ORDER_UPDATE' | 'ORDER_DELETE'
  | 'MENU_CREATE' | 'MENU_READ' | 'MENU_UPDATE' | 'MENU_DELETE'
  | 'POS_CREATE' | 'POS_READ' | 'POS_UPDATE' | 'POS_DELETE'
  | 'MANAGER_CREATE' | 'MANAGER_READ' | 'MANAGER_UPDATE'
  | 'DASHBOARD_READ'

// Permission groups for easier management
export const PermissionGroups = {
  // User permissions
  USER: {
    CREATE: 'USER_CREATE' as const,
    READ: 'USER_READ' as const,
    UPDATE: 'USER_UPDATE' as const,
    DELETE: 'USER_DELETE' as const,
  },
  // Order permissions
  ORDER: {
    CREATE: 'ORDER_CREATE' as const,
    READ: 'ORDER_READ' as const,
    UPDATE: 'ORDER_UPDATE' as const,
    DELETE: 'ORDER_DELETE' as const,
  },
  // Menu permissions
  MENU: {
    CREATE: 'MENU_CREATE' as const,
    READ: 'MENU_READ' as const,
    UPDATE: 'MENU_UPDATE' as const,
    DELETE: 'MENU_DELETE' as const,
  },
  POS: {
    CREATE: 'POS_CREATE' as const,
    READ: 'POS_READ' as const,
    UPDATE: 'POS_UPDATE' as const,
    DELETE: 'POS_DELETE' as const,
  },
  manager:{
    READ: 'MANAGER_READ' as const,
    CREATE: 'MANAGER_CREATE' as const,
    UPDATE: 'MANAGER_UPDATE' as const,
  },
  inventory:{
    READ:"PRODUCT_READ" as const,
    CREATE:"PRODUCT_CREATE" as const,
    UPDATE:"PRODUCT_UPDATE" as const,
    DELETE:"PRODUCT_DELETE" as const,
  },
  DASHBOARD: {
    READ: 'DASHBOARD_READ' as const,
  }
} as const;

// Type for permission group
// export type PermissionGroup = keyof typeof PermissionGroups;

// Type for individual permission
// export type Permission = typeof PermissionGroups[keyof typeof PermissionGroups][keyof typeof PermissionGroups[keyof typeof PermissionGroups]];

// Default permissions for different roles
export const DefaultRolePermissions = {
  ADMIN: [
    ...Object.values(PermissionGroups.USER),
    ...Object.values(PermissionGroups.ORDER),
    ...Object.values(PermissionGroups.MENU),
    ...Object.values(PermissionGroups.POS),
  ],
  MANAGER: [
    PermissionGroups.USER.READ,
    PermissionGroups.ORDER.READ,
    PermissionGroups.ORDER.UPDATE,
    PermissionGroups.MENU.READ,
    PermissionGroups.MENU.CREATE,
    PermissionGroups.MENU.UPDATE,
    PermissionGroups.POS.READ,
    PermissionGroups.POS.UPDATE,
    PermissionGroups.manager.READ,
    PermissionGroups.manager.CREATE,
    PermissionGroups.manager.UPDATE,
    PermissionGroups.inventory.CREATE,
    PermissionGroups.inventory.UPDATE,
    PermissionGroups.inventory.READ,
    PermissionGroups.inventory.DELETE,
    PermissionGroups.DASHBOARD.READ
  ],
  CASHIER: [
    PermissionGroups.ORDER.READ,
    PermissionGroups.ORDER.UPDATE,
    PermissionGroups.POS.READ,
  ],
  WAITER: [
    PermissionGroups.ORDER.READ,
    PermissionGroups.ORDER.UPDATE,
    PermissionGroups.MENU.READ,
  ],
  KITCHEN_STAFF: [
    PermissionGroups.ORDER.READ,
    PermissionGroups.ORDER.UPDATE,
  ],
  USER: [
    PermissionGroups.ORDER.READ,
    PermissionGroups.MENU.READ,
    PermissionGroups.POS.READ,
  ],
} as const;

// Helper function to check if user has a specific permission
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission | Permission[]
): boolean => {
  if (!userPermissions || userPermissions.length === 0) return false;
  
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.every(perm => userPermissions.includes(perm));
  }
  
  return userPermissions.includes(requiredPermission);
};

// Helper to get all permissions
export const getAllPermissions = (): Permission[] => {
  return Object.values(PermissionGroups).flatMap(group => 
    Object.values(group)
  );
};

// Helper to get permission label
export const getPermissionLabel = (permission: Permission): string => {
  const [type, action] = permission.split('_');
  return `${type.charAt(0) + type.slice(1).toLowerCase()} ${action.toLowerCase()}`;
};
