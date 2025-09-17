'use client';

import { ReactNode, useEffect, ComponentType, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, type Permission, type UserRoleType } from '@/hooks/use-permissions';

// Client-side only component to handle permission checks
const ClientPermissionCheck = ({
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
}: WithPermissionProps) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasRole,
    isLoading, 
    isAuthenticated 
  } = usePermissions();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If no permissions are required, render children
  if (!requiredPermission && !anyPermission && !requiredRole) {
    return <>{children}</>;
  }

  // On initial render, don't show anything until we've determined permissions
  if (!isMounted) {
    return <>{loadingComponent}</>;
  }

  // Show loading state while checking permissions
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // Check permissions and roles
  const hasRequiredPermission = !requiredPermission || hasPermission(requiredPermission);
  const hasRequiredRole = !requiredRole || hasRole(requiredRole);
  const hasAnyPerm = !anyPermission || hasAnyPermission(anyPermission);
  
  const hasAccess = hasRequiredPermission && hasRequiredRole && hasAnyPerm;

  // Redirect if user doesn't have access
  if (!hasAccess && isMounted) {
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
};

interface WithPermissionProps {
  children: ReactNode;
  requiredPermission?: Permission | Permission[];
  requiredRole?: UserRoleType | UserRoleType[];
  anyPermission?: Permission[];
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

// Server component wrapper that renders the client component
export function WithPermission(props: WithPermissionProps) {
  // On the server, render a loading state or nothing
  if (typeof window === 'undefined') {
    return props.loadingComponent || null;
  }
  
  // On the client, render the permission check
  return <ClientPermissionCheck {...props} />;
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
