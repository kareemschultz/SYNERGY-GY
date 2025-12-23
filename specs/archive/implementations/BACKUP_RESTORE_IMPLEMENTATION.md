# Backup and Restore Implementation

## Overview

Complete backup and restore system for GK-Nexus including:
- CLI scripts for manual backup/restore
- Admin UI for backup management
- Scheduled automatic backups
- Cloud storage integration (S3/Cloudflare R2)
- Version-safe migrations

## Implementation Date

December 13, 2025

## Components

### 1. CLI Scripts

#### backup.sh
**Location:** `scripts/backup.sh`

Creates a complete backup including:
- PostgreSQL database dump (via `pg_dump`)
- Uploaded files from `data/uploads/`
- Manifest file with version info and checksums

**Usage:**
```bash
./scripts/backup.sh [backup-name]
./scripts/backup.sh pre-update
```

**Output:** `backups/{name}.tar.gz`

#### restore.sh
**Location:** `scripts/restore.sh`

Restores from a backup archive:
- Validates manifest and checksums
- Creates pre-restore backup (safety)
- Restores database
- Restores uploaded files
- Runs pending migrations

**Usage:**
```bash
./scripts/restore.sh backups/gk-nexus-backup-20241212.tar.gz
```

### 2. Database Schema

**Location:** `packages/db/src/schema/system.ts`

#### Tables:
- `system_backup` - Tracks all backup records
- `backup_schedule` - Stores scheduled backup configurations

#### Fields in system_backup:
- id, name, description, type (manual/scheduled/pre_update/pre_restore)
- status (pending/in_progress/completed/failed)
- filePath, fileSize, checksum
- cloudPath, cloudProvider (s3/r2), isCloudSynced
- tableCount, recordCount, uploadedFilesCount
- appVersion, schemaVersion
- errorMessage, startedAt, completedAt, createdAt

#### Fields in backup_schedule:
- id, name, cronExpression, isEnabled
- retentionDays, syncToCloud
- lastRunAt, nextRunAt
- successCount, failureCount

### 3. API Router

**Location:** `packages/api/src/routers/backup.ts`

#### Endpoints:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `backup.list` | query | List all backups |
| `backup.getById` | query | Get backup details |
| `backup.create` | mutation | Create manual backup |
| `backup.delete` | mutation | Delete backup file |
| `backup.download` | query | Get download URL |
| `schedule.list` | query | List schedules |
| `schedule.create` | mutation | Create schedule |
| `schedule.update` | mutation | Update schedule |
| `schedule.delete` | mutation | Delete schedule |
| `schedule.toggle` | mutation | Enable/disable |

### 4. Backup Scheduler

**Location:** `packages/api/src/utils/backup-scheduler.ts`

Background job that:
- Runs every 60 seconds
- Checks for enabled schedules
- Parses cron expressions
- Executes backups when due
- Applies retention policies
- Updates next run times

**Cron Support:**
- Standard 5-field format (minute hour day month weekday)
- Wildcards (*), ranges (1-5), steps (*/2), lists (1,3,5)

**Examples:**
```
0 2 * * *     # Daily at 2 AM
0 0 * * 0     # Weekly on Sunday
30 3 * * 1-5  # Weekdays at 3:30 AM
0 */6 * * *   # Every 6 hours
```

### 5. Cloud Storage

**Location:** `packages/api/src/utils/backup-storage.ts`

S3-compatible storage client supporting:
- AWS S3
- Cloudflare R2
- MinIO

**Functions:**
- `uploadBackup(filePath)` - Upload to cloud
- `downloadBackup(cloudPath, localPath)` - Download from cloud
- `deleteBackup(cloudPath)` - Delete from cloud
- `listCloudBackups()` - List cloud backups

### 6. Admin UI

**Location:** `apps/web/src/routes/app/settings/backup.tsx`

**Sections:**
1. **Manual Backup** - Create backup button with progress
2. **Backup History** - Table with all backups
3. **Scheduled Backups** - Configure automatic backups
4. **Cloud Storage** - Configure S3/R2 sync

### 7. Docker Production Setup

**Files:**
- `docker-compose.prod.yml` - Production stack
- `Dockerfile.prod` - Multi-stage production build
- `.env.production.example` - Environment template

## Environment Variables

```env
# Backup Storage (S3-compatible)
BACKUP_S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
BACKUP_S3_ACCESS_KEY_ID=your_access_key
BACKUP_S3_SECRET_ACCESS_KEY=your_secret_key
BACKUP_S3_BUCKET=gk-nexus-backups
BACKUP_S3_REGION=auto

# Docker Settings
POSTGRES_CONTAINER=gk-nexus-postgres
POSTGRES_USER=postgres
POSTGRES_DB=synergy_gy
```

## Backup File Structure

```
gk-nexus-backup-20241212.tar.gz
├── manifest.json          # Version info, checksums
├── database.sql           # PostgreSQL dump
└── uploads/               # Uploaded documents
    └── 2024/12/client-id/...
```

## Security

1. **Access Control:** Admin-only (OWNER, GCMC_MANAGER, KAJ_MANAGER)
2. **Audit Trail:** All backup/restore operations logged
3. **Checksums:** SHA256 verification for integrity
4. **Secrets Exclusion:** Environment secrets not backed up
5. **Cloud Security:** IAM credentials, private buckets

## Testing

### Manual Backup Test
```bash
./scripts/backup.sh test-backup
```

### Manual Restore Test
```bash
./scripts/restore.sh backups/test-backup.tar.gz
```

### API Test
```typescript
// Create backup via API
const backup = await client.backup.create({ name: "manual-backup" });

// List backups
const backups = await client.backup.list();
```

## Related Files

- `packages/db/src/schema/system.ts` - Schema
- `packages/db/src/schema/index.ts` - Schema exports
- `packages/api/src/routers/backup.ts` - API router
- `packages/api/src/routers/index.ts` - Router exports
- `packages/api/src/utils/backup-scheduler.ts` - Scheduler
- `packages/api/src/utils/backup-storage.ts` - Cloud storage
- `apps/server/src/index.ts` - Scheduler startup
- `apps/web/src/routes/app/settings/backup.tsx` - Admin UI
- `scripts/backup.sh` - CLI backup
- `scripts/restore.sh` - CLI restore
- `docker-compose.prod.yml` - Production Docker
- `Dockerfile.prod` - Production build
