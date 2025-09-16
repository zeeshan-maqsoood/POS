'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePermissions, type Permission, type UserRoleType } from '@/hooks/use-permissions';
import { useCheckPermission } from '@/utils/permission-utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission | Permission[];
  requiredRole?: UserRoleType | UserRoleType[];
  redirectTo?: string;
  showForbidden?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  redirectTo = '/login',
  showForbidden = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  
  const { canAccess, isAuthenticated, isLoading } = useCheckPermission();
  const { user } = usePermissions();

  const hasRequiredAccess = () => {
    return canAccess({
      permission: requiredPermission,
      role: requiredRole
    });
  };

  useEffect(() => {
    // Only run on client side
    if (!isClient) return;

    // If still loading, wait
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      // Store the current URL for redirecting back after login
      const callbackUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      router.replace(`${redirectTo}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // If user is authenticated but doesn't have required access
    if (!hasRequiredAccess()) {
      if (showForbidden) {
        // Show forbidden message or redirect to a forbidden page
        router.replace('/forbidden');
      } else {
        // Redirect to home or another safe page
        router.replace('/');
      }
    }
  }, [user, isLoading, isClient, pathname, searchParams, redirectTo, showForbidden, router]);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state
  if (isLoading || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user is authenticated and has required access
  const hasAccess = hasRequiredAccess();

  // Show forbidden state if needed
  if (isAuthenticated && !hasAccess && showForbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  // Show children only if authenticated and has access
  return isAuthenticated && hasAccess ? <>{children}</> : null;
}
