# GK-Nexus Database Schema (ERD)

This document provides a comprehensive Entity Relationship Diagram (ERD) for the GK-Nexus PostgreSQL database, showing all tables, relationships, and key constraints.

## Complete Database ERD

```mermaid
erDiagram
    %% ============================================
    %% AUTHENTICATION & USER MANAGEMENT
    %% ============================================

    user {
        text id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamp created_at
        timestamp updated_at
    }

    session {
        text id PK
        text token UK
        timestamp expires_at
        text user_id FK
        text ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }

    account {
        text id PK
        text account_id
        text provider_id
        text user_id FK
        text access_token
        text refresh_token
        text id_token
        timestamp access_token_expires_at
        timestamp refresh_token_expires_at
        text scope
        text password
        timestamp created_at
        timestamp updated_at
    }

    verification {
        text id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    password_setup_token {
        text id PK
        text user_id FK
        text token UK
        timestamp expires_at
        timestamp used_at
        timestamp created_at
    }

    %% ============================================
    %% STAFF & ROLES
    %% ============================================

    staff {
        text id PK
        text user_id FK,UK
        staff_role role
        text[] businesses
        text phone
        text job_title
        boolean is_active
        boolean can_view_financials
        timestamp created_at
        timestamp updated_at
    }

    %% ============================================
    %% CLIENT MANAGEMENT
    %% ============================================

    client {
        text id PK
        client_type type
        text display_name
        text first_name
        text last_name
        date date_of_birth
        text nationality
        text business_name
        text registration_number
        date incorporation_date
        text email
        text phone
        text alternate_phone
        text address
        text city
        text country
        text tin_number
        text national_id
        text passport_number
        preferred_contact_method preferred_contact_method
        text preferred_language
        client_aml_risk_rating aml_risk_rating
        boolean is_pep
        boolean requires_enhanced_due_diligence
        boolean gra_compliant
        boolean nis_compliant
        date last_compliance_check_date
        boolean onboarding_completed
        timestamp onboarding_completed_at
        text[] businesses
        client_status status
        text primary_staff_id FK
        text notes
        timestamp created_at
        timestamp updated_at
        text created_by_id FK
    }

    client_contact {
        text id PK
        text client_id FK
        text name
        text relationship
        text email
        text phone
        text is_primary
        text notes
        timestamp created_at
        timestamp updated_at
    }

    client_link {
        text id PK
        text client_id FK
        text linked_client_id FK
        client_link_type link_type
        text notes
        timestamp created_at
    }

    client_communication {
        text id PK
        text client_id FK
        communication_type type
        communication_direction direction
        text subject
        text summary
        text staff_id FK
        timestamp communicated_at
        timestamp created_at
    }

    client_service_selection {
        text id PK
        text client_id FK
        business business
        text service_code
        text service_name
        jsonb required_documents
        jsonb uploaded_documents
        service_selection_status status
        timestamp selected_at
        timestamp activated_at
        timestamp completed_at
        timestamp inactivated_at
        text notes
        date estimated_completion_date
        timestamp created_at
        timestamp updated_at
    }

    %% ============================================
    %% SERVICE TYPES & MATTERS
    %% ============================================

    service_type {
        text id PK
        business business
        text name
        text description
        service_type_category category
        jsonb default_checklist_items
        integer estimated_days
        decimal default_fee
        boolean is_active
        integer sort_order
        timestamp created_at
        timestamp updated_at
    }

    matter {
        text id PK
        text reference_number UK
        text client_id FK
        text service_type_id FK
        business business
        text title
        text description
        matter_status status
        matter_priority priority
        date start_date
        date due_date
        date completed_date
        text assigned_staff_id FK
        decimal estimated_fee
        decimal actual_fee
        boolean is_paid
        integer tax_year
        timestamp created_at
        timestamp updated_at
        text created_by_id FK
    }

    matter_checklist {
        text id PK
        text matter_id FK
        text item
        boolean is_completed
        timestamp completed_at
        text completed_by_id FK
        integer sort_order
        timestamp created_at
    }

    matter_note {
        text id PK
        text matter_id FK
        text content
        boolean is_internal
        text created_by_id FK
        timestamp created_at
    }

    matter_link {
        text id PK
        text matter_id FK
        text linked_matter_id FK
        matter_link_type link_type
        text notes
        timestamp created_at
    }

    %% ============================================
    %% DOCUMENTS & TEMPLATES
    %% ============================================

    document {
        text id PK
        text file_name
        text original_name
        text mime_type
        integer file_size
        text storage_path
        text cloud_backup_path
        boolean is_backed_up
        timestamp backuped_at
        document_category category
        text description
        text[] tags
        text client_id FK
        text matter_id FK
        document_status status
        date expiration_date
        boolean expiration_notified
        text uploaded_by_id FK
        timestamp created_at
        timestamp updated_at
        timestamp archived_at
    }

    document_template {
        text id PK
        text name
        text description
        template_category category
        business business
        text content
        jsonb placeholders
        boolean is_active
        integer sort_order
        text created_by_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% ============================================
    %% INVOICING & PAYMENTS
    %% ============================================

    invoice {
        text id PK
        text invoice_number UK
        business business
        text client_id FK
        text matter_id FK
        invoice_status status
        date invoice_date
        date due_date
        date paid_date
        decimal subtotal
        decimal tax_amount
        decimal total_amount
        decimal amount_paid
        decimal amount_due
        discount_type discount_type
        decimal discount_value
        decimal discount_amount
        text discount_reason
        text notes
        text terms
        text reference_number
        text pdf_url
        timestamp sent_at
        text sent_by_id FK
        timestamp created_at
        timestamp updated_at
        text created_by_id FK
    }

    invoice_line_item {
        text id PK
        text invoice_id FK
        text description
        decimal quantity
        decimal unit_price
        decimal amount
        text service_type_id
        integer sort_order
        timestamp created_at
    }

    invoice_payment {
        text id PK
        text invoice_id FK
        decimal amount
        date payment_date
        payment_method payment_method
        text reference_number
        text notes
        text recorded_by_id FK
        timestamp created_at
    }

    %% ============================================
    %% DEADLINES & SCHEDULING
    %% ============================================

    deadline {
        text id PK
        text title
        text description
        deadline_type type
        text client_id FK
        text matter_id FK
        business business
        timestamp due_date
        recurrence_pattern recurrence_pattern
        date recurrence_end_date
        text parent_deadline_id FK
        text assigned_staff_id FK
        boolean is_completed
        timestamp completed_at
        text completed_by_id FK
        deadline_priority priority
        timestamp created_at
        timestamp updated_at
        text created_by_id FK
    }

    deadline_reminder {
        text id PK
        text deadline_id FK
        integer days_before
        timestamp reminder_date
        boolean is_sent
        timestamp sent_at
        text recipient_email
        timestamp created_at
    }

    %% ============================================
    %% APPOINTMENTS
    %% ============================================

    appointment_type {
        text id PK
        text name
        text description
        integer default_duration_minutes
        business business
        text color
        boolean requires_approval
        boolean is_active
        integer sort_order
        timestamp created_at
        timestamp updated_at
    }

    staff_availability {
        text id PK
        text staff_id FK
        integer day_of_week
        time start_time
        time end_time
        boolean is_available
        business business
        timestamp created_at
        timestamp updated_at
    }

    staff_availability_override {
        text id PK
        text staff_id FK
        timestamp date
        boolean is_available
        time start_time
        time end_time
        text reason
        timestamp created_at
    }

    appointment {
        text id PK
        text appointment_type_id FK
        text client_id FK
        text matter_id FK
        business business
        text title
        text description
        timestamp scheduled_at
        timestamp end_at
        integer duration_minutes
        appointment_location_type location_type
        text location
        text assigned_staff_id FK
        appointment_status status
        text requested_by_portal_user_id
        text requested_by_staff_id FK
        timestamp requested_at
        text confirmed_by_id FK
        timestamp confirmed_at
        timestamp completed_at
        text cancelled_by_id FK
        timestamp cancelled_at
        text cancellation_reason
        text pre_appointment_notes
        text post_appointment_notes
        text client_notes
        timestamp created_at
        timestamp updated_at
    }

    appointment_reminder {
        text id PK
        text appointment_id FK
        appointment_reminder_type reminder_type
        integer reminder_minutes_before
        timestamp scheduled_at
        boolean is_sent
        timestamp sent_at
        timestamp created_at
    }

    %% ============================================
    %% CLIENT PORTAL
    %% ============================================

    portal_user {
        text id PK
        text client_id FK,UK
        text email UK
        text password_hash
        portal_user_status status
        boolean is_active
        boolean email_verified
        timestamp last_login_at
        timestamp last_activity_at
        text login_attempts
        text invited_by_id FK
        timestamp invited_at
        timestamp created_at
        timestamp updated_at
    }

    portal_invite {
        text id PK
        text client_id FK
        text email
        text token UK
        portal_invite_status status
        timestamp expires_at
        timestamp used_at
        text used_by_id FK
        timestamp revoked_at
        text revoked_by_id FK
        text revocation_reason
        text created_by_id FK
        timestamp created_at
    }

    portal_session {
        text id PK
        text portal_user_id FK
        text token UK
        timestamp expires_at
        text ip_address
        text user_agent
        timestamp created_at
        timestamp last_activity_at
    }

    portal_password_reset {
        text id PK
        text portal_user_id FK
        text token UK
        timestamp expires_at
        timestamp used_at
        timestamp created_at
    }

    portal_activity_log {
        text id PK
        text portal_user_id FK
        text client_id FK
        portal_activity_action action
        portal_activity_entity_type entity_type
        text entity_id
        jsonb metadata
        boolean is_impersonated
        text impersonated_by_user_id FK
        text session_id FK
        text ip_address
        text user_agent
        timestamp created_at
    }

    staff_impersonation_session {
        text id PK
        text token UK
        text staff_user_id FK
        text portal_user_id FK
        text client_id FK
        text reason
        timestamp started_at
        timestamp expires_at
        timestamp ended_at
        text ip_address
        text user_agent
        boolean is_active
    }

    %% ============================================
    %% KNOWLEDGE BASE
    %% ============================================

    knowledge_base_item {
        text id PK
        knowledge_base_type type
        knowledge_base_category category
        business business
        text title
        text description
        text short_description
        text file_name
        text storage_path
        text mime_type
        integer file_size
        text content
        boolean supports_auto_fill
        text template_id
        text[] related_services
        text[] required_for
        text agency_url
        text government_fees
        boolean is_active
        boolean is_staff_only
        boolean is_featured
        text created_by_id FK
        text last_updated_by_id FK
        timestamp created_at
        timestamp updated_at
        integer version
    }

    knowledge_base_download {
        text id PK
        text knowledge_base_item_id FK
        text downloaded_by_id
        text downloaded_by_type
        text client_id
        timestamp created_at
    }

    %% ============================================
    %% ACTIVITY LOGGING
    %% ============================================

    activity_log {
        text id PK
        text user_id FK
        text staff_id FK
        activity_action action
        entity_type entity_type
        text entity_id
        text description
        jsonb metadata
        text ip_address
        text user_agent
        timestamp created_at
    }

    %% ============================================
    %% SYSTEM BACKUP
    %% ============================================

    system_backup {
        text id PK
        text name
        text description
        text type
        text status
        text file_path
        integer file_size
        text checksum
        text cloud_path
        text cloud_provider
        boolean is_cloud_synced
        timestamp cloud_synced_at
        integer table_count
        integer record_count
        integer uploaded_files_count
        integer uploaded_files_size
        text app_version
        text schema_version
        text error_message
        timestamp started_at
        timestamp completed_at
        text created_by_id FK
        timestamp created_at
    }

    backup_schedule {
        text id PK
        text name
        text description
        text cron_expression
        boolean is_enabled
        integer retention_days
        boolean sync_to_cloud
        timestamp last_run_at
        timestamp next_run_at
        text last_backup_id FK
        integer success_count
        integer failure_count
        text created_by_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% ============================================
    %% RELATIONSHIPS
    %% ============================================

    %% User & Authentication
    user ||--o{ session : "has many"
    user ||--o{ account : "has many"
    user ||--o| staff : "has one"
    user ||--o{ password_setup_token : "has many"

    %% Staff Relationships
    staff ||--o{ client : "manages (primary_staff)"
    staff ||--o{ matter : "assigned to"
    staff ||--o{ client_communication : "handles"
    staff ||--o{ staff_availability : "has availability"
    staff ||--o{ staff_availability_override : "has overrides"
    staff ||--o{ appointment : "assigned appointments"

    %% Client Relationships
    client ||--o{ client_contact : "has contacts"
    client ||--o{ client_link : "links to other clients"
    client ||--o{ client_communication : "has communications"
    client ||--o{ client_service_selection : "has service selections"
    client ||--o{ matter : "has matters"
    client ||--o{ document : "has documents"
    client ||--o{ invoice : "has invoices"
    client ||--o{ deadline : "has deadlines"
    client ||--o{ appointment : "has appointments"
    client ||--o| portal_user : "has portal user"
    client ||--o{ portal_invite : "has invites"

    %% Service & Matter Relationships
    service_type ||--o{ matter : "used in"
    matter ||--o{ matter_checklist : "has checklist items"
    matter ||--o{ matter_note : "has notes"
    matter ||--o{ matter_link : "links to other matters"
    matter ||--o{ document : "has documents"
    matter ||--o{ invoice : "has invoices"
    matter ||--o{ deadline : "has deadlines"
    matter ||--o{ appointment : "has appointments"

    %% Document Relationships
    user ||--o{ document : "uploaded by"
    user ||--o{ document_template : "created templates"

    %% Invoice Relationships
    invoice ||--o{ invoice_line_item : "has line items"
    invoice ||--o{ invoice_payment : "has payments"
    user ||--o{ invoice : "created by"
    user ||--o{ invoice_payment : "recorded payments"

    %% Deadline Relationships
    deadline ||--o{ deadline_reminder : "has reminders"
    deadline ||--o{ deadline : "parent deadline (recurring)"
    user ||--o{ deadline : "created deadlines"
    user ||--o{ matter_checklist : "completed items"

    %% Appointment Relationships
    appointment_type ||--o{ appointment : "has appointments"
    appointment ||--o{ appointment_reminder : "has reminders"
    user ||--o{ appointment : "confirmed/cancelled"

    %% Portal Relationships
    portal_user ||--o{ portal_session : "has sessions"
    portal_user ||--o{ portal_password_reset : "has password resets"
    portal_user ||--o{ portal_activity_log : "has activity logs"
    portal_user ||--o{ staff_impersonation_session : "impersonated by staff"
    user ||--o{ portal_invite : "created invites"
    user ||--o{ portal_user : "invited by"
    user ||--o{ portal_activity_log : "impersonated by"
    user ||--o{ staff_impersonation_session : "staff impersonator"
    portal_session ||--o{ portal_activity_log : "logged activities"

    %% Knowledge Base Relationships
    user ||--o{ knowledge_base_item : "created/updated KB items"
    knowledge_base_item ||--o{ knowledge_base_download : "has downloads"

    %% Activity Log Relationships
    user ||--o{ activity_log : "performed actions"
    staff ||--o{ activity_log : "staff actions"

    %% Backup Relationships
    user ||--o{ system_backup : "created backups"
    user ||--o{ backup_schedule : "created schedules"
    system_backup ||--o| backup_schedule : "last backup"
```

