# Disaster Recovery Plan

This document outlines the disaster recovery (DR) strategy for GK-Nexus, including recovery objectives, procedures, and testing requirements.

## Table of Contents

- [Recovery Objectives](#recovery-objectives)
- [Backup Strategy](#backup-strategy)
- [Disaster Scenarios](#disaster-scenarios)
- [Recovery Procedures](#recovery-procedures)
- [Testing Schedule](#testing-schedule)
- [Roles and Responsibilities](#roles-and-responsibilities)
- [Contact Information](#contact-information)

---

## Recovery Objectives

### Recovery Point Objective (RPO)

**Target: 24 hours maximum data loss**

- Automated daily backups ensure no more than 24 hours of data can be lost
- For critical periods (month-end, tax filing deadlines), increase backup frequency

| Backup Frequency | RPO | Use Case |
|-----------------|-----|----------|
| Daily (default) | 24 hours | Normal operations |
| Every 6 hours | 6 hours | Critical periods |
| Hourly | 1 hour | High-volume data entry |

### Recovery Time Objective (RTO)

**Target: 4 hours maximum downtime**

| Recovery Phase | Target Time | Description |
|---------------|-------------|-------------|
| Detection | 15 minutes | Monitor alerts, user reports |
| Assessment | 30 minutes | Identify scope and recovery path |
| Infrastructure | 1 hour | Restore server/containers |
| Data Restoration | 1.5 hours | Restore database and files |
| Verification | 45 minutes | Test functionality |
| Communication | 30 minutes | Notify stakeholders |
| **Total** | **4 hours** | |

---

## Backup Strategy

### What Gets Backed Up

1. **PostgreSQL Database**
   - All tables with schema and data
   - User accounts, clients, matters, documents metadata
   - Configuration and audit logs

2. **Uploaded Files**
   - All documents in `data/uploads/`
   - Client documents, templates, generated files

3. **Metadata**
   - Manifest with checksums for integrity verification
   - Schema version for compatibility checking
   - Statistics (table counts, record counts)

### Backup Locations

| Location | Type | Retention | Access |
|----------|------|-----------|--------|
| `/backups/` (local) | Primary | 30 days | Immediate |
| External drive | Secondary | 90 days | On-site |
| Cloud storage (future) | Tertiary | 1 year | Remote |

### Automated Schedule

Default cron schedule: `0 2 * * *` (daily at 2:00 AM)

Configure schedules via Admin > Settings > Backup:
- Name each schedule descriptively
- Set appropriate retention period
- Enable email notifications (future)

---

## Disaster Scenarios

### Scenario 1: Database Corruption

**Symptoms:**
- Application errors referencing database
- Data inconsistencies reported by users
- PostgreSQL container failing to start

**Recovery Path:**
1. Stop the application server
2. Identify last known good backup
3. Follow [Full Restore Procedure](#full-restore-procedure)
4. Verify data integrity

**Estimated Recovery Time:** 2-3 hours

### Scenario 2: Server Hardware Failure

**Symptoms:**
- Complete system unavailability
- Unable to SSH or access server

**Recovery Path:**
1. Provision new server or repair existing
2. Install Docker and dependencies
3. Deploy GK-Nexus containers
4. Restore from backup (local or external)
5. Update DNS if IP changed

**Estimated Recovery Time:** 4-6 hours

### Scenario 3: Accidental Data Deletion

**Symptoms:**
- User reports missing records
- Audit log shows unexpected deletions

**Recovery Path:**
1. Assess scope of deletion
2. For single records: Use point-in-time recovery (if available)
3. For bulk deletion: Restore from backup to staging
4. Selectively restore needed records
5. Document incident

**Estimated Recovery Time:** 1-3 hours

### Scenario 4: Ransomware/Security Breach

**Symptoms:**
- Encrypted files
- Unauthorized access in audit logs
- Performance degradation

**Recovery Path:**
1. **IMMEDIATELY** isolate system (disconnect network)
2. Preserve evidence (snapshot if virtualized)
3. Notify security team and management
4. Provision clean server
5. Restore from verified clean backup
6. Change all credentials
7. Conduct post-incident review

**Estimated Recovery Time:** 8-24 hours

---

## Recovery Procedures

### Quick Reference Commands

```bash
# Check if backup exists and is valid
tar -tzf /path/to/backup.tar.gz | head

# View manifest from backup
tar -xzf backup.tar.gz backup-name/manifest.json -O | jq

# Verify checksum
sha256sum backup.tar.gz
```

### Pre-Restore Checklist

- [ ] Identify the backup file to restore
- [ ] Verify backup integrity (checksum matches)
- [ ] Confirm backup timestamp covers required data
- [ ] Notify users of planned downtime
- [ ] Ensure sufficient disk space (2x backup size)
- [ ] Have database credentials ready

### Full Restore Procedure

**Step 1: Stop Application**

```bash
cd /home/karetech/infrastructure/docker/gk-nexus
docker compose down
```

**Step 2: Verify Backup**

```bash
# Check backup exists
ls -lh backups/your-backup.tar.gz

# Verify it's a valid archive
tar -tzf backups/your-backup.tar.gz | head

# Check manifest for compatibility
tar -xzf backups/your-backup.tar.gz -C /tmp/
cat /tmp/backup-name/manifest.json | jq '.schemaVersion, .appVersion'
```

**Step 3: Start Database Only**

```bash
docker compose up -d postgres
# Wait for healthy status
docker compose ps
```

**Step 4: Execute Restore**

```bash
./scripts/restore.sh backups/your-backup.tar.gz

# Or from API (if server running):
# POST /api/backup/restore with backup ID
```

**Step 5: Start Full Application**

```bash
docker compose up -d
```

**Step 6: Verify Restoration**

1. Access the application: `http://localhost:4000`
2. Log in with admin credentials
3. Check dashboard for data presence
4. Verify recent records exist
5. Test core functionality:
   - Client search
   - Document download
   - Invoice generation
6. Check audit logs for restoration entry

### Partial Restore (Selective Data)

For restoring specific tables without full restore:

```bash
# Extract backup
tar -xzf backups/your-backup.tar.gz -C /tmp/

# Restore specific table only
docker exec -i gk-nexus-postgres psql -U postgres -d synergy_gy \
  -c "TRUNCATE TABLE clients CASCADE;" \
  -c "\copy clients FROM '/tmp/backup-name/database/clients.csv' CSV HEADER"
```

**Warning:** Partial restores may cause referential integrity issues. Use with caution.

---

## Testing Schedule

### Monthly: Backup Verification

**Frequency:** First Monday of each month
**Duration:** 30 minutes
**Performed by:** System Administrator

**Tasks:**
1. Verify automated backups are running (check schedule last run)
2. Download latest backup and verify integrity
3. Check backup file sizes are reasonable
4. Review backup storage usage
5. Document any issues in maintenance log

### Quarterly: Full Restore Test

**Frequency:** January, April, July, October
**Duration:** 2-4 hours
**Performed by:** System Administrator + IT Manager

**Tasks:**
1. Schedule maintenance window
2. Notify users of planned test
3. Create fresh backup before test
4. Perform full restore to staging environment
5. Verify all data and functionality
6. Document recovery time achieved
7. Compare against RTO target
8. Report findings to management

### Annual: Complete DR Drill

**Frequency:** Once per year (recommend Q4)
**Duration:** Full day
**Performed by:** All IT staff

**Tasks:**
1. Simulate complete system failure
2. Follow full recovery procedure
3. Measure actual RTO/RPO achieved
4. Test all disaster scenarios
5. Review and update this document
6. Train staff on procedures
7. Present findings to leadership

---

## Testing Log Template

```markdown
## DR Test - [Date]

**Type:** Monthly / Quarterly / Annual
**Performed by:** [Name]

### Results

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Detection | 15 min | ___ min | Pass/Fail |
| Restore Time | 1.5 hr | ___ hr | Pass/Fail |
| Data Integrity | 100% | ___% | Pass/Fail |
| App Functional | Yes | Yes/No | Pass/Fail |

### Issues Found
- [List any problems encountered]

### Actions Required
- [List follow-up tasks]

### Sign-off
- [ ] Test completed successfully
- [ ] Documentation updated
- [ ] Management notified
```

---

## Roles and Responsibilities

| Role | Responsibilities |
|------|-----------------|
| **System Administrator** | Execute backups, perform restores, maintain scripts |
| **IT Manager** | Approve DR tests, review procedures, escalation point |
| **Business Owner** | Define RPO/RTO requirements, authorize downtime |
| **End Users** | Report issues promptly, save work frequently |

---

## Contact Information

### Internal Contacts

| Role | Name | Contact |
|------|------|---------|
| System Admin | [Name] | [Phone/Email] |
| IT Manager | [Name] | [Phone/Email] |
| Business Owner | [Name] | [Phone/Email] |

### External Contacts

| Service | Provider | Support Contact |
|---------|----------|-----------------|
| Hosting | [Provider] | [Support line] |
| Database | PostgreSQL | community support |
| Domain/DNS | [Registrar] | [Support] |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | GK-Nexus Team | Initial creation |

---

## Related Documentation

- [BACKUP_TESTING.md](./BACKUP_TESTING.md) - Detailed backup testing procedures
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Container deployment guide
- Admin UI: `/app/admin/settings` - Backup management interface
