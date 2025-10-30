"use client";

import React from "react";
import { usePermissions, type Permission, type UserRoleType } from "@/hooks/use-permissions";

export type PermissionGateProps = {
  children: React.ReactNode;
  required?: Permission | Permission[]; // ALL of these must be present if array? We'll treat as ANY to be ergonomic
  anyOf?: Permission[]; // explicit ANY list
  role?: UserRoleType | UserRoleType[];
  fallback?: React.ReactNode; // what to render if not permitted (default: null)
  /**
   * If true and child is a React element with `disabled` prop (e.g. Button),
   * we will render it disabled instead of hiding it.
   */
  disableInsteadOfHide?: boolean;
};

export function PermissionGate({
  children,
  required,
  anyOf,
  role,
  fallback = null,
  disableInsteadOfHide = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasRole, isLoading, permissions } = usePermissions();

  // Quick ADMIN fast-path using localStorage (avoids flicker for admins on first paint)
  let isAdminFromStorage = false;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        isAdminFromStorage = (parsed?.role || '').toString().toUpperCase() === 'ADMIN';
      }
    }
  } catch {}

  // While loading, allow ADMIN immediately; hide for others to avoid flashes
  if (isLoading && !isAdminFromStorage) return null;
  // Compute access
  let allowed = true;

  // If user is ADMIN, bypass all checks
  const isAdmin = isAdminFromStorage || hasRole('ADMIN');
  if (isAdmin) {
    console.log('[PermissionGate] User is admin, bypassing permission checks');
    return <>{children}</>;
  }

  try {
    // Debug logging to trace permission gates (remove in production if noisy)
    // eslint-disable-next-line no-console
    console.debug('[PermissionGate] check', {
      required,
      anyOf,
      role,
      currentPermissions: permissions,
    });
  } catch {}

  if (role) {
    allowed = hasRole(role);
  }

  if (allowed && required) {
    if (Array.isArray(required)) {
      // treat as ANY by default for UI actions; if you want strict ALL, pass via `anyOf` as needed
      const hasAny = hasAnyPermission(required);
      console.log(`[PermissionGate] Checking required permissions (ANY of):`, required);
      console.log(`[PermissionGate] Has any permission:`, hasAny);
      allowed = hasAny;
    } else {
      const hasPerm = hasPermission(required);
      console.log(`[PermissionGate] Checking required permission:`, required);
      console.log(`[PermissionGate] Has permission:`, hasPerm);
      allowed = hasPerm;
    }
  }

  if (allowed && anyOf && anyOf.length) {
    const hasAny = hasAnyPermission(anyOf);
    console.log(`[PermissionGate] Checking anyOf permissions:`, anyOf);
    console.log(`[PermissionGate] Has any of permissions:`, hasAny);
    allowed = hasAny;
  }

  try {
    // eslint-disable-next-line no-console
    console.debug('[PermissionGate] allowed =', allowed);
  } catch {}

  if (!allowed) {
    console.log('[PermissionGate] Access denied. Disabling or hiding element.');
    console.log('[PermissionGate] disableInsteadOfHide:', disableInsteadOfHide);
    console.log('[PermissionGate] isValidElement:', React.isValidElement(children));
    
    if (disableInsteadOfHide && React.isValidElement(children)) {
      // Try cloning with disabled prop if supported
      const cloned = React.cloneElement(children as any, { 
        disabled: true, 
        "aria-disabled": true,
        title: 'You do not have permission to perform this action.'
      });
      console.log('[PermissionGate] Cloned element with disabled state');
      return cloned;
    }
    console.log('[PermissionGate] Rendering fallback');
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