## Database Statistics

### Total Tables: 45

#### Authentication & Users (5 tables)
- `user` - Staff user accounts
- `session` - Active user sessions
- `account` - OAuth provider accounts
- `verification` - Email verification tokens
- `password_setup_token` - Staff onboarding tokens

#### Staff Management (1 table)
- `staff` - Staff profiles and roles

#### Client Management (5 tables)
- `client` - Main client records
- `client_contact` - Client contact persons
- `client_link` - Client relationships (family/business)
- `client_communication` - Communication history
- `client_service_selection` - Services selected by clients

#### Services & Matters (5 tables)
- `service_type` - Service catalog
- `matter` - Client matters/cases
- `matter_checklist` - Matter task lists
- `matter_note` - Matter notes and updates
- `matter_link` - Linked matters (prerequisite/related)

#### Documents (2 tables)
- `document` - Uploaded documents
- `document_template` - Document generation templates

#### Invoicing (3 tables)
- `invoice` - Invoice headers
- `invoice_line_item` - Invoice line items
- `invoice_payment` - Payment records

#### Scheduling (7 tables)
- `deadline` - Deadlines and reminders
- `deadline_reminder` - Deadline notification schedule
- `appointment_type` - Appointment categories
- `staff_availability` - Weekly staff availability
- `staff_availability_override` - Date-specific availability changes
- `appointment` - Scheduled appointments
- `appointment_reminder` - Appointment notification schedule

