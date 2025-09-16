import { useState, useEffect, useCallback, useMemo } from 'react';
import profileApi, { Profile } from '@/lib/profile-api';

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

export const usePermissions = (): UsePermissionsReturn => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const response = await profileApi.getProfile();
      const profileData = response.data.data; // Extract the actual profile data
      console.log('Profile data received:', profileData);
      
      if (profileData) {
        const role = (profileData.role || 'CUSTOMER') as UserRoleType;
        
        // Use permissions from profile if they exist, otherwise use role-based defaults
        let permissions: Permission[] = [];
        
        if (profileData.permissions && Array.isArray(profileData.permissions)) {
          // Use permissions from profile
          permissions = profileData.permissions.filter((p): p is Permission => 
            typeof p === 'string' && (p as string).includes('_')
          );
          console.log('Using permissions from profile:', permissions);
        } else {
          // Fall back to role-based permissions
          console.log('No permissions in profile, using role-based permissions');
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
        
        setUser(userProfile);
        setPermissions(permissions);
        
        // Store minimal user data in localStorage for initial load
        localStorage.setItem('user', JSON.stringify({
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role,
          permissions
        }));
        
        console.log('User profile loaded:', {
          role,
          permissions,
          userProfile
        });
        
        return userProfile;
      }
      
      return null;
    } catch (err) {
      console.log(err,"err")
      const error = err instanceof Error ? err : new Error('Failed to fetch permissions');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // Try to get user from localStorage first for instant load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setPermissions(parsedUser.permissions || []);
      } catch (e) {
        console.error('Failed to parse stored user data', e);
        localStorage.removeItem('user');
      }
    }
    
    // Then fetch fresh data
    fetchProfile();
  }, [fetchProfile]);

  const hasPermission = useCallback((requiredPermission: Permission | Permission[]): boolean => {
    // If we're still loading, we can't determine permissions yet
    if (isLoading) {
      console.log('hasPermission: Still loading permissions');
      return false;
    }

    // If no permissions are required, grant access
    if (!requiredPermission) {
      console.log('hasPermission: No permission required, granting access');
      return true;
    }

    // If no permissions are set, deny access
    if (!permissions || permissions.length === 0) {
      console.log('hasPermission: No permissions available, denying access');
      return false;
    }

    // Handle array of required permissions (OR condition)
    if (Array.isArray(requiredPermission)) {
      const hasAny = requiredPermission.some(p => {
        const has = permissions.includes(p);
        console.log(`Checking permission ${p}: ${has}`);
        return has;
      });
      console.log(`hasPermission: Any of [${requiredPermission.join(', ')}] = ${hasAny}`);
      return hasAny;
    }
    
    // Handle single permission
    const has = permissions.includes(requiredPermission);
    console.log(`hasPermission: ${requiredPermission} = ${has}`);
    return has;
  }, [permissions, isLoading]);

  const hasAnyPermission = useCallback((requiredPermissions: Permission[]): boolean => {
    if (isLoading) return false;
    return requiredPermissions.some(p => permissions.includes(p));
  }, [permissions, isLoading]);

  const hasRole = useCallback((role: UserRoleType | UserRoleType[]): boolean => {
    // If we're still loading or user is not available, we can't determine role
    if (isLoading) {
      console.log('hasRole: Still loading user data');
      return false;
    }
    
    if (!user) {
      console.log('hasRole: No user data available');
      return false;
    }
    
    // Handle array of roles (OR condition)
    if (Array.isArray(role)) {
      const hasAny = role.includes(user.role);
      console.log(`hasRole: User role ${user.role} in [${role.join(', ')}] = ${hasAny}`);
      return hasAny;
    }
    
    // Handle single role
    const hasRoleCheck = user.role === role;
    console.log(`hasRole: User role ${user.role} === ${role} = ${hasRoleCheck}`);
    return hasRoleCheck;
  }, [user, isLoading]);

  // Memoize common permission checks
  const isAdmin = hasRole('ADMIN');
  const isManager = hasRole('MANAGER');
  const isStaff = hasRole('STAFF');
  
  // Permission checks for different resources
  const canViewUsers = hasPermission('USER_READ');
  const canManageUsers = hasPermission('USER_CREATE') || hasPermission('USER_UPDATE') || hasPermission('USER_DELETE');
  const canViewManagers = hasPermission('MANAGER_READ');
  const canManageManagers = hasPermission('MANAGER_CREATE') || hasPermission('MANAGER_UPDATE');
  const canViewProducts = hasPermission('PRODUCT_READ');
  const canManageProducts = hasPermission('PRODUCT_CREATE') || hasPermission('PRODUCT_UPDATE') || hasPermission('PRODUCT_DELETE');
  const canViewOrders = hasPermission('ORDER_READ');
  const canManageOrders = hasPermission('ORDER_CREATE') || hasPermission('ORDER_UPDATE') || hasPermission('ORDER_DELETE');
  const canViewMenu = hasPermission('MENU_READ');
  const canManageMenu = hasPermission('MENU_CREATE') || hasPermission('MENU_UPDATE') || hasPermission('MENU_DELETE');

  const isAuthenticated = !!user;
  
  return {
    // State
    user,
    permissions,
    isLoading,
    error,
    isAuthenticated,
    
    // Actions
    refresh: fetchProfile,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasRole,
    
    // Role helpers
    isAdmin,
    isManager,
    isStaff,
    
    // Common permission checks
    canViewUsers,
    canManageUsers,
    canViewManagers,
    canManageManagers,
    canViewProducts,
    canManageProducts,
    canViewOrders,
    canManageOrders,
    canViewMenu,
    canManageMenu,
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