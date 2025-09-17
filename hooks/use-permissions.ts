import { useState, useEffect, useCallback, useMemo } from 'react';
import profileApi, { Profile } from '@/lib/profile-api';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define permission action types
type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

// Define resource types
type Resource = 'USER' | 'ORDER' | 'PRODUCT' | 'MENU' | 'MANAGER' | string;

// Create a type for dynamic permission strings
type DynamicPermission<T extends string> = `${Uppercase<T>}_${PermissionAction}`;

// Base permission type that includes both static and dynamic permissions
type BasePermission = 
  | 'USER_CREATE' | 'USER_READ' | 'USER_UPDATE' | 'USER_DELETE'
  | 'ORDER_CREATE' | 'ORDER_READ' | 'ORDER_UPDATE' | 'ORDER_DELETE'
  | 'PRODUCT_READ' | 'PRODUCT_CREATE' | 'PRODUCT_UPDATE' | 'PRODUCT_DELETE'
  | 'MENU_READ' | 'MENU_CREATE' | 'MENU_UPDATE' | 'MENU_DELETE'
  | 'MANAGER_READ' | 'MANAGER_CREATE' | 'MANAGER_UPDATE'
  | DynamicPermission<Resource>;

// Export the base permission type
export type Permission = BasePermission;

// Extend the Profile interface to include permissions
export interface UserProfile extends Omit<Profile, 'role'> {
  role: UserRoleType;
  permissions: Permission[];
}

// Export UserRole as both a type and a value
export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER'
} as const;

// Export the UserRoleType for use in other files
export type UserRoleType = keyof typeof UserRole;

interface UsePermissionsReturn {
  // State
  user: UserProfile | null;
  permissions: Permission[];
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  
  // Actions
  refresh: () => Promise<UserProfile | null>;
  
  // Permission checks
  hasPermission: (requiredPermission: Permission | Permission[]) => boolean;
  hasAnyPermission: (requiredPermissions: Permission[]) => boolean;
  hasRole: (role: UserRoleType | UserRoleType[]) => boolean;
  
  // Role helpers
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  
  // Common permission checks
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewManagers: boolean;
  canManageManagers: boolean;
  canViewProducts: boolean;
  canManageProducts: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;
  canViewMenu: boolean;
  canManageMenu: boolean;
}

// Helper to check if we're in a browser environment

// Default permissions for server-side rendering
const DEFAULT_PERMISSIONS: Permission[] = [];