#### Client Portal (6 tables)
- `portal_user` - Portal user accounts
- `portal_invite` - Portal invitation tokens
- `portal_session` - Portal user sessions
- `portal_password_reset` - Password reset tokens
- `portal_activity_log` - Portal activity tracking
- `staff_impersonation_session` - Staff viewing client portal

#### Knowledge Base (2 tables)
- `knowledge_base_item` - Forms, guides, templates
- `knowledge_base_download` - Download tracking

#### System (3 tables)
- `activity_log` - Audit trail for staff actions
- `system_backup` - Backup records
- `backup_schedule` - Automated backup configuration

## Key Enums

### Business Enums
- `business`: GCMC, KAJ
- `staff_role`: OWNER, GCMC_MANAGER, KAJ_MANAGER, STAFF_GCMC, STAFF_KAJ, STAFF_BOTH, RECEPTIONIST

### Client Enums
- `client_type`: INDIVIDUAL, SMALL_BUSINESS, CORPORATION, NGO, COOP, CREDIT_UNION, FOREIGN_NATIONAL, INVESTOR
- `client_status`: ACTIVE, INACTIVE, ARCHIVED
- `client_aml_risk_rating`: LOW, MEDIUM, HIGH
- `preferred_contact_method`: EMAIL, PHONE, WHATSAPP, IN_PERSON
- `communication_type`: PHONE, EMAIL, IN_PERSON, LETTER, WHATSAPP, OTHER
- `communication_direction`: INBOUND, OUTBOUND

