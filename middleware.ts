import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  userId?: string;
  role?: string;
  email?: string;
  permissions?: string[];
  [key: string]: any;
}

// Define protected routes
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/pos",
  "/profile"
];

// Map routes to required permissions
const routePermissions: Record<string, string[]> = {
  '/dashboard/orders': ['ORDER_READ'],
  '/dashboard/orders/[id]': ['ORDER_READ'],
  '/dashboard/menu': ['MENU_READ'],
  '/dashboard/menu/items': ['MENU_READ'],
  '/dashboard/menu/categories': ['MENU_READ'],
  '/dashboard/menu/modifiers': ['MENU_READ'],
  '/dashboard/managers': ['MANAGER_READ'],
  '/dashboard/managers/new': ['MANAGER_CREATE'],
  '/dashboard/managers/edit/[id]': ['MANAGER_UPDATE'],
  '/dashboard/users': ['USER_READ'],
  '/dashboard/users/new': ['USER_CREATE'],
  '/dashboard/users/edit/[id]': ['USER_UPDATE'],
  '/pos': ['POS_READ'],
};

// Get required permissions for a route
function getRequiredPermissions(pathname: string): string[] {
  // Find the most specific match in routePermissions
  const matchingRoute = Object.keys(routePermissions)
    .filter(route => {
      // Convert route pattern to regex
      const pattern = route
        .replace(/\[\w+\]/g, '[^/]+') // Convert [id] to [^/]+
        .replace(/\//g, '\\/'); // Escape slashes
      
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    })
    .sort((a, b) => b.length - a.length)[0]; // Get most specific match

  return matchingRoute ? routePermissions[matchingRoute] : [];
}

// Find the first dashboard page the user can access based on their permissions
function getFirstAccessibleDashboardPath(userPermissions: string[]): string | null {
  const dashboardCandidates = [
    '/dashboard/orders',
    '/dashboard/menu',
    '/dashboard/managers',
    '/dashboard/users',
  ];

  for (const path of dashboardCandidates) {
    const required = getRequiredPermissions(path);
    if (required.length === 0 || required.every(p => userPermissions.includes(p))) {
      return path;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL('/', request.url);
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Skip middleware for non-protected routes
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // If no token and trying to access a protected route, redirect to login
  if (!token) {
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      // For dashboard routes, just redirect to login without any query params
      return NextResponse.redirect(new URL('/', request.url));
    } else if (pathname !== '/') {
      // For other protected routes, include the redirect parameter
      loginUrl.search = '';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Log the token for debugging (remove in production)
    console.log('Token:', token);
    
    // Decode the token to get user info
    const decoded = jwtDecode<JwtPayload>(token);
    
    // Debug log the full decoded token with all its properties
    console.log('=== DECODED TOKEN ===');
    console.log('Full decoded token:', JSON.stringify(decoded, null, 2));
    console.log('Available properties:', Object.keys(decoded));
    console.log('Raw role value:', (decoded as any)?.role);
    console.log('Raw permissions:', (decoded as any)?.permissions);
    
    // Check both 'role' and 'role' in the root and in the 'data' object
    const userRole = (decoded as any)?.role || (decoded as any)?.data?.role;
    console.log('Resolved user role:', userRole);
    
    // Log permissions in a more readable way
    if ((decoded as any)?.permissions) {
      console.log('User permissions:', (decoded as any).permissions);
      console.log('Has ORDER_READ:', (decoded as any).permissions.includes('ORDER_READ'));
      console.log('Has ORDER_CREATE:', (decoded as any).permissions.includes('ORDER_CREATE'));
      console.log('Has ORDER_UPDATE:', (decoded as any).permissions.includes('ORDER_UPDATE'));
      console.log('Has ORDER_DELETE:', (decoded as any).permissions.includes('ORDER_DELETE'));
      console.log('Has MENU_READ:', (decoded as any).permissions.includes('MENU_READ'));
      console.log('Has MENU_CREATE:', (decoded as any).permissions.includes('MENU_CREATE'));
      console.log('Has MENU_UPDATE:', (decoded as any).permissions.includes('MENU_UPDATE'));
      console.log('Has MENU_DELETE:', (decoded as any).permissions.includes('MENU_DELETE'));
      console.log('Has USER_READ:', (decoded as any).permissions.includes('USER_READ'));
      console.log('Has USER_CREATE:', (decoded as any).permissions.includes('USER_CREATE'));
      console.log('Has USER_UPDATE:', (decoded as any).permissions.includes('USER_UPDATE'));
      console.log('Has USER_DELETE:', (decoded as any).permissions.includes('USER_DELETE'));
      console.log('Has MANAGER_READ:', (decoded as any).permissions.includes('MANAGER_READ'));
      console.log('Has MANAGER_CREATE:', (decoded as any).permissions.includes('MANAGER_CREATE'));
      console.log('Has MANAGER_UPDATE:', (decoded as any).permissions.includes('MANAGER_UPDATE'));
      console.log('Has MANAGER_DELETE:', (decoded as any).permissions.includes('MANAGER_DELETE'));
    }
    
    if (!userRole) {
      console.error('No role found in token');
      return NextResponse.redirect(loginUrl);
    }
    
    // Log decoded user info for debugging
    console.log('Decoded user info:', {
      role: userRole,
      permissions: decoded?.permissions,
      path: pathname
    });
    
    // If we're on the login page, always go to dashboard for both local and production
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Admins have full access to all routes
    if (userRole.toString().toUpperCase() === 'ADMIN') {
      console.log('Admin access granted to:', pathname);
      return NextResponse.next();
    }

    // For non-admin users, check permissions
    if (pathname.startsWith('/dashboard')) {
      // If we somehow got here with an admin, allow access
      if (userRole.toString().toUpperCase() === 'ADMIN') {
        return NextResponse.next();
      }
      // Redirect dashboard root for non-admins to the first accessible dashboard page, else POS
      if (pathname === '/dashboard') {
        const userPermissions = Array.isArray((decoded as any)?.permissions) ? (decoded as any).permissions : [];
        const firstAllowed = getFirstAccessibleDashboardPath(userPermissions);
        return NextResponse.redirect(new URL(firstAllowed || '/pos', request.url));
      }
      
      // Get required permissions and user permissions
      const requiredPermissions = getRequiredPermissions(pathname);
      const userPermissions = Array.isArray((decoded as any)?.permissions) ? 
        (decoded as any).permissions : [];
      
      console.log('=== PERMISSION CHECK ===');
      console.log('Current path:', pathname);
      console.log('Required permissions:', requiredPermissions);
      console.log('User permissions:', userPermissions);
      console.log('User has all required permissions:', 
        requiredPermissions.every(p => userPermissions.includes(p)));
      
      console.log('Permission check:', {
        path: pathname,
        requiredPermissions,
        userPermissions,
        hasRequiredPermissions: requiredPermissions.every(perm => userPermissions.includes(perm))
      });
      
      // If no specific permissions are required, allow access
      if (requiredPermissions.length === 0) {
        console.log('No specific permissions required for route, access granted');
        return NextResponse.next();
      }
      
      // Check if user has ALL required permissions for the route
      const hasAllRequiredPermissions = requiredPermissions.every(perm => 
        userPermissions.includes(perm)
      );
      
      if (!hasAllRequiredPermissions) {
        console.log('Access denied - Missing required permissions:', {
          path: pathname,
          requiredPermissions,
          userPermissions,
          missingPermissions: requiredPermissions.filter(perm => !userPermissions.includes(perm))
        });
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      console.log('Access granted - User has all required permissions');
    }
  } catch (error) {
    console.error('Error decoding token:', error);
    // If there's an error decoding the token, redirect to login
    return NextResponse.redirect(loginUrl);
  }
  
  // If we have a token and it's the login page, the redirection is already handled above
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // For protected routes with a valid token, continue
  return NextResponse.next();
}

// Configure which routes should be processed by this middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
