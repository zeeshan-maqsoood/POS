import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/pos",
  "/profile"
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
  
  // If we have a token and it's the login page, redirect to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