### Service Enums
- `service_type_category`: TAX, ACCOUNTING, IMMIGRATION, PARALEGAL, TRAINING, CONSULTING, AUDIT, NIS, REGISTRATION, OTHER
- `matter_status`: NEW, IN_PROGRESS, PENDING_CLIENT, SUBMITTED, COMPLETE, CANCELLED
- `matter_priority`: LOW, NORMAL, HIGH, URGENT

### Document Enums
- `document_category`: IDENTITY, TAX, FINANCIAL, LEGAL, IMMIGRATION, BUSINESS, CORRESPONDENCE, TRAINING, OTHER
- `template_category`: LETTER, AGREEMENT, CERTIFICATE, FORM, REPORT, INVOICE, OTHER
- `document_status`: PENDING, ACTIVE, ARCHIVED

### Invoice Enums
- `invoice_status`: DRAFT, SENT, PAID, OVERDUE, CANCELLED
- `discount_type`: NONE, PERCENTAGE, FIXED_AMOUNT
- `payment_method`: CASH, CHEQUE, BANK_TRANSFER, CREDIT_CARD, DEBIT_CARD, MOBILE_MONEY, OTHER

### Deadline Enums
- `deadline_type`: FILING, RENEWAL, PAYMENT, SUBMISSION, MEETING, FOLLOWUP, OTHER
- `deadline_priority`: LOW, NORMAL, HIGH, URGENT
- `recurrence_pattern`: NONE, DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY

