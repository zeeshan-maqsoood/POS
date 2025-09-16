'use client';

import { ReactNode, useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, type Permission, type UserRoleType } from '@/hooks/use-permissions';

interface WithPermissionProps {
  children: ReactNode;
  requiredPermission?: Permission | Permission[];
  requiredRole?: UserRoleType | UserRoleType[];
  anyPermission?: Permission[];
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export function WithPermission({
  children,
  requiredPermission,
  requiredRole,
  anyPermission,
  redirectTo = '/unauthorized',
  loadingComponent = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
}: WithPermissionProps) {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasRole,
    isLoading, 
    isAuthenticated 
  } = usePermissions();
  const router = useRouter();

  // If no permissions are required, render children
  if (!requiredPermission && !anyPermission) {
    return <>{children}</>;
  }

  // Show loading state while checking permissions
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // Check permissions and roles
  const hasRequiredPermission = !requiredPermission || hasPermission(requiredPermission);
  const hasRequiredRole = !requiredRole || hasRole(requiredRole);
  const hasAccess = hasRequiredPermission && hasRequiredRole;

  // Redirect if no access
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      router.replace(redirectTo);
    }
  }, [hasAccess, isLoading, redirectTo, router]);

  // If we don't have access, show nothing (will redirect)
  if (!hasAccess) {
    return null;
  }

  // If we have access, render children
  return <>{children}</>;
}

// HOC version for class components
export function withPermission<T extends Record<string, unknown>>(
  WrappedComponent: ComponentType<T>,
  options: Omit<WithPermissionProps, 'children'>
) {
  const Wrapper = (props: T) => (
    <WithPermission {...options}>
      <WrappedComponent {...props} />
    </WithPermission>
  );
  
  // Set a display name for better debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  Wrapper.displayName = `withPermission(${displayName})`;
  
  return Wrapper;
}
