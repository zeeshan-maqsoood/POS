import { Permission } from '@prisma/client';
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore

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
    
    READ: 'POS_READ' as const,
    UPDATE: 'POS_UPDATE' as const,
   
  },
  manager:{
    READ: 'MANAGER_READ' as const,
    CREATE: 'MANAGER_CREATE' as const,
    UPDATE: 'MANAGER_UPDATE' as const,
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
    PermissionGroups.POS.READ,
    PermissionGroups.POS.UPDATE,
    PermissionGroups.manager.READ,
    PermissionGroups.manager.CREATE,
    PermissionGroups.manager.UPDATE,
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