### Appointment Enums
- `appointment_location_type`: IN_PERSON, PHONE, VIDEO
- `appointment_status`: REQUESTED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED
- `appointment_reminder_type`: EMAIL, SMS, IN_APP

### Portal Enums
- `portal_user_status`: INVITED, ACTIVE, SUSPENDED, DEACTIVATED
- `portal_invite_status`: PENDING, USED, EXPIRED, REVOKED
- `portal_activity_action`: LOGIN, LOGOUT, VIEW_DASHBOARD, VIEW_MATTER, VIEW_DOCUMENT, DOWNLOAD_DOCUMENT, UPLOAD_DOCUMENT, VIEW_INVOICE, REQUEST_APPOINTMENT, CANCEL_APPOINTMENT, UPDATE_PROFILE, CHANGE_PASSWORD, VIEW_RESOURCES
- `portal_activity_entity_type`: MATTER, DOCUMENT, APPOINTMENT, INVOICE, RESOURCE

### Knowledge Base Enums
- `knowledge_base_type`: AGENCY_FORM, LETTER_TEMPLATE, GUIDE, CHECKLIST
- `knowledge_base_category`: GRA, NIS, IMMIGRATION, DCRA, GENERAL, TRAINING, INTERNAL

### Activity Log Enums
- `activity_action`: CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, UPLOAD, DOWNLOAD, STATUS_CHANGE, ASSIGN, COMPLETE, ARCHIVE
- `entity_type`: CLIENT, MATTER, DOCUMENT, DEADLINE, STAFF, SERVICE_TYPE, TEMPLATE, COMMUNICATION, NOTE, SESSION, APPOINTMENT, INVOICE

