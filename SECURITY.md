# Security Policy

## Supported Versions

We release security updates for the following versions of GK-Nexus:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| Latest (master) | :white_check_mark: | Active development |
| Production releases | :white_check_mark: | Security patches only |
| Development branches | :x: | No security support |

**Note:** GK-Nexus is currently in active development. Once we reach version 1.0.0, we will maintain security support for the latest major version and the previous major version for 6 months after a new major release.

## Reporting a Vulnerability

**IMPORTANT: Do NOT open public GitHub issues for security vulnerabilities.**

We take all security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### How to Report

1. **Email:** Send details to **security@greencrescent.gy**
2. **Subject Line:** Use format `[SECURITY] Brief description of vulnerability`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact and severity assessment
   - Any proof-of-concept code (if applicable)
   - Your contact information for follow-up

### What to Expect

- **Initial Response:** Within 48 hours (business days)
- **Status Update:** Within 5 business days with assessment and timeline
- **Resolution Timeline:**
  - Critical vulnerabilities: 7-14 days
  - High severity: 14-30 days
  - Medium/Low severity: 30-90 days

### Disclosure Policy

- We follow **coordinated disclosure** principles
- We will work with you to understand and resolve the issue
- We request a **90-day embargo** before public disclosure
- Public disclosure occurs after:
  - Fix is deployed to production
  - Users have been notified (if applicable)
  - Sufficient time for users to update (typically 2-4 weeks)
- We will acknowledge your contribution in our security advisories (unless you prefer to remain anonymous)

## Security Best Practices

### For Developers

#### Code Quality Standards

1. **Run security checks before commits:**
   ```bash
   npx ultracite fix    # Auto-fix linting and formatting
   bun run check-types  # TypeScript type checking
   ```

2. **No sensitive data in code:**
   - Never commit API keys, passwords, or tokens
   - Use environment variables for all secrets
   - Add sensitive files to `.gitignore`

3. **Type safety:**
   - No `any` types - use `unknown` for genuinely unknown types
   - Explicit types for all API inputs/outputs
   - Validate all user input with Zod schemas

4. **Error handling:**
   - Never expose stack traces to end users
   - Log errors server-side with context
   - Return user-friendly error messages
   - Use ORPCError for API errors with appropriate status codes

#### Dependency Management

1. **Regular updates:**
   ```bash
   bun update           # Update dependencies
   bun outdated         # Check for outdated packages
   ```

2. **Security audits:**
   - Review dependency updates for security patches
   - Check GitHub Security Advisories for used packages
   - Monitor Dependabot alerts

3. **Minimal dependencies:**
   - Only add dependencies when necessary
   - Prefer well-maintained packages with active communities
   - Review package source code before adding critical dependencies

### For Deployment

#### Environment Variables

All sensitive configuration must use environment variables:

**Server (`apps/server/.env`):**
```env
DATABASE_URL=postgresql://...        # Database connection
BETTER_AUTH_SECRET=...               # Session secret (min 32 characters)
BETTER_AUTH_URL=...                  # Auth callback URL
CORS_ORIGIN=...                      # Frontend URL for CORS
```

**Web (`apps/web/.env`):**
```env
VITE_SERVER_URL=...                  # Backend API endpoint
```

**Security Requirements:**
- Use strong, randomly generated secrets (min 32 characters)
- Rotate secrets every 90 days or immediately if compromised
- Never commit `.env` files to version control
- Use separate credentials for development, staging, and production

#### Docker Security Hardening

GK-Nexus follows LinuxServer.io security standards:

```yaml
# Production docker-compose.prod.yml includes:
security_opt:
  - no-new-privileges:true           # Prevent privilege escalation
cap_drop:
  - ALL                              # Drop all Linux capabilities
read_only: true                      # Read-only root filesystem
tmpfs:
  - /tmp                             # Temporary files in memory only
user: "1001:1001"                    # Non-root user
```

**Additional hardening:**
- Regular base image updates (Debian Slim with security patches)
- Multi-stage builds to minimize attack surface
- SBOM (Software Bill of Materials) for transparency
- Provenance attestations for build verification

## Data Handling and Privacy

### GDPR Compliance

