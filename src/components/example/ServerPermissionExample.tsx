/**
 * Example server component demonstrating server-side permission checks
 * This shows how to use server utilities to check permissions
 */

import { 
  getServerPermissions, 
  hasServerPermission,
  hasServerRole,
  getServerPermissionsList 
} from '@/lib/utils/auth/serverPermissions';

export default async function ServerPermissionExample() {
  // Get all permissions
  const permissions = await getServerPermissions();
  
  // Check specific permission
  const canManageClubs = await hasServerPermission('manage_clubs');
  const canManageCourts = await hasServerPermission('manage_courts');
  
  // Check role
  const isRootAdmin = await hasServerRole('RootAdmin');
  const isOrgAdmin = await hasServerRole('OrganizationAdmin');
  
  // Get permissions list
  const permissionsList = await getServerPermissionsList();

  // Restrict access based on permissions
  if (!canManageClubs) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
        <p>You don&apos;t have permission to manage clubs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Server-Side Permissions</h2>
        <p className="text-gray-600">This data is checked on the server before rendering</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Current Role</h3>
        <p className="text-lg">{permissions?.role ?? 'Unknown'}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Permission Checks</h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className={canManageClubs ? 'text-green-600' : 'text-red-600'}>
              {canManageClubs ? '✓' : '✗'}
            </span>
            <span>Can manage clubs</span>
          </li>
          <li className="flex items-center gap-2">
            <span className={canManageCourts ? 'text-green-600' : 'text-red-600'}>
              {canManageCourts ? '✓' : '✗'}
            </span>
            <span>Can manage courts</span>
          </li>
          <li className="flex items-center gap-2">
            <span className={isRootAdmin ? 'text-green-600' : 'text-red-600'}>
              {isRootAdmin ? '✓' : '✗'}
            </span>
            <span>Is root admin</span>
          </li>
          <li className="flex items-center gap-2">
            <span className={isOrgAdmin ? 'text-green-600' : 'text-red-600'}>
              {isOrgAdmin ? '✓' : '✗'}
            </span>
            <span>Is organization admin</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">All Permissions</h3>
        <ul className="list-disc list-inside space-y-1">
          {permissionsList.length > 0 ? (
            permissionsList.map((perm) => (
              <li key={perm}>{perm}</li>
            ))
          ) : (
            <li className="text-gray-500">No permissions found</li>
          )}
        </ul>
      </div>

      {/* Conditional rendering based on role */}
      {isRootAdmin && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-semibold mb-2">Root Admin Section</h4>
          <p className="text-sm">This content is only rendered for root admins on the server.</p>
        </div>
      )}

      {/* Conditional rendering based on permission */}
      {canManageClubs && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="font-semibold mb-2">Club Management</h4>
          <p className="text-sm">You have permission to manage clubs.</p>
          {/* Add club management UI here */}
        </div>
      )}
    </div>
  );
}