## Key Indexes

Performance-critical indexes are created on:

### Authentication
- `session.user_id`, `session.token`
- `account.user_id`
- `verification.identifier`

### Clients
- `client.type`, `client.status`, `client.display_name`, `client.email`, `client.tin_number`, `client.primary_staff_id`
- `client_communication.client_id`, `client_communication.communicated_at`
- `client_service_selection.client_id`, `client_service_selection.status`

### Matters
- `matter.client_id`, `matter.status`, `matter.reference_number`, `matter.assigned_staff_id`, `matter.due_date`
- `matter_checklist.matter_id`, `matter_checklist.is_completed`

### Documents
- `document.client_id`, `document.matter_id`, `document.category`, `document.status`, `document.expiration_date`, `document.is_backed_up`

### Invoices
- `invoice.invoice_number`, `invoice.client_id`, `invoice.status`, `invoice.due_date`
- `invoice_payment.invoice_id`, `invoice_payment.payment_date`

### Deadlines
- `deadline.client_id`, `deadline.matter_id`, `deadline.due_date`, `deadline.is_completed`, `deadline.assigned_staff_id`
- `deadline_reminder.deadline_id`, `deadline_reminder.reminder_date`, `deadline_reminder.is_sent`

### Appointments
- `appointment.client_id`, `appointment.scheduled_at`, `appointment.status`, `appointment.assigned_staff_id`
- `appointment_reminder.appointment_id`, `appointment_reminder.scheduled_at`

### Portal
- `portal_user.client_id`, `portal_user.email`, `portal_user.status`
- `portal_invite.client_id`, `portal_invite.token`, `portal_invite.status`, `portal_invite.expires_at`
- `portal_activity_log.portal_user_id`, `portal_activity_log.client_id`, `portal_activity_log.created_at`

### Activity Logs
- `activity_log.user_id`, `activity_log.staff_id`, `activity_log.action`, `activity_log.entity_type`, `activity_log.created_at`

## Foreign Key Constraints

All foreign key relationships use the following deletion policies:

### CASCADE Deletes
When parent is deleted, child records are also deleted:
- User → Session, Account, Password Setup Token
- Client → Client Contact, Client Link, Client Communication, Client Service Selection, Portal User, Portal Invite
- Matter → Matter Checklist, Matter Note, Matter Link, Invoice Line Item (via invoice)
- Invoice → Invoice Line Item, Invoice Payment
- Deadline → Deadline Reminder
- Appointment → Appointment Reminder
- Portal User → Portal Session, Portal Password Reset, Portal Activity Log
- Knowledge Base Item → Knowledge Base Download
- Staff → Staff Availability, Staff Availability Override

### RESTRICT Deletes
Prevent deletion if child records exist:
- Client → Matter, Invoice (must delete matters/invoices first)
- Matter → Appointment (can't delete matter with scheduled appointments)

### SET NULL Deletes
When parent is deleted, FK is set to NULL (soft relationship):
- User deleted → created_by_id, uploaded_by_id, assigned_staff_id, etc. set to NULL
- Staff deleted → primary_staff_id, assigned_staff_id set to NULL
- Client/Matter deleted → document associations nullified (documents preserved)

## Data Integrity Rules

### Required Fields
- All records require `created_at` timestamp
- User email must be unique
- Invoice number and matter reference number must be unique
- Portal user email must be unique per client

### Validation Constraints
- Email format validation (enforced at application layer)
- Phone number format validation (enforced at application layer)
- TIN number format validation (enforced at application layer)
- Positive amounts for invoices and payments
- Valid date ranges (start_date <= due_date)

### Default Values
- `status` fields default to initial state (ACTIVE, PENDING, NEW, etc.)
- Boolean flags default to `false` unless specified
- Arrays default to empty array `[]`
- Timestamps auto-set via `defaultNow()` and `$onUpdate()`

## Schema Versioning

Current schema version is tracked in migrations. All changes follow this process:

1. Generate migration: `bun run db:generate`
2. Review migration SQL
3. Apply to development: `bun run db:migrate`
4. Test thoroughly
5. Deploy to production with backup

---

**Last Updated**: 2025-01-15
**Schema Version**: Phase 2 Complete
**Total Tables**: 45
**Total Relationships**: 80+
