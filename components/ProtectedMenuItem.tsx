import { ReactNode } from 'react';
import { usePermissions, type UserRoleType } from '@/hooks/use-permissions';
import { hasPermission as checkPermission } from '@/utils/permissions';

interface ProtectedMenuItemProps {
  children: ReactNode;
  requiredPermission?: string | string[];
  requiredRole?: UserRoleType | UserRoleType[];
  showIfUnauthorized?: boolean;
}

export const ProtectedMenuItem = ({
  children,
  requiredPermission,
  requiredRole,
  showIfUnauthorized = false,
}: ProtectedMenuItemProps) => {
  const { 
    hasPermission: userHasPermission,
    hasRole,
    isLoading 
  } = usePermissions();

  if (isLoading) {
    return null; // Or a loading spinner if you prefer
  }

  // If no restrictions, show the item
  if (!requiredPermission && !requiredRole) {
    return <>{children}</>;
  }

  // Check role-based access
  const hasRoleAccess = requiredRole ? hasRole(requiredRole) : true;
  
  // Check permission-based access
  const hasPermAccess = requiredPermission 
    ? userHasPermission(requiredPermission)
    : true;

  // Show the item if user has required role AND (if specified) required permission
  const shouldShow = hasRoleAccess && hasPermAccess;

  if (shouldShow) {
    return <>{children}</>;
  }

  // If we should show something when unauthorized (like a disabled button)
  if (showIfUnauthorized) {
    return <div className="opacity-50 cursor-not-allowed">{children}</div>;
  }

  return null;
};
