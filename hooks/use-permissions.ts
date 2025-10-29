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
  | 'DASHBOARD_READ'
  | DynamicPermission<Resource>;

// Export the base permission type
export type Permission = BasePermission;

// Extend the Profile interface to include permissions
export interface UserProfile extends Omit<Profile, 'role'> {
  role: UserRoleType;
  branch?: string;
  permissions: Permission[];
}

// Export UserRole as both a type and a value
export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  KITCHEN_STAFF: 'KITCHEN_STAFF',
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
  isKitchenStaff: boolean;
  
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
  
  // Menu and page access control
  canAccessPage: (page: string) => boolean;
  getFilteredMenuItems: () => Array<{
    title: string;
    path: string;
    icon: string;
    requiredPermission?: string | string[];
    children?: Array<{
      title: string;
      path: string;
      requiredPermission?: string | string[];
    }>;
  }>;
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
  }>(() => {
    // Synchronously hydrate from localStorage to avoid initial render delay/flicker
    if (isBrowser) {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('Loaded user from localStorage:', parsed);
          console.log('Loaded permissions from localStorage:', parsed.permissions);
          return {
            user: parsed,
            permissions: Array.isArray(parsed?.permissions) ? parsed.permissions : DEFAULT_PERMISSIONS,
            isLoading: false,
            error: null,
          };
        }
      } catch (e) {
        console.warn('Failed to parse stored user for permissions hydration:', e);
      }
    }
    return {
      user: null,
      permissions: DEFAULT_PERMISSIONS,
      isLoading: true,
      error: null,
    };
  });

  // Helper to update state safely
  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const fetchProfile = useCallback(async (forceRefresh = false): Promise<UserProfile | null> => {
    // Don't fetch on server during build
    if (!isBrowser) {
      return null;
    }

    // Set loading state
    updateState({ isLoading: true, error: null });

    try {
      // Always fetch fresh data from server when forceRefresh is true
      const response = await profileApi.getProfile();
      
      const profileData = response.data?.data; // Extract the actual profile data
      console.log('Fetched profile data:', profileData);
      
      if (!profileData) {
        throw new Error('No profile data received');
      }

      const role = (profileData.role || 'CUSTOMER') as UserRoleType;

      // Always use permissions from profile if they exist, never fall back to defaults
      let permissions: Permission[] = [];

      if (profileData.permissions && Array.isArray(profileData.permissions)) {
        // Use permissions from profile
        console.log('Raw permissions from profile:', profileData.permissions);
        permissions = profileData.permissions.filter((p): p is Permission =>
          typeof p === 'string' && p.includes('_')
        );
        console.log('Filtered permissions:', permissions);
      } else {
        console.warn('No permissions found in profile data');
        // Don't set default permissions here to avoid overriding server permissions
      }

      // Create user profile with permissions
      const userProfile: UserProfile = {
        ...profileData,
        role,
        permissions
      };

      // Update state with the new user data
      updateState({
        user: userProfile,
        permissions,
        isLoading: false,
        error: null,
      });

      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userProfile));

      return userProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      updateState({
        error: error instanceof Error ? error : new Error('Failed to fetch profile'),
        isLoading: false,
      });
      return null;
    }
  }, []);

  useEffect(() => {
    // Only run this effect in the browser
    if (!isBrowser) {
      updateState({ isLoading: false });
      return;
    }

    // Fetch profile to ensure we have the latest permissions
    fetchProfile();
  }, [isBrowser, fetchProfile]);

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

    // ADMIN users have access to everything
    if (state.user?.role === 'ADMIN') {
      console.log('Admin user detected, granting all permissions');
      return true;
    }

    // Handle array of required permissions (OR condition)
    if (Array.isArray(requiredPermission)) {
      const result = requiredPermission.some(p => state.permissions.includes(p));
      console.log(`Checking permissions [${requiredPermission.join(', ')}]:`, result, 'Current permissions:', state.permissions);
      return result;
    }

    // Handle single permission
    const result = state.permissions.includes(requiredPermission);
    console.log(`Checking permission ${requiredPermission}:`, result, 'Current permissions:', state.permissions);
    return result;
  }, [state.permissions, state.isLoading, state.user]);

  const hasAnyPermission = useCallback((requiredPermissions: Permission[]): boolean => {
    // On server, default to most restrictive permissions
    if (!isBrowser || state.isLoading) {
      return false;
    }

    // ADMIN users have access to everything
    if (state.user?.role === 'ADMIN') {
      console.log('Admin user detected, granting all permissions');
      return true;
    }

    return requiredPermissions.some(p => state.permissions.includes(p));
  }, [state.permissions, state.isLoading, state.user]);

  const hasRole = useCallback((role: UserRoleType | UserRoleType[]): boolean => {
    // On server, default to most restrictive permissions
    if (!isBrowser || state.isLoading || !state.user) {
      console.log('hasRole: Not in browser, loading, or no user');
      return false;
    }
    
    console.log('hasRole called with role:', role);
    console.log('User role from state:', state.user.role);
    console.log('User object from state:', state.user);
    
    // Normalize the user's role to uppercase for comparison
    const userRole = state.user.role?.toUpperCase();
    
    // Handle array of roles (OR condition)
    if (Array.isArray(role)) {
      const normalizedRoles = role.map(r => r.toUpperCase());
      const hasRole = normalizedRoles.includes(userRole);
      console.log(`Checking if user has any of roles [${normalizedRoles.join(', ')}]:`, hasRole);
      return hasRole;
    }
    
    // Handle single role
    const hasSingleRole = userRole === role.toUpperCase();
    console.log(`Checking if user has role ${role}:`, hasSingleRole);
    return hasSingleRole;
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

    // ADMIN users have access to everything
    if (state.user?.role === 'ADMIN') {
      return {
        canViewUsers: true,
        canManageUsers: true,
        canViewManagers: true,
        canManageManagers: true,
        canViewProducts: true,
        canManageProducts: true,
        canViewOrders: true,
        canManageOrders: true,
        canViewMenu: true,
        canManageMenu: true,
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
  }, [state.isLoading, hasPermission, state.user]);

  const isAdmin = hasRole('ADMIN');
  const isManager = hasRole('MANAGER');
  const isKitchenStaff = hasRole('KITCHEN_STAFF');

  const canViewUsers = hasPermission('USER_READ');
  const canManageUsers = hasAnyPermission(['USER_CREATE', 'USER_UPDATE', 'USER_DELETE']);
  const canViewManagers = hasPermission('MANAGER_READ');
  const canManageManagers = hasAnyPermission(['MANAGER_CREATE', 'MANAGER_UPDATE']);
  const canViewProducts = hasPermission('PRODUCT_READ');
  const canManageProducts = hasAnyPermission(['PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE']);
  const canViewOrders = hasPermission('ORDER_READ');
  const canManageOrders = hasAnyPermission(['ORDER_CREATE', 'ORDER_UPDATE', 'ORDER_DELETE']);
  const canViewMenu = hasPermission('MENU_READ');
  const canManageMenu = hasAnyPermission(['MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE']);

  const canAccessPage = (page: string): boolean => {
  // Define page permissions with more specific paths
  const pagePermissions: Record<string, Permission | Permission[]> = {
    'dashboard': 'DASHBOARD_READ',
    'orders': ['ORDER_READ', 'ORDER_CREATE'],
    'pos': 'ORDER_CREATE',
    'orders/new': 'ORDER_CREATE',
    'orders/[id]': 'ORDER_READ',
    'orders/[id]/edit': 'ORDER_UPDATE',
    'menu': 'MENU_READ',
    'menu/items': 'MENU_READ',
    'menu/items/new': 'MENU_CREATE',
    'menu/items/[id]': 'MENU_READ',
    'menu/items/[id]/edit': 'MENU_UPDATE',
    'menu/categories': 'MENU_READ',
    'menu/categories/new': 'MENU_CREATE',
    'menu/categories/[id]': 'MENU_READ',
    'menu/categories/[id]/edit': 'MENU_UPDATE',
    'users': 'USER_READ',
    'users/new': 'USER_CREATE',
    'users/[id]': 'USER_READ',
    'users/[id]/edit': 'USER_UPDATE',
    'managers': 'MANAGER_READ',
    'managers/new': 'MANAGER_CREATE',
    'managers/[id]': 'MANAGER_READ',
    'managers/[id]/edit': 'MANAGER_UPDATE',
  };

  // Admin has access to everything
  if (state.user?.role === 'ADMIN') {
    console.log('Admin access granted to:', page);
    return true;
  }

  const requiredPermission = pagePermissions[page];
  
  // Debug log
  console.log('Permission check:', {
    page,
    requiredPermission,
    userPermissions: state.user?.permissions,
    hasAccess: requiredPermission 
      ? hasAnyPermission(Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission])
      : false
  });

  if (!requiredPermission) {
    console.warn(`No permission defined for page: ${page}. Access denied by default.`);
    return false; // Default deny if page not in the list
  }

  return hasAnyPermission(Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]);
};

  const getFilteredMenuItems = () => {
    type MenuItem = {
      title: string;
      path: string;
      icon: string;
      requiredPermission?: Permission | Permission[];
      children?: Array<{
        title: string;
        path: string;
        requiredPermission?: Permission | Permission[];
      }>;
    };

    const allMenuItems: MenuItem[] = [
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: 'LayoutDashboard',
        requiredPermission: 'DASHBOARD_READ'
      },
      {
        title: 'Orders',
        path: '/orders',
        icon: 'ShoppingCart',
        requiredPermission: ['ORDER_READ', 'ORDER_CREATE'],
        children: [
          { 
            title: 'All Orders', 
            path: '/orders',
            requiredPermission: 'ORDER_READ'
          },
          { 
            title: 'New Order', 
            path: '/orders/new',
            requiredPermission: 'ORDER_CREATE'
          }
        ]
      },
      {
        title: 'Menu',
        path: '/menu/items',
        icon: 'Utensils',
        requiredPermission: 'MENU_READ',
        children: [
          { 
            title: 'Menu Items', 
            path: '/menu/items',
            requiredPermission: 'MENU_READ'
          },
          { 
            title: 'Add New Item', 
            path: '/menu/items/new',
            requiredPermission: 'MENU_CREATE'
          },
          { 
            title: 'Categories', 
            path: '/menu/categories',
            requiredPermission: 'MENU_READ'
          }
        ]
      },
      {
        title: 'Users',
        path: '/users',
        icon: 'Users',
        requiredPermission: 'USER_READ',
        children: [
          { 
            title: 'All Users', 
            path: '/users',
            requiredPermission: 'USER_READ'
          },
          { 
            title: 'Add User', 
            path: '/users/new',
            requiredPermission: 'USER_CREATE'
          }
        ]
      },
      {
        title: 'Managers',
        path: '/managers',
        icon: 'UserCog',
        requiredPermission: 'MANAGER_READ',
        children: [
          { 
            title: 'All Managers', 
            path: '/managers',
            requiredPermission: 'MANAGER_READ'
          },
          { 
            title: 'Add Manager', 
            path: '/managers/new',
            requiredPermission: 'MANAGER_CREATE'
          }
        ]
      }
    ];

    return allMenuItems.filter(item => {
      // Check if user has permission for this menu item
      const hasItemPermission = !item.requiredPermission || 
        hasAnyPermission(Array.isArray(item.requiredPermission) ? item.requiredPermission : [item.requiredPermission]);
      
      // If menu item has children, filter them as well
      if (item.children) {
        item.children = item.children.filter(child => 
          !child.requiredPermission || 
          hasAnyPermission(Array.isArray(child.requiredPermission) ? child.requiredPermission : [child.requiredPermission])
        );
        
        // Only show parent if it has any visible children or no children at all
        return hasItemPermission && (item.children.length > 0 || !item.requiredPermission);
      }
      
      return hasItemPermission;
    });
  };

  const isAuthenticated = !!state.user;
  
  // Only fetch profile on the client side
  useEffect(() => {
    if (isBrowser) {
      fetchProfile();
    }
  }, [isBrowser, fetchProfile]);

  return {
    // State
    user: state.user,
    permissions: state.permissions,
    isLoading: state.isLoading,
    error: state.error,
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
    isKitchenStaff,
    
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
    
    // Menu and page access control
    canAccessPage,
    getFilteredMenuItems,
    
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