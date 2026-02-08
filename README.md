# GoPadel Backoffice

The GoPadel app backoffice website for managing organizations, clubs, courts, tournaments, and administrative users.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
# or
yarn install
```

### Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Add your environment variables to `.env`:

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your-sanity-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SECRET_SANITY_VIEW_TOKEN=your-sanity-view-token
SECRET_SANITY_EDIT_TOKEN=your-sanity-edit-token

# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-url.com

# Permissions Encryption (REQUIRED)
# Generate using: openssl rand -base64 32
PERMISSIONS_ENCRYPTION_SECRET=your-32-character-secret-key
NEXT_PUBLIC_PERMISSIONS_DECRYPTION_SECRET=your-32-character-secret-key
```

**Important**: Both permission keys must be identical. Generate a secure key:

```bash
openssl rand -base64 32
```

### Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Permission Management System

This application uses a secure, server-side permission management system:

- ✅ **Server-side fetching** - Permissions fetched in middleware after authentication
- ✅ **AES-256-GCM encryption** - Permissions encrypted before sending to client
- ✅ **HTTP-only cookies** - Secure storage, not accessible via JavaScript
- ✅ **Never exposed** - Raw permissions never sent to client
- ✅ **Auto-refresh** - Permissions refetched on protected routes if missing

### How It Works

```
User logs in → Token stored → Navigate to protected route → 
Middleware fetches permissions → Encrypts with AES-256 → 
Stores in HTTP-only cookie → Client/Server decrypt as needed
```

### Usage in Client Components

```tsx
'use client';
import { useAdmin } from '@/context/AdminContext';

export default function MyComponent() {
  const { hasPermission, hasRole } = useAdmin();

  if (hasPermission('manage_clubs')) {
    return <button>Create Club</button>;
  }

  if (hasRole('RootAdmin')) {
    return <div>Root Admin Panel</div>;
  }

  return <div>No access</div>;
}
```

### Usage in Server Components

```tsx
import { hasServerPermission, hasServerRole } from '@/lib/utils/auth/serverPermissions';

export default async function AdminPage() {
  const canManage = await hasServerPermission('manage_clubs');
  const isRoot = await hasServerRole('RootAdmin');

  if (!canManage) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Content</div>;
}
```

### Usage in Server Actions

```tsx
'use server';
import { hasServerPermission } from '@/lib/utils/auth/serverPermissions';

export async function deleteClub(id: number) {
  if (!await hasServerPermission('delete_club')) {
    throw new Error('Insufficient permissions');
  }
  // Proceed with deletion
}
```

### API Response Structure

The `getApiAdminMePermissions` endpoint returns:

```typescript
{
  role: 'RootAdmin' | 'OrganizationAdmin' | 'ClubAdmin',
  permissions: string[] | null
}
```

Example:
```json
{
  "role": "ClubAdmin",
  "permissions": [
    "view_clubs",
    "manage_clubs",
    "view_courts",
    "manage_courts"
  ]
}
```

### Protected Routes

Middleware protects routes under:
- `/(main)/(admin)/*` - All admin routes

Public routes (no permission check):
- `/signin`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/studio`

### Permission Helpers

**Client-side (AdminContext):**
- `permissions` - Full permissions object
- `hasPermission(permission)` - Check specific permission
- `hasRole(role)` - Check user role

**Server-side:**
- `getServerPermissions()` - Get all permissions
- `hasServerPermission(permission)` - Check specific permission
- `hasServerRole(role)` - Check user role
- `getServerPermissionsList()` - Get permissions array

### Security Features

1. **Encryption**: AES-256-GCM with authentication tags
2. **HTTP-only cookies**: Permissions stored securely
3. **Server-side fetching**: Never trust client for permissions
4. **Auto-invalidation**: Cleared on 401 or logout
5. **Key derivation**: PBKDF2 with 100,000 iterations

### Troubleshooting

#### Permissions not available
- Check environment variables are set
- Verify session token exists
- Ensure you're on a protected route
- Restart dev server after adding env vars

#### Decryption errors
- Both encryption keys must be identical
- Keys must be at least 32 characters
- Clear cookies and sign in again

#### Permissions not updating
- Clear cookies and re-login
- Check API endpoint returns correct data
- Verify middleware is running

## 📁 Project Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── (main)/              # Main application routes
│   │   ├── (admin)/         # Protected admin routes
│   │   └── (full-width-pages)/ # Auth pages (signin, etc.)
│   └── studio/              # Sanity Studio
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── ui/                 # UI components (buttons, modals, etc.)
│   └── example/            # Example components
├── context/                # React contexts
│   ├── AdminContext.tsx    # Admin & permissions context
│   └── ThemeContext.tsx    # Theme context
├── lib/
│   ├── utils/
│   │   └── auth/           # Auth utilities
│   │       ├── tokenStorage.ts           # Session token management
│   │       ├── permissionEncryption.ts   # AES-256 encryption
│   │       └── serverPermissions.ts      # Server-side helpers
│   └── webApi/
│       └── generated/      # Auto-generated API client
├── middleware.ts           # Next.js middleware (permission fetching)
└── env.js                  # Environment validation
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **API Client**: Auto-generated with Orval
- **CMS**: Sanity
- **Authentication**: JWT tokens in HTTP-only cookies
- **Encryption**: Node.js crypto (AES-256-GCM)

## 🔧 Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# API Generation
npm run generate:api # Generate API client from OpenAPI spec
```

## 📚 Additional Documentation

- [Permission System Technical Guide](PERMISSIONS_GUIDE.md)
- [Environment Variables](.env.example)

## 🤝 Contributing

Ensure all code follows the project's ESLint and Prettier configurations.

## 📄 License

See [LICENSE](LICENSE) file for details.
