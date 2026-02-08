/**
 * Server-side utility to get permissions for use in server components and actions.
 * Reads and decrypts permissions from the cookie set by middleware.
 */

import { cookies } from 'next/headers';
import type { AdminRolesPermissionsResponse } from '@/lib/webApi/generated/models';
import { decryptPermissions } from './permissionEncryption';
import { env } from '@/env';

const PERMISSIONS_COOKIE_NAME = 'padelnet.permissions';

/**
 * Get decrypted permissions in server components or server actions.
 * @returns AdminRolesPermissionsResponse or null if no permissions found
 * 
 * @example
 * ```tsx
 * // In a server component
 * import { getServerPermissions } from '@/lib/utils/auth/serverPermissions';
 * 
 * export default async function AdminPage() {
 *   const permissions = await getServerPermissions();
 *   
 *   if (!permissions?.permissions?.includes('manage_clubs')) {
 *     return <div>Access denied</div>;
 *   }
 *   
 *   return <div>Admin content</div>;
 * }
 * ```
 */
export async function getServerPermissions(): Promise<AdminRolesPermissionsResponse | null> {
  try {
    const cookieStore = await cookies();
    const encryptedPermissions = cookieStore.get(PERMISSIONS_COOKIE_NAME)?.value;

    if (!encryptedPermissions) {
      return null;
    }

    const decrypted = await decryptPermissions<AdminRolesPermissionsResponse>(
      encryptedPermissions,
      env.PERMISSIONS_ENCRYPTION_SECRET,
    );

    return decrypted;
  } catch (error) {
    console.error('Failed to get server permissions:', error);
    return null;
  }
}

/**
 * Check if user has a specific permission on the server.
 * @param permission - The permission string to check
 * @returns boolean
 * 
 * @example
 * ```tsx
 * import { hasServerPermission } from '@/lib/utils/auth/serverPermissions';
 * 
 * export default async function ClubsPage() {
 *   const canManage = await hasServerPermission('manage_clubs');
 *   
 *   return (
 *     <div>
 *       {canManage && <CreateClubButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export async function hasServerPermission(permission: string): Promise<boolean> {
  const permissions = await getServerPermissions();
  if (!permissions?.permissions) return false;
  return permissions.permissions.includes(permission);
}

/**
 * Check if user has a specific role on the server.
 * @param role - The role string to check
 * @returns boolean
 */
export async function hasServerRole(role: string): Promise<boolean> {
  const permissions = await getServerPermissions();
  if (!permissions?.role) return false;
  return permissions.role === role;
}

/**
 * Get all permissions as an array for server use.
 * @returns string[] of permissions or empty array
 */
export async function getServerPermissionsList(): Promise<string[]> {
  const permissions = await getServerPermissions();
  return permissions?.permissions ?? [];
}
