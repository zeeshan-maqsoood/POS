'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions, Permission, UserRole, UserRoleType } from '@/hooks/use-permissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteWrapperProps {
  children: React.ReactNode;
  requiredPermission?: Permission | Permission[];
  requiredRole?: UserRoleType | UserRoleType[];
}

export function ProtectedRouteWrapper({
  children,
  requiredPermission,
  requiredRole,
}: ProtectedRouteWrapperProps) {
  const { hasPermission, hasRole, isLoading, isAuthenticated } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking auth
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check route-specific access
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const isPOSRoute = currentPath.includes('/pos');
  const isOrdersRoute = currentPath.includes('/orders');
  
  // Check if user has required permission
  const hasRequiredPermission = requiredPermission 
    ? hasPermission(requiredPermission)
    : true;
  
  // Explicitly deny KITCHEN_STAFF access to POS
  if (isPOSRoute && hasRole('KITCHEN_STAFF')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          This section is only accessible to managers.
        </p>
      </div>
    );
  }
  
  // Define the allowed roles that can access this route
  let hasRequiredRole = true; // Default to true if no role is required
  
  if (requiredRole) {
    // For orders route, allow both requiredRole and KITCHEN_STAFF
    if (isOrdersRoute) {
      hasRequiredRole = hasRole(requiredRole) || hasRole('KITCHEN_STAFF');
    } 
    // For all other routes, only check the required role
    else {
      hasRequiredRole = hasRole(requiredRole);
    }
  }

  // Show access denied if user doesn't have required permissions/role
  if (!hasRequiredPermission || !hasRequiredRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}