GK-Nexus handles personal data for clients in Guyana. While GDPR may not directly apply, we follow GDPR principles as best practice:

1. **Data Minimization:** Only collect necessary data
2. **Purpose Limitation:** Use data only for stated business purposes
3. **Storage Limitation:** Archive old client records per retention policy
4. **Data Accuracy:** Provide UI for clients to update their information
5. **Confidentiality:** Encrypt data in transit and at rest

### Data Classification

| Data Type | Classification | Storage | Access Control |
|-----------|---------------|---------|----------------|
| Client personal information | Confidential | PostgreSQL encrypted | Staff with client access |
| Tax documents | Highly Confidential | Local filesystem | Matter-specific access |
| Immigration documents | Highly Confidential | Local filesystem | Matter-specific access |
| Financial records | Confidential | Local filesystem | Accounting staff only |
| Business correspondence | Internal | Local filesystem | Business-specific staff |
| Training materials | Public/Internal | Database & filesystem | Based on business |
| System logs | Internal | Database | Admin only |
| Audit logs | Internal | Database | Owner/Manager only |

### Data Retention

- **Active Clients:** Data retained indefinitely while client is active
- **Inactive Clients:** Reviewed annually, archived after 2 years of inactivity
- **Tax Records:** Retained for 7 years per Guyanese tax law
- **System Logs:** Retained for 90 days
- **Audit Logs:** Retained for 2 years
- **Backups:** Encrypted backups retained for 30 days

### Data Deletion

Users can request data deletion by contacting their assigned staff member. We will:
1. Verify the request with the client
2. Export their data if requested (portability)
3. Permanently delete data within 30 days
4. Provide confirmation of deletion

**Exceptions:** Data required for legal/regulatory compliance (tax records) will be retained per statutory requirements.

## Authentication and Authorization

### Authentication (Better-Auth)

1. **Session Management:**
   - HTTP-only cookies for session tokens
   - Secure flag enabled (HTTPS only)
   - SameSite=None for cross-origin requests
   - 7-day session expiration with sliding window

2. **Password Requirements:**
   - Minimum 8 characters
   - Passwords hashed with bcrypt
   - No password complexity rules (length is more important)
   - Encourage use of password managers

3. **Account Security:**
   - Password reset via email (when email integration is enabled)
   - Account lockout after 5 failed login attempts (15-minute cooldown)
   - Session invalidation on password change
   - Active session management (view and revoke sessions)

### Authorization (Role-Based Access Control)

**Staff Roles:**

| Role | Access Level | Permissions |
|------|-------------|-------------|
| OWNER | Full access | All businesses, all features, system settings |
| GCMC_MANAGER | GCMC business | Manage GCMC clients, matters, staff |
| KAJ_MANAGER | KAJ business | Manage KAJ clients, matters, staff |
| STAFF_GCMC | GCMC business | View/edit assigned GCMC clients and matters |
| STAFF_KAJ | KAJ business | View/edit assigned KAJ clients and matters |
| STAFF_BOTH | Both businesses | View/edit assigned clients across both |
| RECEPTIONIST | Read-only + create | Create clients/matters, view all, no edit |

**API Procedures:**

- `publicProcedure` - No authentication required (public endpoints)
- `protectedProcedure` - Requires authenticated user
- `staffProcedure` - Requires active staff profile
- `adminProcedure` - Owner or Manager roles only
- `gcmcProcedure` - GCMC business access
- `kajProcedure` - KAJ business access

**Client Portal:**
- Separate authentication from staff
- Clients can only access their own data
- View matters, documents, and deadlines
- Upload requested documents
- No access to other clients or staff features

## Database Security

### PostgreSQL Hardening

1. **Access Control:**
   - Database user has minimal privileges
   - No superuser access for application
   - Separate users for application vs. migrations
   - SSL/TLS connections required in production

2. **Network Security:**
   - Database not exposed to public internet
   - Docker network isolation
   - Firewall rules restrict access to application only

3. **Backup Security:**
   - Automated daily backups (see Backup System section)
   - Backups encrypted at rest
   - Backup storage isolated from application
   - Point-in-time recovery capability

