import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiAdminMePermissions } from '@/lib/webApi/generated/requests';
import { encryptPermissions } from '@/lib/utils/auth/permissionEncryption';
import { env } from '@/env';

const SESSION_COOKIE_NAME = 'padelnet.session';
const PERMISSIONS_COOKIE_NAME = 'padelnet.permissions';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/(main)/(admin)',
  '/studio',
];

// Routes that should skip permission fetching (e.g., auth pages)
const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes, static files, and API routes
  if (
    isPublicRoute(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // If no session token, let the page redirect (handled by layout)
  if (!sessionToken) {
    return NextResponse.next();
  }

  // Check if we already have permissions cookie
  const existingPermissions = request.cookies.get(PERMISSIONS_COOKIE_NAME)?.value;

  // If permissions already exist and we're on a protected route, continue
  if (existingPermissions && isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Fetch permissions for authenticated users on protected routes
  if (isProtectedRoute(pathname)) {
    try {
      const { payload, error } = await getApiAdminMePermissions({
        safeFetch: true,
      });

      console.log(payload.permissions);

      if (error || !payload) {
        // If permission fetch fails, clear permissions cookie and continue
        // The application will handle the auth error appropriately
        const response = NextResponse.next();
        response.cookies.delete(PERMISSIONS_COOKIE_NAME);
        return response;
      }

      // Encrypt the permissions data
      const encryptedPermissions = encryptPermissions(
        payload as Record<string, unknown>,
        env.PERMISSIONS_ENCRYPTION_SECRET,
      );

      // Set encrypted permissions in a cookie
      const response = NextResponse.next();
      response.cookies.set({
        name: PERMISSIONS_COOKIE_NAME,
        value: encryptedPermissions,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // Set maxAge to match session duration (or shorter for security)
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    } catch (error) {
      console.error('Error fetching permissions in middleware:', error);
      // On error, continue without permissions - app will handle gracefully
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
