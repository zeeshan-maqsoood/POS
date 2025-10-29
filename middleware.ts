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
  "/profile",
  "/managers"
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
  '/managers': ['MANAGER_READ']
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
 
// Find the first dashboard page the user can access based on their permissions and role
function getFirstAccessibleDashboardPath(userPermissions: string[], userRole?: string): string | null {
  // If user is admin, return dashboard root (admins have access to everything)
  if (userRole && userRole.toString().toUpperCase() === 'ADMIN') {
    return '/dashboard';
  }

  // For managers, check if they have POS access first
  if (userRole === 'MANAGER') {
    // If manager has POS access, redirect to POS instead of dashboard
    if (userPermissions.includes('POS_READ') || userPermissions.includes('POS_CREATE')) {
      return '/pos';
    }

    // If they have dashboard access but no DASHBOARD_READ specifically,
    // still allow them to access the dashboard root
    if (userPermissions.includes('DASHBOARD_READ') ||
        userPermissions.includes('ORDER_READ') ||
        userPermissions.includes('MENU_READ') ||
        userPermissions.includes('USER_READ')) {
      return '/dashboard';
    }
  }
  

  // Define dashboard candidates with their required permissions
  const dashboardCandidates = [
    { path: '/dashboard', required: ['DASHBOARD_READ'] }, // Dashboard root requires DASHBOARD_READ
    { path: '/dashboard/orders', required: ['ORDER_READ'] },
    { path: '/dashboard/menu', required: ['MENU_READ'] },
    { path: '/dashboard/managers', required: ['MANAGER_READ'] },
    { path: '/dashboard/users', required: ['USER_READ'] },
  ];

  // If user is kitchen staff, prioritize the orders page
  if (userRole === 'KITCHEN_STAFF') {
    const ordersPage = dashboardCandidates.find(c => c.path === '/dashboard/orders');
    if (ordersPage) {
      // If kitchen staff doesn't have ORDER_READ, we'll still return orders page
      // and handle the permission check in the page component
      return '/dashboard/orders';
    }
  }

  // For other roles, find the first page they have access to
  for (const candidate of dashboardCandidates) {
    if (candidate.required.length === 0 ||
        candidate.required.every(p => userPermissions.includes(p))) {
      return candidate.path;
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

  // Get token from cookies or Authorization header
  const cookieToken = request.cookies.get('token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined;

  const token = cookieToken || headerToken;

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
    console.log('Role type:', typeof userRole);
    console.log('Role toString():', userRole?.toString());
    console.log('Role toUpperCase():', userRole?.toString()?.toUpperCase());
    
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
      console.log('Has DASHBOARD_READ:', (decoded as any).permissions.includes('DASHBOARD_READ'));
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
    
    // Handle kitchen staff redirections first
    if (userRole.toString().toUpperCase() === 'KITCHEN_STAFF') {
      // If it's the root path, redirect to orders page
      if (pathname === '/') {
        console.log('Redirecting kitchen staff to orders page from login');
        return NextResponse.redirect(new URL('/dashboard/orders', request.url));
      }
      // If trying to access any other dashboard page, redirect to orders
      else if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/orders')) {
        console.log('Redirecting kitchen staff to orders page from dashboard');
        return NextResponse.redirect(new URL('/dashboard/orders', request.url));
      }
      // If already on orders page, allow access
      else if (pathname.startsWith('/dashboard/orders')) {
        return NextResponse.next();
      }
    }
    // Handle admin access - admins have access to everything
    console.log('Checking admin access for role:', userRole);
    if (userRole && userRole.toString().toUpperCase() === 'ADMIN') {
      console.log('Admin access granted to:', pathname);
      return NextResponse.next();
    }
    console.log('Admin check failed, continuing with other checks');

    // Handle login page for non-admin users
    if (pathname === '/') {
      const userPermissions = Array.isArray((decoded as any)?.permissions) ? (decoded as any).permissions : [];
      // If manager has POS access, redirect to POS
      if (userRole === 'MANAGER' && (userPermissions.includes('POS_READ') || userPermissions.includes('POS_CREATE'))) {
        return NextResponse.redirect(new URL('/pos', request.url));
      }

      // Otherwise redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // For non-admin users, check permissions
    if (pathname.startsWith('/dashboard')) {
      // Redirect dashboard root for non-admins to the first accessible dashboard page, else POS
      if (pathname === '/dashboard') {
        const userPermissions = Array.isArray((decoded as any)?.permissions) ? (decoded as any).permissions : [];

        // If user has DASHBOARD_READ permission, allow direct access to dashboard
        if (userPermissions.includes('DASHBOARD_READ')) {
          console.log('User has DASHBOARD_READ, allowing direct access to dashboard');
          return NextResponse.next();
        }

        // Otherwise, find the first accessible dashboard page or redirect to POS
        const firstAllowed = getFirstAccessibleDashboardPath(userPermissions, userRole);
        console.log('Non-admin user without DASHBOARD_READ, redirecting from /dashboard to:', firstAllowed);

        // Only redirect if the target path is different from current path
        if (firstAllowed && firstAllowed !== '/dashboard') {
          return NextResponse.redirect(new URL(firstAllowed, request.url));
        } else {
          // If target is dashboard itself, allow access
          return NextResponse.next();
        }
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

      // Special case for kitchen staff on orders page
      if (userRole === 'KITCHEN_STAFF') {
        if (pathname === '/dashboard/orders' || pathname.startsWith('/dashboard/orders/')) {
          console.log('Kitchen staff access to orders page - checking for basic permissions');
          // Kitchen staff only needs basic access to view orders
          if (userPermissions.includes('ORDER_READ') || userPermissions.length === 0) {
            return NextResponse.next();
          }
        }
        // Redirect kitchen staff to orders page if they try to access other dashboard pages
        else if (pathname.startsWith('/dashboard/')) {
          console.log('Redirecting kitchen staff to orders page');
          return NextResponse.redirect(new URL('/dashboard/orders', request.url));
        }
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

    // Handle POS routes and back button navigation
    if (pathname.startsWith('/pos')) {
      const userPermissions = Array.isArray((decoded as any)?.permissions) ? (decoded as any).permissions : [];

      // For normal POS access, check permissions and allow access
      const requiredPermissions = getRequiredPermissions(pathname);

      if (requiredPermissions.length > 0) {
        const hasAllRequiredPermissions = requiredPermissions.every(perm =>
          userPermissions.includes(perm)
        );

        if (!hasAllRequiredPermissions) {
          console.log('Access denied to POS - Missing required permissions:', {
            path: pathname,
            requiredPermissions,
            userPermissions,
            missingPermissions: requiredPermissions.filter(perm => !userPermissions.includes(perm))
          });
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

      console.log('POS access granted');
      return NextResponse.next();
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
