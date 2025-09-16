'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export type Permission = 
  | 'USER_CREATE'
  | 'USER_READ'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'ORDER_CREATE'
  | 'ORDER_READ'
  | 'ORDER_UPDATE'
  | 'ORDER_DELETE'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_READ'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'MENU_CREATE'
  | 'MENU_READ'
  | 'MENU_UPDATE'
  | 'MENU_DELETE'
  | 'MANAGER_CREATE'
  | 'MANAGER_READ'
  | 'MANAGER_UPDATE';

type PermissionString = Permission | string;

type PermissionsContextType = {
  permissions: Permission[];
  hasPermission: (requiredPermission: Permission | Permission[]) => boolean;
  hasAnyPermission: (requiredPermissions: Permission[]) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ 
  children,
  permissions = [] 
}: { 
  children: ReactNode;
  permissions?: Permission[];
}) {
  const hasPermission = (requiredPermission: Permission | Permission[]): boolean => {
    if (!permissions) return false;
    
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(perm => permissions.includes(perm));
    }
    
    return permissions.includes(requiredPermission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (!permissions) return false;
    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, hasAnyPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
