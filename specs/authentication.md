# Authentication & User Management Specification

## Overview

GK-Nexus uses a two-tier authentication system:
1. **Staff Authentication** - Built on Better-Auth with email/password
2. **Portal Authentication** - Custom implementation for client access

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Authentication Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Staff Login (/login)                                       │
│       │                                                     │
│       ▼                                                     │
│  Better-Auth (email/password)                               │
│       │                                                     │
│       ▼                                                     │
│  user table ◄──────┐                                        │
│       │            │ 1:1 relationship                       │
│       ▼            │                                        │
│  staff table ──────┘                                        │
│       │                                                     │
│       ▼                                                     │
│  Role-based access (OWNER, MANAGER, STAFF, etc.)           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client Portal (/portal/login)                              │
│       │                                                     │
│       ▼                                                     │
│  Custom auth (invite-based)                                 │
│       │                                                     │
│       ▼                                                     │
│  portalUser table                                           │
│       │                                                     │
│       ▼                                                     │
│  Client-specific access only                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Staff Roles

| Role | Description | Access |
|------|-------------|--------|
| `OWNER` | System owner/administrator | Full access to everything |
| `GCMC_MANAGER` | GCMC business manager | Admin access for GCMC only |
| `KAJ_MANAGER` | KAJ business manager | Admin access for KAJ only |
| `STAFF_GCMC` | GCMC staff member | Staff access for GCMC only |
| `STAFF_KAJ` | KAJ staff member | Staff access for KAJ only |
| `STAFF_BOTH` | Multi-business staff | Staff access for both businesses |
| `RECEPTIONIST` | Front desk role | Limited access, client intake |

## Initial Setup (First Run)

### Problem
The first user cannot be created through the admin panel because there's no admin yet.

### Solution
Environment-based initial owner creation on server startup.

### Configuration

Add to `apps/server/.env`:
```env
# Initial Owner Setup (only used on first run if no owner exists)
INITIAL_OWNER_EMAIL=admin@company.com
INITIAL_OWNER_PASSWORD=SecurePassword123!
INITIAL_OWNER_NAME=System Administrator
```

### Behavior

1. **On server startup**, check if any `OWNER` role exists in database
2. **If no owner exists** AND env vars are set:
   - Create user record
   - Create account record (with hashed password)
   - Create staff record with `OWNER` role and both businesses
   - Log success message
3. **If owner exists**: Skip setup, log "Owner already exists"
4. **If env vars missing**: Log warning, app continues without owner

### Security Notes

- Password is hashed using Better-Auth's native `hashPassword` from `better-auth/crypto`
- Uses scrypt with parameters: N=16384, r=16, p=1, dkLen=64
- Env vars only read on startup, not exposed anywhere
- After first setup, env vars can be removed
- Password should be changed after first login

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Default Owner Credentials (Development)

```
Email: admin@gcmc-kaj.com
Password: Admin@1qazxsw2
```

**IMPORTANT**: Change these credentials immediately in production!

## Staff Creation Flow

### Admin Creates New Staff

1. Admin goes to **Admin → Staff → New Staff**
2. Fills in: name, email, role, business access
3. System creates:
   - User record (email, name)
   - Staff record (role, businesses)
   - Password setup token (24-hour expiry)
4. System sends email with setup link

### New Staff Sets Up Account

1. Staff receives email with link: `/staff/setup-password?token=xxx`
2. Staff creates password (min 8 chars, uppercase, lowercase, number)
3. System creates account credentials
4. Staff redirected to login

## API Procedures

### Authentication Levels

```typescript
// No auth required
publicProcedure

// Requires authenticated user
protectedProcedure

// Requires user + active staff profile
staffProcedure

// Requires admin role (OWNER, GCMC_MANAGER, KAJ_MANAGER)
adminProcedure

// Requires GCMC access
gcmcProcedure

// Requires KAJ access
kajProcedure
```

## Database Schema

### Core Tables

```sql
-- Better-Auth managed
user (id, name, email, emailVerified, image, createdAt, updatedAt)
session (id, token, expiresAt, userId, ipAddress, userAgent)
account (id, userId, providerId, password, ...)
verification (id, identifier, value, expiresAt)

-- Business extension
staff (id, userId, role, businesses[], phone, jobTitle, isActive)

-- Password setup tokens
password_setup_token (id, userId, token, expiresAt, usedAt, createdAt)
```

### Portal Tables (Separate System)

```sql
portal_user (id, clientId, email, passwordHash, isActive)
portal_session (id, portalUserId, token, expiresAt)
portal_invite (id, clientId, email, token, expiresAt, usedAt)
```

## Security Measures

1. **Password Hashing**: scrypt with random salt
2. **Token Generation**: Cryptographically secure random bytes
3. **Session Management**: HTTP-only cookies, secure flag in production
4. **CORS**: Trusted origins only
5. **Token Expiry**: Setup tokens expire in 24 hours
6. **Rate Limiting**: (TODO) Add to password setup endpoints

## Related Files

- `/packages/auth/src/index.ts` - Better-Auth configuration
- `/packages/db/src/schema/auth.ts` - Auth schema (includes passwordSetupToken table)
- `/packages/db/src/schema/core.ts` - Staff schema
- `/packages/api/src/index.ts` - Procedure definitions
- `/packages/api/src/context.ts` - Context creation with staff lookup
- `/packages/api/src/routers/admin.ts` - Staff management endpoints
- `/packages/api/src/routers/staff-setup.ts` - Password setup public endpoints
- `/packages/api/src/routers/settings.ts` - Staff status check endpoint
- `/packages/api/src/utils/password.ts` - Password utilities (validation, custom hashing)
- `/packages/api/src/utils/initial-setup.ts` - First-run owner setup
- `/apps/web/src/routes/login.tsx` - Staff login page
- `/apps/web/src/routes/staff/setup-password.tsx` - New staff password setup
- `/apps/web/src/routes/app.tsx` - Protected layout with staff access check

## Troubleshooting

### "Invalid email or password" on login

1. **Check password hash format**: The initial setup must use `hashPassword` from `better-auth/crypto`, not custom scrypt implementations. The hash format is `salt:derivedKey` with specific scrypt parameters (N=16384, r=16, p=1, dkLen=64).

2. **Verify account exists**: Check the `account` table for a record with `provider_id = 'credential'` and matching `user_id`.

3. **Check staff profile**: Even with valid credentials, users without a staff profile will see "Access Pending".

### "Access Pending" after login

The user has valid credentials but no staff profile. Either:
- Create a staff record linking to the user
- Or re-run initial setup by deleting the owner records and restarting the server
