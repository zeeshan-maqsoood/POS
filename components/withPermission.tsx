import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions, type UserRoleType, type Permission } from '@/hooks/use-permissions';
import { Loader2 } from 'lucide-react';

interface WithPermissionProps {
  requiredPermission?: Permission | Permission[];
  requiredRole?: UserRoleType | UserRoleType[];
  children: React.ReactNode;
  redirectTo?: string;
}

export const withPermission = ({
  requiredPermission,
  requiredRole,
  children,
  redirectTo = '/unauthorized',
}: WithPermissionProps) => {
  const router = useRouter();
  const { 
    hasPermission, 
    hasRole, 
    isLoading, 
    isAuthenticated 
  } = usePermissions();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const hasRequiredPermission = requiredPermission 
      ? hasPermission(requiredPermission)
      : true;

    const hasRequiredRole = requiredRole 
      ? hasRole(requiredRole as any)
      : true;

    if (!hasRequiredPermission || !hasRequiredRole) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, hasPermission, hasRole, requiredPermission, requiredRole, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // or redirect to login
  }

  // Check permissions again in case the check happens before the effect runs
  const hasRequiredPermission = requiredPermission 
    ? hasPermission(requiredPermission)
    : true;

  const hasRequiredRole = requiredRole 
    ? Array.isArray(requiredRole)
      ? requiredRole.some(role => hasRole(role as any))
      : hasRole(requiredRole as any)
    : true;
    console.log(hasRequiredRole,"hasRequiredRole")

  if (!hasRequiredPermission || !hasRequiredRole) {
    return null; // or show unauthorized message
  }

  return <>{children}</>;
};

export default withPermission;
