import { usePermissions, type Permission, type UserRoleType } from '@/hooks/use-permissions';

export const useCheckPermission = () => {
  const { 
    hasPermission, 
    hasRole, 
    isAuthenticated,
    isLoading
  } = usePermissions();

  const checkPermission = (requiredPermission?: Permission | Permission[]) => {
    if (!requiredPermission) return true;
    return hasPermission(requiredPermission);
  };

  const checkRole = (requiredRole?: UserRoleType | UserRoleType[]) => {
    if (!requiredRole) return true;
    return hasRole(requiredRole);
  };

  const canAccess = (options: {
    permission?: Permission | Permission[];
    role?: UserRoleType | UserRoleType[];
  }) => {
    if (isLoading) return false;
    if (!isAuthenticated) return false;
    
    const hasPerm = checkPermission(options.permission);
    const hasRole = checkRole(options.role);
    
    return hasPerm && hasRole;
  };

  return {
    canAccess,
    checkPermission,
    checkRole,
    isAuthenticated,
    isLoading
  };
};
