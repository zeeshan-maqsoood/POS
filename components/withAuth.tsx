'use client';

import { ComponentType } from 'react';
import { WithPermission as WithPermissionComponent } from './auth/with-permission';
import { type Permission, type UserRoleType } from '@/hooks/use-permissions';

/**
 * Higher-Order Component for protecting routes with authentication and authorization
 * @deprecated Use the <WithPermission> component instead for better performance and consistency
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: {
    requiredPermission?: Permission | Permission[];
    requiredRole?: UserRoleType | UserRoleType[];
    redirectTo?: string;
  } = {}
) {
  const { requiredPermission, requiredRole, redirectTo = '/unauthorized' } = options;

  function WithAuthWrapper(props: P) {
    return (
      <WithPermissionComponent
        requiredPermission={requiredPermission}
        requiredRole={requiredRole}
        redirectTo={redirectTo}
      >
        <WrappedComponent {...props} />
      </WithPermissionComponent>
    );
  }

  return WithAuthWrapper;
}