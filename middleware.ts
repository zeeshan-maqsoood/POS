import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  role?: string;
  [key: string]: any;
}

// Define protected routes
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/pos",
  "/profile"
]

// Define manager-allowed dashboard routes
const managerAllowedRoutes = [
  "/dashboard/orders",
  "/dashboard/menu",
  "/dashboard/menu/items",
  "/dashboard/menu/categories",
  "/dashboard/menu/modifiers"
]

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
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Decode the token to get user role
    const decoded = jwtDecode<JwtPayload>(token);
    const userRole = decoded?.role;

    // If user is a manager trying to access dashboard
    if (userRole === 'MANAGER' && pathname.startsWith('/dashboard')) {
      // Allow access to specific dashboard routes
      const isAllowedRoute = managerAllowedRoutes.some(route => 
        pathname === route || pathname.startsWith(`${route}/`)
      );
      
      // If trying to access dashboard root, redirect to orders page
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/dashboard/orders', request.url));
      }
      
      // If not an allowed route, redirect to orders page
      if (!isAllowedRoute) {
        return NextResponse.redirect(new URL('/dashboard/orders', request.url));
      }
    }
  } catch (error) {
    console.error('Error decoding token:', error);
    // If there's an error decoding the token, redirect to login
    return NextResponse.redirect(loginUrl);
  }
  
  // If we have a token and it's the login page, redirect to appropriate page based on role
  if (pathname === '/') {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const userRole = decoded?.role;
      const redirectTo = userRole === 'MANAGER' ? '/dashboard/orders' : 
                        request.nextUrl.searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    } catch (error) {
      console.error('Error decoding token:', error);
      return NextResponse.redirect(loginUrl);
    }
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
