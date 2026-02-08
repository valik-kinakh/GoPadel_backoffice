import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiAdminMePermissions } from '@/lib/webApi/generated/requests';
import { encryptPermissions } from '@/lib/utils/auth/permissionEncryption';
import { env } from '@/env';

const SESSION_COOKIE_NAME = 'padelnet.session';
const PERMISSIONS_COOKIE_NAME = 'padelnet.permissions';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // If no session token, continue without fetching permissions
  if (!sessionToken) {
    return NextResponse.next();
  }

  // Fetch permissions for all authenticated users on every page visit
  try {
    const { payload, error } = await getApiAdminMePermissions({
      safeFetch: true,
    });

    if (error || !payload) {
      // If permission fetch fails, clear permissions cookie and continue
      const response = NextResponse.next();
      response.cookies.delete(PERMISSIONS_COOKIE_NAME);
      return response;
    }

    // Encrypt the permissions data
    const encryptedPermissions = await encryptPermissions(
      payload as Record<string, unknown>,
      env.PERMISSIONS_ENCRYPTION_SECRET,
    );

    // Set encrypted permissions in a cookie
    // Note: httpOnly is false because client needs to read the encrypted data
    // Security is maintained through encryption
    const response = NextResponse.next();
    response.cookies.set({
      name: PERMISSIONS_COOKIE_NAME,
      value: encryptedPermissions,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Set maxAge to match session duration
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Error fetching permissions in middleware:', error);
    // On error, continue without permissions - app will handle gracefully
    const response = NextResponse.next();
    response.cookies.delete(PERMISSIONS_COOKIE_NAME);
    return response;
  }
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
