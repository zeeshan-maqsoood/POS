import { UserRole, type Permission } from '@/hooks/use-permissions';

// Define required permissions for each route/feature
export const PERMISSIONS = {
  // Menu
  MENU_VIEW: 'MENU_READ',
  MENU_MANAGE: ['MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE'],
  
  // Orders
  ORDERS_VIEW: 'ORDER_READ',
  ORDERS_MANAGE: ['ORDER_CREATE', 'ORDER_UPDATE', 'ORDER_DELETE'],
  
  // Products
  PRODUCTS_VIEW: 'PRODUCT_READ',
  PRODUCTS_MANAGE: ['PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE'],
  
  // Users
  USERS_VIEW: 'USER_READ',
  USERS_MANAGE: ['USER_CREATE', 'USER_UPDATE', 'USER_DELETE'],
  
  // Managers
  MANAGERS_VIEW: 'MANAGER_READ',
  MANAGERS_MANAGE: ['MANAGER_CREATE', 'MANAGER_UPDATE', 'MANAGER_DELETE'],
} as const;

// Check if user has required permissions
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission | Permission[]
): boolean => {
  if (!userPermissions || !userPermissions.length) return false;
  
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some(perm => userPermissions.includes(perm));
  }
  
  return userPermissions.includes(requiredPermission);
};

// Check if user has any of the required permissions
export const hasAnyPermission = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => {
  if (!userPermissions || !userPermissions.length) return false;
  return requiredPermissions.some(perm => userPermissions.includes(perm));
};

// Check if user has all required permissions
export const hasAllPermissions = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => {
  if (!userPermissions || !userPermissions.length) return false;
  return requiredPermissions.every(perm => userPermissions.includes(perm));
};