4. **Query Security:**
   - Drizzle ORM prevents SQL injection
   - Parameterized queries only
   - No dynamic SQL construction from user input
   - Input validation with Zod schemas

### Schema Security

- **Soft deletes:** Important records use `status` or `archivedAt` instead of DELETE
- **Audit trails:** `createdAt`, `updatedAt`, `createdById` on all tables
- **Activity logging:** Critical actions logged to `activity` table
- **Row-level security:** Enforced at application layer via oRPC procedures

## API Security

### oRPC (OpenAPI RPC)

1. **Input Validation:**
   - All inputs validated with Zod schemas
   - Type-safe at compile time and runtime
   - Explicit error messages for validation failures
   - No arbitrary JSON accepted

2. **Rate Limiting:**
   - **Status:** Not yet implemented (planned for Phase 3)
   - **Future:** 100 requests per minute per IP
   - **Future:** 1000 requests per hour per authenticated user

3. **CORS Configuration:**
   ```typescript
   trustedOrigins: [process.env.CORS_ORIGIN]
   ```
   - Only frontend origin allowed
   - No wildcard (`*`) origins
   - Credentials included for session cookies

4. **Error Handling:**
   - No stack traces in production
   - Generic errors for auth failures
   - Detailed logs server-side only
   - Appropriate HTTP status codes

### API Authentication

- Session token in HTTP-only cookie
- `Authorization` header support for API clients (future)
- CSRF protection via SameSite cookie attribute
- Origin validation for all requests

## File Upload Security

### Upload Restrictions

1. **File Size Limits:**
   - Maximum file size: **25 MB** per upload
   - Configurable per document category
   - Enforced at API and frontend

2. **Allowed File Types:**
   ```typescript
   // Document uploads
   const ALLOWED_MIME_TYPES = [
     'application/pdf',
     'image/jpeg',
     'image/png',
     'image/gif',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-excel',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'text/plain',
   ];
   ```

3. **File Validation:**
   - MIME type validation (server-side)
   - File extension validation
   - Magic number verification (future enhancement)
   - Virus scanning (future enhancement with ClamAV)

### Storage Security

1. **File Storage Location:**
   - Local filesystem: `/app/uploads` (in Docker container)
   - Outside of web-accessible directory
   - Served via API endpoint with access control

2. **Filename Handling:**
   - UUID-based filenames (prevents directory traversal)
   - Original filename stored in database separately
   - No user input in file paths

3. **Access Control:**
   - Files served through authenticated API endpoints
   - Authorization checks before file delivery
   - No direct filesystem access from web
   - Download-only (no inline rendering of user uploads)

4. **Cloud Backup:**
   - Optional S3-compatible storage (Cloudflare R2 recommended)
   - Encrypted uploads to cloud
   - Separate credentials from primary database
   - Retention policy managed independently

### Document Categories

Documents are classified by category with specific security controls:

| Category | Sensitivity | Access Control |
|----------|-------------|----------------|
| IDENTITY | High | Staff assigned to client |
| TAX | High | Accounting staff only |
| IMMIGRATION | High | Immigration staff only |
| FINANCIAL | High | Accounting/assigned staff |
| LEGAL | Medium | Assigned staff |
| BUSINESS | Medium | Business-specific staff |
| CORRESPONDENCE | Low | Business-specific staff |
| TRAINING | Low | All staff |
| OTHER | Medium | Assigned staff |

## Backup and Disaster Recovery

### Automated Backup System

GK-Nexus includes a comprehensive backup system (implemented January 2025):

1. **Backup Types:**
   - **Full Backup:** Complete database dump + all uploaded files
   - **Database Only:** PostgreSQL dump without files
   - **Incremental:** Changed files only (future enhancement)

2. **Backup Schedule:**
   - Daily automated backups (configurable via Settings UI)
   - On-demand manual backups via Admin Panel
   - Pre-deployment backups (manual trigger recommended)

3. **Backup Storage:**
   - Local: `/app/backups` directory (mounted volume)
   - Cloud: S3-compatible storage (optional)
   - Retention: 30 days default (configurable)

4. **Backup Encryption:**
   - Database dumps: Compressed with gzip
   - Files: Archived in tar.gz
   - Cloud uploads: Encrypted in transit (HTTPS)
   - At-rest encryption via storage provider