export const usePermissions = (): UsePermissionsReturn => {
  const [state, setState] = useState<{
    user: UserProfile | null;
    permissions: Permission[];
    isLoading: boolean;
    error: Error | null;
  }>(() => ({
    user: null,
    permissions: DEFAULT_PERMISSIONS,
    isLoading: true,
    error: null,
  }));

  // Helper to update state safely
  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    // Don't fetch on server during build
    if (!isBrowser) {
      return null;
    }
    
    // Set loading state
    updateState({ isLoading: true, error: null });

    try {
      const response = await profileApi.getProfile();
      const profileData = response.data?.data; // Extract the actual profile data
      
      if (!profileData) {
        throw new Error('No profile data received');
      }
      
      const role = (profileData.role || 'CUSTOMER') as UserRoleType;
      
      // Use permissions from profile if they exist, otherwise use role-based defaults
      let permissions: Permission[] = [];
      
      if (profileData.permissions && Array.isArray(profileData.permissions)) {
        // Use permissions from profile
        permissions = profileData.permissions.filter((p): p is Permission => 
          typeof p === 'string' && p.includes('_')
        );
      } else {
        // Fall back to role-based permissions
        switch (role) {
          case 'ADMIN':
            permissions = [
              'USER_READ', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
              'ORDER_READ', 'ORDER_CREATE', 'ORDER_UPDATE', 'ORDER_DELETE',
              'PRODUCT_READ', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
              'MENU_READ', 'MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE',
              'MANAGER_READ', 'MANAGER_CREATE', 'MANAGER_UPDATE'
            ];
            break;
          case 'MANAGER':
            permissions = [
              'ORDER_READ', 'ORDER_UPDATE',
              'PRODUCT_READ', 'MENU_READ'
            ];
            break;
          case 'STAFF':
            permissions = [
              'ORDER_READ', 'ORDER_CREATE',
              'PRODUCT_READ', 'MENU_READ'
            ];
            break;
          default:
            permissions = [];
        }
      }
      
      // Create user profile with permissions
      const userProfile: UserProfile = {
        ...profileData,
        role,
        permissions
      };
      
      updateState({ user: userProfile, permissions, isLoading: false });
      
      // Store minimal user data in localStorage for initial load
      localStorage.setItem('user', JSON.stringify({
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        role,
        permissions
      }));
      
      return userProfile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch permissions');
      updateState({ error, isLoading: false });
      throw error;
    }
  }, []);

  useEffect(() => {
    // Only run this effect in the browser
    if (!isBrowser) {
      updateState({ isLoading: false });
      return;
    }
    
    // Try to get user from localStorage first for instant load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        updateState({ user: parsedUser, permissions: parsedUser.permissions || [], isLoading: false });
      } catch (e) {
        console.error('Failed to parse stored user data', e);
        localStorage.removeItem('user');
      }
    }
    
    // Then fetch fresh data from the server
    const loadProfile = async () => {
      try {
        await fetchProfile();
      } catch (err) {
        console.error('Failed to load profile:', err);
        updateState({ error: err instanceof Error ? err : new Error('Failed to load profile'), isLoading: false });
      }
    };
    
    loadProfile();
  }, [fetchProfile, isBrowser]);

  const hasPermission = useCallback((requiredPermission: Permission | Permission[]): boolean => {
    // On server, default to most restrictive permissions
    if (!isBrowser || state.isLoading) {
      return false;
    }
    
    // If no permissions are required, grant access
    if (!requiredPermission) {
      return true;
    }

    // If no permissions are set, deny access
    if (!state.permissions || state.permissions.length === 0) {
      return false;
    }

    // Handle array of required permissions (OR condition)
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(p => state.permissions.includes(p));
    }
    
    // Handle single permission
    return state.permissions.includes(requiredPermission);
  }, [state.permissions, state.isLoading]);

  const hasAnyPermission = useCallback((requiredPermissions: Permission[]): boolean => {
    // On server, default to most restrictive permissions
    if (!isBrowser || state.isLoading) {
      return false;
    }
    return requiredPermissions.some(p => state.permissions.includes(p));
  }, [state.permissions, state.isLoading]);

  const hasRole = useCallback((role: UserRoleType | UserRoleType[]): boolean => {
    // On server, default to most restrictive permissions
    if (!isBrowser || state.isLoading || !state.user) {
      return false;
    }
    
    if (!state.user) {
      return false;
    }
    
    // Handle array of roles (OR condition)
    if (Array.isArray(role)) {
      return role.includes(state.user.role);
    }
    
    // Handle single role
    return state.user.role === role;
  }, [state.user, state.isLoading]);

  // Memoized permission checks - ensure these are computed only when needed
  const permissionChecks = useMemo(() => {
    // If we're on the server or still loading, return all false
    if (!isBrowser || state.isLoading) {
      return {
        canViewUsers: false,
        canManageUsers: false,
        canViewManagers: false,
        canManageManagers: false,
        canViewProducts: false,
        canManageProducts: false,
        canViewOrders: false,
        canManageOrders: false,
        canViewMenu: false,
        canManageMenu: false,
      };
    }
    
    return {
      canViewUsers: hasPermission(['USER_READ', 'USER_UPDATE', 'USER_DELETE']),
      canManageUsers: hasPermission(['USER_CREATE', 'USER_UPDATE', 'USER_DELETE']),
      canViewManagers: hasPermission('MANAGER_READ'),
      canManageManagers: hasPermission(['MANAGER_CREATE', 'MANAGER_UPDATE']),
      canViewProducts: hasPermission('PRODUCT_READ'),
      canManageProducts: hasPermission(['PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE']),
      canViewOrders: hasPermission('ORDER_READ'),
      canManageOrders: hasPermission(['ORDER_UPDATE', 'ORDER_DELETE']),
      canViewMenu: hasPermission('MENU_READ'),
      canManageMenu: hasPermission(['MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE']),
    };
  }, [state.isLoading, hasPermission]);

  const isAuthenticated = !!state.user;
  
  // Only fetch profile on the client side
  useEffect(() => {
    if (isBrowser) {
      fetchProfile();
    }
  }, [isBrowser]);

  return {
    // State
    user: state.user,
    permissions: state.permissions,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: !!state.user,
    
    // Actions
    refresh: fetchProfile,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasRole,
    
    // Role helpers
    isAdmin: hasRole('ADMIN'),
    isManager: hasRole('MANAGER'),
    isStaff: hasRole('STAFF'),
    
    // Permission checks
    ...permissionChecks,
  };
};

/**
 * Hook to check permissions for any resource dynamically
 * @param resource The resource to check permissions for (e.g., 'user', 'product', 'order')
 * @returns Object with permission check functions and common flags
 */
export const useResourcePermissions = <T extends string>(resource: T) => {
  const { hasPermission, isLoading } = usePermissions();
  
  // Memoize the permission checkers to prevent unnecessary recalculations
  const permissions = useMemo(() => {
    const resourceUpper = resource.toUpperCase() as Uppercase<T>;
    
    return {
      canView: () => hasPermission(`${resourceUpper}_READ` as const),
      canCreate: () => hasPermission(`${resourceUpper}_CREATE` as const),
      canUpdate: () => hasPermission(`${resourceUpper}_UPDATE` as const),
      canDelete: () => hasPermission(`${resourceUpper}_DELETE` as const),
      canManage: () => 
        hasPermission([
          `${resourceUpper}_CREATE`,
          `${resourceUpper}_UPDATE`,
          `${resourceUpper}_DELETE`
        ] as const),
    };
  }, [resource, hasPermission]);
  
  return {
    ...permissions,
    isLoading,
    // Aliases for common patterns
    canViewResource: permissions.canView,
    canManageResource: permissions.canManage,
  };
};

// Example usage with orders
export const useOrderPermissions = () => {
  const {
    isLoading,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canManage,
  } = useResourcePermissions('order');
  
  return {
    isLoading,
    canViewOrders: canView,
    canCreateOrder: canCreate,
    canUpdateOrder: canUpdate,
    canDeleteOrder: canDelete,
    canManageOrders: canManage,
  };
};

// Example usage with users
export const useUserPermissions = () => {
  const {
    isLoading,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canManage,
  } = useResourcePermissions('user');
  
  return {
    isLoading,
    canViewUsers: canView,
    canCreateUser: canCreate,
    canUpdateUser: canUpdate,
    canDeleteUser: canDelete,
    canManageUsers: canManage,
  };
};