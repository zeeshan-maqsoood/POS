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
      allowed = hasAnyPermission(required);
    } else {
      allowed = hasPermission(required);
    }
  }

  if (allowed && anyOf && anyOf.length) {
    allowed = hasAnyPermission(anyOf);
  }

  try {
    // eslint-disable-next-line no-console
    console.debug('[PermissionGate] allowed =', allowed);
  } catch {}

  if (!allowed) {
    if (disableInsteadOfHide && React.isValidElement(children)) {
      // Try cloning with disabled prop if supported
      return React.cloneElement(children as any, { disabled: true, "aria-disabled": true });
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