5. **Restore Capabilities:**
   - Full system restore from backup
   - Point-in-time recovery (database)
   - Selective file restoration
   - Automatic validation of backup integrity

6. **Backup Monitoring:**
   - Success/failure notifications (when email integration enabled)
   - Backup history in Admin Panel
   - Disk space monitoring
   - Backup age alerts (warn if >7 days)

### Disaster Recovery Plan

1. **Recovery Time Objective (RTO):** 4 hours
2. **Recovery Point Objective (RPO):** 24 hours (daily backups)

**Recovery Procedures:**
```bash
# 1. Restore from backup
docker exec -it gk-nexus-server /bin/bash
cd /app/scripts
./restore.sh /app/backups/backup-YYYY-MM-DD.tar.gz

# 2. Verify database integrity
bun run db:studio

# 3. Check application health
curl http://localhost:3000/health

# 4. Verify file uploads accessible
# Test document downloads via UI
```

**Backup Testing:**
- Quarterly restore tests to verify backups work
- Documented in `/specs/implementations/PRODUCTION_DEPLOYMENT.md` Phase 6

## CI/CD Security

### GitHub Actions Pipeline

1. **Build Security:**
   - SBOM (Software Bill of Materials) generation
   - Provenance attestations for supply chain security
   - Automated vulnerability scanning (future: Trivy integration)
   - No secrets in build logs

2. **Registry Security:**
   - GitHub Container Registry (GHCR) for image hosting
   - Built-in authentication via `GITHUB_TOKEN`
   - Automatic image signing (future: cosign)
   - Multi-tag strategy for rollback capability

3. **Pre-Deployment Verification:**
   - Smoke tests before image publish
   - Health check validation
   - HTTP endpoint testing
   - Automatic cleanup of test artifacts

4. **Access Control:**
   - Minimal permissions: `contents: read`, `packages: write`
   - Branch protection on `master`
   - Required status checks before merge
   - Code review required (1 approver minimum)

## Security Audit History

### 2025

**January 15, 2025 - Production Deployment Security Hardening**
- Implemented LinuxServer.io security best practices
- Added Docker security hardening (read-only FS, capability dropping, non-root user)
- Created CI/CD pipeline with SBOM and provenance attestations
- Enhanced backup system with encryption and cloud storage
- Established coordinated vulnerability disclosure policy

**Pending Audits:**
- External security audit (planned for Q1 2025 before production launch)
- Penetration testing (planned for Q2 2025)
- GDPR compliance review (planned for Q2 2025)

### Security Enhancements Roadmap

**Phase 3 (Q1-Q2 2025):**
- [ ] Rate limiting and DDoS protection
- [ ] Two-factor authentication (2FA) for staff accounts
- [ ] Email-based password reset and verification
- [ ] Audit log export functionality
- [ ] Enhanced virus scanning for file uploads (ClamAV integration)

**Phase 4 (Q2-Q3 2025):**
- [ ] Advanced intrusion detection
- [ ] Security Information and Event Management (SIEM) integration
- [ ] Automated security scanning in CI/CD (Trivy, Snyk)
- [ ] Web Application Firewall (WAF) configuration
- [ ] Regular penetration testing program

**Long-term:**
- [ ] ISO 27001 compliance assessment
- [ ] SOC 2 Type II certification (if handling international clients)
- [ ] Enhanced encryption at rest (database-level)
- [ ] Hardware security module (HSM) for key management

## Compliance and Standards

GK-Nexus is designed to comply with:

1. **OWASP Top 10** - Protection against common web vulnerabilities
2. **CIS Docker Benchmark** - Container security hardening
3. **GDPR Principles** - Privacy by design and default
4. **Guyanese Data Protection** - Local regulatory compliance
5. **LinuxServer.io Standards** - Container image best practices (2024)

## Security Contact

For security-related questions or concerns:

- **Email:** security@greencrescent.gy
- **Emergency:** Contact system administrator directly
- **General Support:** support@greencrescent.gy

---

**Last Updated:** January 15, 2025
**Next Review:** April 15, 2025

This security policy is a living document and will be updated as GK-Nexus evolves and new security features are implemented.
