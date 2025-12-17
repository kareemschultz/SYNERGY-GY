# Backup and Restore System Testing Guide

This document provides comprehensive testing procedures for the GK-Nexus backup and restore system implemented in commit `560f8f1`.

## Table of Contents

- [System Overview](#system-overview)
- [Components](#components)
- [Prerequisites](#prerequisites)
- [Manual Testing Procedures](#manual-testing-procedures)
- [CLI Script Usage](#cli-script-usage)
- [API Testing](#api-testing)
- [Expected Behaviors](#expected-behaviors)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

## System Overview

The backup and restore system provides complete data protection for GK-Nexus, including:

- **Database backup**: Full PostgreSQL database dump with schema and data
- **File backup**: All uploaded documents from `data/uploads/`
- **Metadata tracking**: Backup records in database with statistics and versioning
- **Scheduled backups**: Cron-based automated backup scheduling
- **Web UI**: Admin interface for creating, managing, and restoring backups
- **CLI scripts**: Standalone bash scripts for manual backup/restore operations

### Architecture

```
┌─────────────────┐
│   Web UI        │ (Admin Settings > Backup)
│  (React/TS)     │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ oRPC API │ (packages/api/src/routers/backup.ts)
    └────┬─────┘
         │
    ┌────▼──────────┐
    │  Bash Scripts │ (scripts/backup.sh, scripts/restore.sh)
    └───────────────┘
         │
    ┌────▼─────────┐
    │  PostgreSQL  │ (Docker container)
    │  Database    │
    └──────────────┘
```

## Components

### 1. Database Schema (`packages/db/src/schema/system.ts`)

**systemBackup table**: Tracks all backup operations
- `id`, `name`, `description`
- `type`: manual, scheduled, pre_update, pre_restore
- `status`: pending, in_progress, completed, failed
- `filePath`, `fileSize`, `checksum`
- `cloudPath`, `cloudProvider`, `isCloudSynced` (for future cloud sync)
- `tableCount`, `recordCount`, `uploadedFilesCount` (statistics)
- `appVersion`, `schemaVersion` (compatibility tracking)
- `errorMessage` (for failed backups)
- `startedAt`, `completedAt`, `createdById`

**backupSchedule table**: Automated backup schedules
- `id`, `name`, `description`
- `cronExpression` (e.g., "0 2 * * *" for daily at 2am)
- `isEnabled`, `retentionDays`, `syncToCloud`
- `lastRunAt`, `nextRunAt`, `lastBackupId`
- `successCount`, `failureCount`

### 2. Bash Scripts (`scripts/`)

**backup.sh**:
- Validates Docker is running and PostgreSQL container is accessible
- Creates timestamped backup directory structure
- Runs `pg_dump` to export database
- Copies uploaded files from `data/uploads/`
- Generates manifest.json with metadata (version, checksums, statistics)
- Creates tar.gz archive
- Calculates SHA256 checksum of archive
- Cleans up temporary files

**restore.sh**:
- Validates backup file exists and is valid format (.tar.gz or .zip)
- Extracts archive and validates manifest.json
- Verifies database file checksum (if available)
- Creates safety backup of current database before restore
- Drops and recreates database
- Restores database from SQL dump
- Runs migrations (unless --skip-migrations flag)
- Restores uploaded files
- Backs up existing uploads before overwriting

### 3. API Router (`packages/api/src/routers/backup.ts`)

**Endpoints** (all require admin privileges):
- `backup.create({ name?, description?, type? })` - Create new backup
- `backup.list({ page, limit, status?, type?, startDate?, endDate? })` - List backups
- `backup.getById({ id })` - Get backup details
- `backup.delete({ id, deleteFile })` - Delete backup record/file
- `backup.restore({ id, skipMigrations })` - Restore from backup
- `backup.getStats()` - Get backup statistics (counts, storage usage)
- `backup.schedules.list()` - List backup schedules
- `backup.schedules.create({ name, cronExpression, ... })` - Create schedule
- `backup.schedules.update({ id, ... })` - Update schedule
- `backup.schedules.toggle({ id, isEnabled })` - Enable/disable schedule
- `backup.schedules.delete({ id })` - Delete schedule
- `backup.listDiskFiles()` - List backup files on disk (untracked)

### 4. Web UI (`apps/web/src/components/settings/backup-settings.tsx`)

Admin interface accessible at `/app/settings` (Backup & System tab):
- Dashboard showing backup statistics
- Create manual backup button
- List of recent backups with status
- Actions: View details, Restore, Delete
- Backup file verification (checks if file exists on disk)
- Progress indicators for long-running operations

## Prerequisites

### System Requirements

- **Docker**: Must be installed and running
- **Bun**: For running migrations (optional if using `--skip-migrations`)
- **tar**: For creating/extracting archives (standard on Linux/macOS)
- **sha256sum** or **shasum**: For checksum verification (fallback supported)
- **Disk space**: At least 2x your database size + uploads size

### Database Requirements

- PostgreSQL container must be running: `bun run db:start`
- Container name: `gk-nexus-postgres` (configurable via `POSTGRES_CONTAINER` env var)
- Database name: `synergy_gy` (configurable via `POSTGRES_DB` env var)
- User: `postgres` (configurable via `POSTGRES_USER` env var)

### File Permissions

Both scripts must be executable:
```bash
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
```

## Manual Testing Procedures

### Test 1: Basic Backup Creation (CLI)

**Objective**: Verify backup script creates valid backup archive

**Steps**:
1. Ensure PostgreSQL container is running: `docker ps | grep gk-nexus-postgres`
2. Run backup script: `./scripts/backup.sh test-backup-001`
3. Wait for completion (should take <30 seconds for empty/small database)
4. Verify output shows:
   - "All prerequisites met"
   - "Database backup created"
   - "Archive created"
   - File path, size, and SHA256 checksum

**Expected Results**:
- Exit code: 0 (success)
- Archive created: `backups/test-backup-001.tar.gz`
- Archive size: >1KB (valid tar.gz)
- Manifest summary displayed with table/record counts
- No error messages

**Validation**:
```bash
# Check archive exists
ls -lh backups/test-backup-001.tar.gz

# Verify it's a valid tar.gz
tar -tzf backups/test-backup-001.tar.gz | head

# Extract and inspect manifest
tar -xzf backups/test-backup-001.tar.gz -C /tmp/
cat /tmp/test-backup-001/manifest.json | jq
```

### Test 2: Backup with Custom Name

**Objective**: Verify custom backup naming works

**Steps**:
1. Run: `./scripts/backup.sh pre-deployment-backup`
2. Verify archive name matches: `backups/pre-deployment-backup.tar.gz`

**Expected Results**:
- Custom name used instead of timestamp
- Backup succeeds with custom name

### Test 3: Backup Without Name (Auto-timestamp)

**Objective**: Verify auto-naming with timestamps

**Steps**:
1. Run: `./scripts/backup.sh`
2. Check archive name follows pattern: `gk-nexus-backup-YYYYMMDD_HHMMSS.tar.gz`

**Expected Results**:
- Timestamp-based name generated
- Format: `gk-nexus-backup-20241214_153045.tar.gz`

### Test 4: Backup Manifest Validation

**Objective**: Verify manifest contains correct metadata

**Steps**:
1. Create backup: `./scripts/backup.sh manifest-test`
2. Extract manifest: `tar -xzf backups/manifest-test.tar.gz manifest-test/manifest.json`
3. Inspect: `cat manifest-test/manifest.json | jq`

**Expected Fields**:
```json
{
  "version": "1.0.0",
  "appVersion": "<git-hash>",
  "gitBranch": "master",
  "schemaVersion": "<migration-file>.sql",
  "createdAt": "2024-12-14T15:30:45Z",
  "hostname": "<your-hostname>",
  "backupName": "manifest-test",
  "database": {
    "name": "synergy_gy",
    "tables": <number>,
    "estimatedRecords": <number>,
    "fileSize": <bytes>,
    "checksum": "<sha256>"
  },
  "uploads": {
    "count": <number>,
    "directory": "uploads/"
  },
  "compatibility": {
    "minRestoreVersion": "1.0.0",
    "postgresVersion": "16"
  }
}
```

### Test 5: Basic Restore (CLI)

**Objective**: Verify restore script works correctly

**Steps**:
1. Create backup: `./scripts/backup.sh before-restore`
2. Make a small change (e.g., add a test client via UI)
3. Run restore: `./scripts/restore.sh backups/before-restore.tar.gz --force`
4. Verify data reverted to backup state

**Expected Results**:
- Restore completes successfully
- Safety backup created: `backups/pre-restore-<timestamp>.sql`
- Database restored to backup state
- Uploads restored (if any existed)
- Migrations run automatically

**Warnings**:
- This will DELETE all current data!
- Always creates safety backup first
- Requires `--force` flag to skip confirmation prompt

### Test 6: Restore with Skip Migrations

**Objective**: Verify --skip-migrations flag works

**Steps**:
1. Run: `./scripts/restore.sh backups/test-backup.tar.gz --force --skip-migrations`
2. Verify output shows: "Skipping migrations as requested"

**Expected Results**:
- Database restored
- Migrations NOT run
- User instructed to run `bun run db:migrate` manually

### Test 7: Error Handling - Missing Docker

**Objective**: Verify script fails gracefully when Docker not running

**Steps**:
1. Stop Docker
2. Run: `./scripts/backup.sh`

**Expected Results**:
- Error message: "Docker is not running. Please start Docker and try again."
- Exit code: 1 (failure)
- No partial backup created

### Test 8: Error Handling - Missing Container

**Objective**: Verify script fails when PostgreSQL container not running

**Steps**:
1. Ensure Docker running but PostgreSQL container stopped
2. Run: `./scripts/backup.sh`

**Expected Results**:
- Error: "PostgreSQL container 'gk-nexus-postgres' is not running."
- Suggestion: "Start it with: bun run db:start"
- Exit code: 1

### Test 9: Error Handling - Invalid Backup File

**Objective**: Verify restore rejects invalid files

**Steps**:
1. Create fake backup: `echo "fake" > backups/fake-backup.tar.gz`
2. Run: `./scripts/restore.sh backups/fake-backup.tar.gz --force`

**Expected Results**:
- Error: "Invalid backup archive structure" or similar
- Database NOT modified
- Exit code: 1

### Test 10: Error Handling - Checksum Mismatch

**Objective**: Verify restore detects corrupted backups

**Steps**:
1. Create valid backup
2. Extract and modify database.sql
3. Repackage without updating manifest
4. Attempt restore

**Expected Results**:
- Warning: "Database checksum mismatch!"
- Expected vs Actual checksum shown
- Prompt to continue (if not using --force)
- Can abort restore

### Test 11: API Backup Creation

**Objective**: Verify API endpoint creates backups correctly

**Prerequisites**:
- Application running: `bun run dev`
- Logged in as admin user

**Steps**:
1. Use admin account to access `/app/settings`
2. Navigate to "Backup & System" tab
3. Click "Create Backup" button
4. Wait for completion toast notification

**Expected Results**:
- Backup status shows "in_progress" then "completed"
- Toast: "Backup created successfully"
- Backup appears in list with:
  - Name: `gk-nexus-backup-<timestamp>`
  - Type: manual
  - Status: completed
  - File size displayed
  - Table/record/file counts shown
- Archive file exists in `backups/` directory
- Database record created in `system_backup` table

**Validation Queries**:
```sql
-- Check latest backup record
SELECT * FROM system_backup ORDER BY created_at DESC LIMIT 1;

-- Verify statistics
SELECT name, status, table_count, record_count, file_size
FROM system_backup
WHERE type = 'manual'
ORDER BY created_at DESC LIMIT 5;
```

### Test 12: API Backup Listing

**Objective**: Verify list endpoint returns correct data

**Steps**:
1. Create 3-5 backups via UI or CLI
2. Access Settings > Backup & System
3. Verify backup list displays correctly

**Expected Results**:
- All backups shown in descending chronological order
- Each entry shows:
  - Name
  - Type badge (manual/scheduled/etc.)
  - Status badge (completed/failed/in_progress)
  - Created date/time
  - File size
  - Statistics (tables, records, files)
  - Actions: View, Restore, Delete
- Pagination works (if >10 backups)

### Test 13: API Backup Statistics

**Objective**: Verify getStats endpoint returns accurate data

**Steps**:
1. Create several backups (mix of successful and failed if possible)
2. Check statistics card in UI

**Expected Results**:
- Total backups count
- Completed count
- Failed count
- In-progress count
- Latest backup info (name, date, size)
- Storage usage (database records vs disk files)
- Disk file count includes untracked backups

### Test 14: API Backup Restore

**Objective**: Verify UI restore functionality

**Steps**:
1. Create backup: "before-test-restore"
2. Make changes to data (add/edit/delete records)
3. Click "Restore" on backup
4. Confirm in dialog
5. Wait for completion

**Expected Results**:
- Confirmation dialog shows:
  - Warning about data replacement
  - Backup file name
  - Database name
- Restore progress indicator
- Success toast: "Restore completed successfully"
- Instruction to refresh browser
- Data reverted to backup state after refresh

**Note**: Restore may take 30-120 seconds depending on database size.

### Test 15: API Backup Deletion

**Objective**: Verify delete removes record and file

**Steps**:
1. Create test backup
2. Click "Delete" in UI
3. Confirm deletion

**Expected Results**:
- Confirmation dialog shown
- Both database record AND file deleted
- Backup removed from list
- Success toast shown
- File no longer exists in `backups/` directory

**Validation**:
```bash
# Verify file deleted
ls backups/ | grep <backup-name>

# Should return nothing
```

### Test 16: Backup Schedule Creation

**Objective**: Verify schedule configuration works

**Steps**:
1. Access Settings > Backup & System
2. Find "Backup Schedules" section
3. Click "Create Schedule"
4. Configure:
   - Name: "Daily Backup"
   - Cron: "0 2 * * *" (2am daily)
   - Retention: 30 days
   - Sync to cloud: false
5. Save

**Expected Results**:
- Schedule created in database
- Listed in schedules table
- Enabled by default
- Success count: 0, Failure count: 0

**Note**: Actual execution requires cron scheduler (not implemented in Phase 6 - future enhancement).

### Test 17: Large Backup (Stress Test)

**Objective**: Verify system handles larger backups

**Prerequisites**:
- Database with >1000 records
- Several uploaded files (>100MB total)

**Steps**:
1. Run: `./scripts/backup.sh large-backup-test`
2. Monitor execution time
3. Verify archive size

**Expected Results**:
- Backup completes within 5 minutes
- Archive size reasonable (compressed)
- No memory/timeout errors
- Manifest shows correct counts

### Test 18: Concurrent Backup Prevention

**Objective**: Verify only one backup runs at a time

**Steps**:
1. Start backup via API/UI
2. Immediately try to start another backup
3. Check behavior

**Expected Behavior**:
- First backup shows "in_progress"
- Second backup may:
  - Queue and wait (not implemented - future enhancement)
  - OR fail with error message
- Check database for multiple "in_progress" records

**Current Limitation**: System may allow concurrent backups. Consider implementing lock mechanism.

### Test 19: Uploaded Files Backup/Restore

**Objective**: Verify file backup works correctly

**Prerequisites**:
- Upload several documents via Documents page
- Verify files exist in `data/uploads/`

**Steps**:
1. Note current files: `ls -R data/uploads/`
2. Create backup
3. Delete some uploaded files
4. Restore backup
5. Verify files restored

**Expected Results**:
- Backup includes all uploaded files
- Restore recreates missing files
- Existing uploads backed up before restore
- Moved to: `backups/uploads-pre-restore-<timestamp>/`

### Test 20: Cross-Environment Restore

**Objective**: Verify backups portable between environments

**Steps**:
1. Create backup on development machine
2. Copy archive to different machine
3. Extract and inspect manifest
4. Restore on second machine

**Expected Results**:
- Archive portable (not machine-specific)
- Manifest shows original hostname
- Restore succeeds on different machine
- Data identical after restore

**Note**: Requires same PostgreSQL version (16) and compatible schema.

## CLI Script Usage

### backup.sh

**Basic Usage**:
```bash
# Create backup with auto-generated name
./scripts/backup.sh

# Create backup with custom name
./scripts/backup.sh my-backup-name

# Create backup before update
./scripts/backup.sh pre-update-$(date +%Y%m%d)
```

**Environment Variables**:
```bash
# Override defaults
POSTGRES_CONTAINER=my-postgres-container \
POSTGRES_USER=myuser \
POSTGRES_DB=mydb \
./scripts/backup.sh
```

**Exit Codes**:
- `0` - Success
- `1` - Error (Docker not running, container not found, backup failed, etc.)

**Output Files**:
- `backups/<name>.tar.gz` - Compressed archive
- Archive contains:
  - `manifest.json` - Backup metadata
  - `database.sql` - PostgreSQL dump
  - `uploads/` - Uploaded files (if any)

### restore.sh

**Basic Usage**:
```bash
# Interactive restore (prompts for confirmation)
./scripts/restore.sh backups/my-backup.tar.gz

# Force restore (no prompts)
./scripts/restore.sh backups/my-backup.tar.gz --force

# Restore without running migrations
./scripts/restore.sh backups/my-backup.tar.gz --force --skip-migrations
```

**Flags**:
- `--force` - Skip confirmation prompts (use with caution!)
- `--skip-migrations` - Don't run database migrations after restore
- `-h`, `--help` - Show help message

**Safety Features**:
- Creates safety backup before restore: `backups/pre-restore-<timestamp>.sql`
- Validates manifest and checksums
- Backs up existing uploads before overwriting

**Exit Codes**:
- `0` - Success
- `1` - Error (file not found, validation failed, restore failed, etc.)

## API Testing

### Using curl

**Create Backup**:
```bash
curl -X POST http://localhost:3000/backup/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type": "manual", "name": "api-test-backup"}'
```

**List Backups**:
```bash
curl http://localhost:3000/backup/list?page=1&limit=10 \
  -H "Authorization: Bearer <token>"
```

**Get Statistics**:
```bash
curl http://localhost:3000/backup/getStats \
  -H "Authorization: Bearer <token>"
```

**Restore Backup**:
```bash
curl -X POST http://localhost:3000/backup/restore \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"id": "<backup-id>", "skipMigrations": false}'
```

**Delete Backup**:
```bash
curl -X DELETE http://localhost:3000/backup/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"id": "<backup-id>", "deleteFile": true}'
```

### Using oRPC Client (TypeScript)

```typescript
import { client } from "@/utils/orpc";

// Create backup
const result = await client.backup.create({
  type: "manual",
  name: "test-backup",
  description: "Testing backup system"
});

// List backups
const backups = await client.backup.list({
  page: 1,
  limit: 20,
  status: "completed"
});

// Get statistics
const stats = await client.backup.getStats();

// Restore
await client.backup.restore({
  id: backupId,
  skipMigrations: false
});

// Delete
await client.backup.delete({
  id: backupId,
  deleteFile: true
});
```

## Expected Behaviors

### Backup Creation

**Normal Operation**:
1. Status changes: `pending` → `in_progress` → `completed`
2. Duration: 10-60 seconds (depends on database size)
3. File created in `backups/` directory
4. Database record updated with:
   - File path, size, checksum
   - Table count, record count, file count
   - Completion timestamp

**Error Cases**:
- Docker not running → Fails immediately with clear error
- Container not found → Fails with instruction to start container
- Disk full → Fails during backup creation
- Permission denied → Fails with permission error

### Backup Restoration

**Normal Operation**:
1. Validates backup file exists and is valid
2. Shows backup metadata (date, size, table count)
3. Prompts for confirmation (unless `--force`)
4. Creates safety backup of current data
5. Drops and recreates database
6. Restores from backup SQL dump
7. Runs migrations (unless `--skip-migrations`)
8. Restores uploaded files
9. Completes in 30-180 seconds

**Error Cases**:
- File not found → Fails before any changes
- Invalid archive → Fails during extraction
- Checksum mismatch → Warns and prompts to continue/abort
- Restore fails → Safety backup available for recovery

### Backup Deletion

**Normal Operation**:
1. Deletes database record
2. Deletes file from disk (if `deleteFile: true`)
3. Both operations atomic (if possible)

**Error Cases**:
- Backup not found → 404 error
- File deletion fails → Record deleted, file remains (logged)

### Schedule Management

**Normal Operation**:
1. Create: Validates cron expression, creates record
2. Toggle: Enables/disables schedule
3. Update: Modifies schedule parameters
4. Delete: Removes schedule (doesn't delete associated backups)

**Note**: Actual scheduled execution not implemented in Phase 6. Requires cron scheduler integration (future enhancement).

## Known Limitations

### Current Phase 6 Limitations

1. **No Cron Scheduler**: Backup schedules can be created/managed via UI, but automatic execution is not implemented. Manual backups only.

2. **No Cloud Sync**: Database schema includes cloud sync fields (S3/R2), but upload functionality not implemented. All backups stored locally only.

3. **No Retention Enforcement**: `retentionDays` setting exists but automatic cleanup not implemented. Old backups must be deleted manually.

4. **Single Backup at a Time**: No locking mechanism to prevent concurrent backups. Starting multiple backups simultaneously may cause conflicts.

5. **No Incremental Backups**: All backups are full backups. No differential or incremental backup support.

6. **No Compression Options**: Always uses `tar -czf` (gzip). No option for other compression algorithms (bzip2, xz, etc.).

7. **No Encryption**: Backups stored unencrypted. Sensitive data not protected at rest.

8. **No Email Notifications**: Success/failure notifications not sent. Admin must check UI/logs.

9. **No Backup Verification**: No automated integrity checking after backup creation (beyond checksum).

10. **Limited Error Recovery**: If backup fails mid-process, temporary files may remain in `backups/` directory.

### Script Limitations

1. **Docker Dependency**: Scripts require Docker. Cannot backup/restore standalone PostgreSQL installations.

2. **PostgreSQL Version**: Hardcoded to version 16. May fail with older/newer versions.

3. **Linux/macOS Only**: Scripts use bash-specific features. Windows requires WSL or Git Bash.

4. **No Progress Bars**: Long backups show no progress indicator (CLI only shows final result).

5. **File Size**: Very large backups (>10GB) may timeout or exhaust memory. Adjust timeout in API router if needed.

### Database Limitations

1. **No Point-in-Time Recovery**: Backups are snapshots only. Cannot restore to specific timestamp between backups.

2. **Active Connections**: Restore drops database, terminating all active connections. Users will be logged out.

3. **Migration Compatibility**: Restoring old backups to newer schema may fail if migrations not backward compatible.

## Troubleshooting

### Problem: "Docker is not running"

**Cause**: Docker daemon not started

**Solution**:
```bash
# Linux
sudo systemctl start docker

# macOS
open -a Docker

# Verify
docker ps
```

### Problem: "PostgreSQL container not running"

**Cause**: Database container stopped

**Solution**:
```bash
# Start container
bun run db:start

# Or with Docker Compose
docker-compose up -d postgres

# Verify
docker ps | grep postgres
```

### Problem: "Backup script not executable"

**Cause**: Missing execute permissions

**Solution**:
```bash
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
```

### Problem: "Backup failed or file is empty"

**Causes**:
- Database connection failed
- Insufficient disk space
- Permission denied writing to `backups/` directory

**Solutions**:
```bash
# Check disk space
df -h

# Check permissions
ls -ld backups/
# Should be writable

# Create if missing
mkdir -p backups

# Check database connectivity
docker exec gk-nexus-postgres psql -U postgres -d synergy_gy -c "SELECT 1"
```

### Problem: "Database restore failed"

**Causes**:
- Corrupted backup file
- Version mismatch
- Migration failures

**Solutions**:
```bash
# Verify backup integrity
tar -tzf backups/my-backup.tar.gz

# Extract and inspect manually
tar -xzf backups/my-backup.tar.gz -C /tmp/
ls -la /tmp/my-backup/

# Restore from safety backup
./scripts/restore.sh backups/pre-restore-<timestamp>.sql --force
```

### Problem: "Checksum mismatch warning"

**Cause**: Backup file modified or corrupted after creation

**Solutions**:
- If you trust the backup, continue anyway (prompted)
- If suspicious, do not restore - use a different backup
- Verify archive integrity: `tar -tzf <file>`

### Problem: "Migrations failed after restore"

**Cause**: Schema incompatibility between backup and current code

**Solutions**:
```bash
# Restore without migrations
./scripts/restore.sh backups/my-backup.tar.gz --force --skip-migrations

# Manually run migrations
bun run db:migrate

# Check migration status
bun run db:studio
# Inspect drizzle migrations table
```

### Problem: "Uploaded files not restored"

**Causes**:
- Backup created before files uploaded
- Files not in standard `data/uploads/` location
- Permission issues

**Solutions**:
```bash
# Check backup contents
tar -tzf backups/my-backup.tar.gz | grep uploads

# Verify uploads exist
ls -R data/uploads/

# Check backup manifest
tar -xzf backups/my-backup.tar.gz -O my-backup/manifest.json | jq .uploads
```

### Problem: "API timeout during restore"

**Cause**: Large backup exceeds default timeout (10 minutes)

**Solution**: Increase timeout in `packages/api/src/routers/backup.ts`:
```typescript
// Line 433: Increase timeout
timeout: 600_000  // Change to higher value (milliseconds)
```

### Problem: "Cannot access backups in UI"

**Causes**:
- Not logged in as admin
- Permission denied

**Solution**:
- Ensure user has `OWNER` or `MANAGER` role
- Check staff profile in database:
```sql
SELECT u.email, s.role, s.is_active
FROM "user" u
JOIN staff s ON s.user_id = u.id
WHERE u.email = 'your-email@example.com';
```

### Problem: "Backup file exists but shows as missing in UI"

**Cause**: File path mismatch or file moved

**Solutions**:
```bash
# Verify file path in database
# Check file path in system_backup table matches actual location

# Update file path if needed (via SQL)
UPDATE system_backup
SET file_path = '/correct/path/to/backup.tar.gz'
WHERE id = '<backup-id>';
```

### Problem: "Out of disk space during backup"

**Solutions**:
```bash
# Check disk usage
df -h

# Delete old backups
rm backups/old-backup-*.tar.gz

# Update database to reflect deletions
# (or use UI delete button which handles both)
```

## Testing Checklist

Use this checklist to verify all functionality:

- [ ] CLI backup creation (default name)
- [ ] CLI backup creation (custom name)
- [ ] CLI restore (with confirmation)
- [ ] CLI restore (--force flag)
- [ ] CLI restore (--skip-migrations flag)
- [ ] Backup manifest validation
- [ ] Database checksum verification
- [ ] Uploaded files backup/restore
- [ ] Safety backup creation before restore
- [ ] API backup creation
- [ ] API backup listing
- [ ] API backup statistics
- [ ] API backup restore
- [ ] API backup deletion
- [ ] UI backup creation
- [ ] UI backup list display
- [ ] UI restore functionality
- [ ] UI delete functionality
- [ ] Schedule creation/editing
- [ ] Schedule enable/disable
- [ ] Error handling (Docker not running)
- [ ] Error handling (container not running)
- [ ] Error handling (invalid backup file)
- [ ] Error handling (checksum mismatch)
- [ ] Large backup (>100MB)
- [ ] Cross-environment restore

## Additional Resources

- **Backup Script**: `/home/kareem/SYNERGY-GY/scripts/backup.sh`
- **Restore Script**: `/home/kareem/SYNERGY-GY/scripts/restore.sh`
- **API Router**: `/home/kareem/SYNERGY-GY/packages/api/src/routers/backup.ts`
- **Database Schema**: `/home/kareem/SYNERGY-GY/packages/db/src/schema/system.ts`
- **UI Component**: `/home/kareem/SYNERGY-GY/apps/web/src/components/settings/backup-settings.tsx`
- **Backups Directory**: `/home/kareem/SYNERGY-GY/backups/`

## Future Enhancements (Post-Phase 6)

The following features are planned but not yet implemented:

1. **Automated Scheduling**: Cron-based execution of backup schedules
2. **Cloud Sync**: Automatic upload to S3/Cloudflare R2
3. **Retention Enforcement**: Automatic deletion of backups older than retention period
4. **Email Notifications**: Success/failure alerts
5. **Incremental Backups**: Differential backups to reduce size/time
6. **Encryption**: Encrypted backups with password protection
7. **Backup Verification**: Automated integrity checking post-backup
8. **Progress Indicators**: Real-time progress for long-running backups
9. **Concurrent Backup Prevention**: Lock mechanism to prevent overlapping backups
10. **Backup Comparison**: Diff tool to compare backup contents

---

**Document Version**: 1.0.0
**Last Updated**: 2024-12-14
**Author**: Claude Sonnet 4.5
**Related Commit**: 560f8f1 (feat: add complete backup and restore system)
