CREATE TYPE "public"."activity_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'UPLOAD', 'DOWNLOAD', 'STATUS_CHANGE', 'ASSIGN', 'COMPLETE', 'ARCHIVE');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('CLIENT', 'MATTER', 'DOCUMENT', 'DEADLINE', 'STAFF', 'SERVICE_TYPE', 'TEMPLATE', 'COMMUNICATION', 'NOTE', 'SESSION', 'APPOINTMENT', 'INVOICE');--> statement-breakpoint
CREATE TYPE "public"."appointment_location_type" AS ENUM('IN_PERSON', 'PHONE', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."appointment_reminder_type" AS ENUM('EMAIL', 'SMS', 'IN_APP');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."client_link_type" AS ENUM('SPOUSE', 'PARENT', 'CHILD', 'SIBLING', 'DIRECTOR', 'SHAREHOLDER', 'EMPLOYEE', 'PARTNER', 'ACCOUNTANT', 'ATTORNEY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."communication_direction" AS ENUM('INBOUND', 'OUTBOUND');--> statement-breakpoint
CREATE TYPE "public"."communication_type" AS ENUM('PHONE', 'EMAIL', 'IN_PERSON', 'LETTER', 'WHATSAPP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."service_selection_status" AS ENUM('INTERESTED', 'ACTIVE', 'COMPLETED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."business" AS ENUM('GCMC', 'KAJ');--> statement-breakpoint
CREATE TYPE "public"."client_type" AS ENUM('INDIVIDUAL', 'SMALL_BUSINESS', 'CORPORATION', 'NGO', 'COOP', 'CREDIT_UNION', 'FOREIGN_NATIONAL', 'INVESTOR');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('OWNER', 'GCMC_MANAGER', 'KAJ_MANAGER', 'STAFF_GCMC', 'STAFF_KAJ', 'STAFF_BOTH', 'RECEPTIONIST');--> statement-breakpoint
CREATE TYPE "public"."deadline_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."deadline_type" AS ENUM('FILING', 'RENEWAL', 'PAYMENT', 'SUBMISSION', 'MEETING', 'FOLLOWUP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."recurrence_pattern" AS ENUM('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('IDENTITY', 'TAX', 'FINANCIAL', 'LEGAL', 'IMMIGRATION', 'BUSINESS', 'CORRESPONDENCE', 'TRAINING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('PENDING', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('LETTER', 'AGREEMENT', 'CERTIFICATE', 'FORM', 'REPORT', 'INVOICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('NONE', 'PERCENTAGE', 'FIXED_AMOUNT');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'CHEQUE', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."knowledge_base_category" AS ENUM('GRA', 'NIS', 'IMMIGRATION', 'DCRA', 'GENERAL', 'TRAINING', 'INTERNAL');--> statement-breakpoint
CREATE TYPE "public"."knowledge_base_type" AS ENUM('AGENCY_FORM', 'LETTER_TEMPLATE', 'GUIDE', 'CHECKLIST');--> statement-breakpoint
CREATE TYPE "public"."portal_activity_action" AS ENUM('LOGIN', 'LOGOUT', 'VIEW_DASHBOARD', 'VIEW_MATTER', 'VIEW_DOCUMENT', 'DOWNLOAD_DOCUMENT', 'UPLOAD_DOCUMENT', 'VIEW_INVOICE', 'REQUEST_APPOINTMENT', 'CANCEL_APPOINTMENT', 'UPDATE_PROFILE', 'CHANGE_PASSWORD', 'VIEW_RESOURCES');--> statement-breakpoint
CREATE TYPE "public"."portal_activity_entity_type" AS ENUM('MATTER', 'DOCUMENT', 'APPOINTMENT', 'INVOICE', 'RESOURCE');--> statement-breakpoint
CREATE TYPE "public"."portal_invite_status" AS ENUM('PENDING', 'USED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."portal_user_status" AS ENUM('INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "public"."report_category" AS ENUM('CLIENT', 'MATTER', 'FINANCIAL', 'DEADLINE', 'DOCUMENT', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."report_format" AS ENUM('PDF', 'EXCEL', 'CSV');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('STANDARD', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."schedule_frequency" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."pricing_tier_type" AS ENUM('FIXED', 'RANGE', 'TIERED', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."service_catalog_category" AS ENUM('TRAINING', 'CONSULTING', 'PARALEGAL', 'IMMIGRATION', 'BUSINESS_PROPOSALS', 'NETWORKING', 'TAX', 'ACCOUNTING', 'AUDIT', 'NIS', 'COMPLIANCE', 'FINANCIAL_STATEMENTS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."matter_link_type" AS ENUM('PREREQUISITE', 'RELATED', 'DEPENDENT');--> statement-breakpoint
CREATE TYPE "public"."matter_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."matter_status" AS ENUM('NEW', 'IN_PROGRESS', 'PENDING_CLIENT', 'SUBMITTED', 'COMPLETE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."service_type_category" AS ENUM('TAX', 'ACCOUNTING', 'IMMIGRATION', 'PARALEGAL', 'TRAINING', 'CONSULTING', 'AUDIT', 'NIS', 'REGISTRATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."enrollment_payment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('REGISTERED', 'CONFIRMED', 'ATTENDED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."training_category" AS ENUM('HUMAN_RESOURCES', 'CUSTOMER_RELATIONS', 'BUSINESS_DEVELOPMENT', 'COMPLIANCE', 'OTHER');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"staff_id" text,
	"action" "activity_action" NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" text PRIMARY KEY NOT NULL,
	"appointment_type_id" text NOT NULL,
	"client_id" text NOT NULL,
	"matter_id" text,
	"business" "business" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"location_type" "appointment_location_type" DEFAULT 'IN_PERSON' NOT NULL,
	"location" text,
	"assigned_staff_id" text,
	"status" "appointment_status" DEFAULT 'REQUESTED' NOT NULL,
	"requested_by_portal_user_id" text,
	"requested_by_staff_id" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_by_id" text,
	"confirmed_at" timestamp,
	"completed_at" timestamp,
	"cancelled_by_id" text,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"pre_appointment_notes" text,
	"post_appointment_notes" text,
	"client_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_reminder" (
	"id" text PRIMARY KEY NOT NULL,
	"appointment_id" text NOT NULL,
	"reminder_type" "appointment_reminder_type" DEFAULT 'EMAIL' NOT NULL,
	"reminder_minutes_before" integer NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"is_sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_type" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_duration_minutes" integer DEFAULT 30 NOT NULL,
	"business" "business",
	"color" text DEFAULT '#3B82F6',
	"requires_approval" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"business" "business",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_availability_override" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"start_time" time,
	"end_time" time,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_setup_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_setup_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "client_type" NOT NULL,
	"display_name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"date_of_birth" date,
	"nationality" text,
	"business_name" text,
	"registration_number" text,
	"incorporation_date" date,
	"email" text,
	"phone" text,
	"alternate_phone" text,
	"address" text,
	"city" text,
	"country" text DEFAULT 'Guyana',
	"tin_number" text,
	"national_id" text,
	"passport_number" text,
	"businesses" text[] NOT NULL,
	"status" "client_status" DEFAULT 'ACTIVE' NOT NULL,
	"primary_staff_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text
);
--> statement-breakpoint
CREATE TABLE "client_communication" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"type" "communication_type" NOT NULL,
	"direction" "communication_direction" NOT NULL,
	"subject" text,
	"summary" text NOT NULL,
	"staff_id" text,
	"communicated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"email" text,
	"phone" text,
	"is_primary" text DEFAULT 'false',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_link" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"linked_client_id" text NOT NULL,
	"link_type" "client_link_type" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_service_selection" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"business" "business" NOT NULL,
	"service_code" text NOT NULL,
	"service_name" text NOT NULL,
	"required_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"uploaded_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "service_selection_status" DEFAULT 'INTERESTED' NOT NULL,
	"selected_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp,
	"completed_at" timestamp,
	"inactivated_at" timestamp,
	"notes" text,
	"estimated_completion_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"businesses" text[] NOT NULL,
	"phone" text,
	"job_title" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"can_view_financials" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "deadline" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "deadline_type" NOT NULL,
	"client_id" text,
	"matter_id" text,
	"business" "business",
	"due_date" timestamp NOT NULL,
	"recurrence_pattern" "recurrence_pattern" DEFAULT 'NONE' NOT NULL,
	"recurrence_end_date" date,
	"parent_deadline_id" text,
	"assigned_staff_id" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"completed_by_id" text,
	"priority" "deadline_priority" DEFAULT 'NORMAL' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text
);
--> statement-breakpoint
CREATE TABLE "deadline_reminder" (
	"id" text PRIMARY KEY NOT NULL,
	"deadline_id" text NOT NULL,
	"days_before" integer NOT NULL,
	"reminder_date" timestamp NOT NULL,
	"is_sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"recipient_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"storage_path" text NOT NULL,
	"cloud_backup_path" text,
	"is_backed_up" boolean DEFAULT false NOT NULL,
	"backuped_at" timestamp,
	"category" "document_category" NOT NULL,
	"description" text,
	"tags" text[],
	"client_id" text,
	"matter_id" text,
	"status" "document_status" DEFAULT 'ACTIVE' NOT NULL,
	"expiration_date" date,
	"expiration_notified" boolean DEFAULT false,
	"uploaded_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "document_template" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "template_category" NOT NULL,
	"business" "business",
	"content" text NOT NULL,
	"placeholders" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"business" "business" NOT NULL,
	"client_id" text NOT NULL,
	"matter_id" text,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_due" numeric(10, 2) NOT NULL,
	"discount_type" "discount_type" DEFAULT 'NONE' NOT NULL,
	"discount_value" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_reason" text,
	"notes" text,
	"terms" text,
	"reference_number" text,
	"pdf_url" text,
	"sent_at" timestamp,
	"sent_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text,
	CONSTRAINT "invoice_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_line_item" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"service_type_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"reference_number" text,
	"notes" text,
	"recorded_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_download" (
	"id" text PRIMARY KEY NOT NULL,
	"knowledge_base_item_id" text NOT NULL,
	"downloaded_by_id" text NOT NULL,
	"downloaded_by_type" text NOT NULL,
	"client_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_item" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "knowledge_base_type" NOT NULL,
	"category" "knowledge_base_category" NOT NULL,
	"business" "business",
	"title" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text,
	"file_name" text,
	"storage_path" text,
	"mime_type" text,
	"file_size" integer,
	"content" text,
	"supports_auto_fill" boolean DEFAULT false NOT NULL,
	"template_id" text,
	"related_services" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"required_for" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"agency_url" text,
	"government_fees" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_staff_only" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_by_id" text NOT NULL,
	"last_updated_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"portal_user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"action" "portal_activity_action" NOT NULL,
	"entity_type" "portal_activity_entity_type",
	"entity_id" text,
	"metadata" jsonb,
	"is_impersonated" boolean DEFAULT false NOT NULL,
	"impersonated_by_user_id" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"status" "portal_invite_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by_id" text,
	"revoked_at" timestamp,
	"revoked_by_id" text,
	"revocation_reason" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portal_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "portal_password_reset" (
	"id" text PRIMARY KEY NOT NULL,
	"portal_user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portal_password_reset_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "portal_session" (
	"id" text PRIMARY KEY NOT NULL,
	"portal_user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portal_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "portal_user" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"status" "portal_user_status" DEFAULT 'INVITED' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"last_activity_at" timestamp,
	"login_attempts" text DEFAULT '0' NOT NULL,
	"invited_by_id" text,
	"invited_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portal_user_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "portal_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "staff_impersonation_session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"staff_user_id" text NOT NULL,
	"portal_user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"reason" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "staff_impersonation_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "report_definition" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "report_type" DEFAULT 'STANDARD' NOT NULL,
	"category" "report_category" NOT NULL,
	"report_code" text,
	"query_template" text,
	"parameters" jsonb,
	"columns" jsonb,
	"default_filters" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_definition_report_code_unique" UNIQUE("report_code")
);
--> statement-breakpoint
CREATE TABLE "report_execution" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"parameters" jsonb,
	"filters" jsonb,
	"format" "report_format" DEFAULT 'PDF' NOT NULL,
	"status" "report_status" DEFAULT 'PENDING' NOT NULL,
	"result_path" text,
	"row_count" integer,
	"executed_by_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "scheduled_report" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"name" text NOT NULL,
	"parameters" jsonb,
	"frequency" "schedule_frequency" NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"time" time NOT NULL,
	"format" "report_format" DEFAULT 'PDF' NOT NULL,
	"recipients" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"business" "business" NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"short_description" text,
	"target_audience" text,
	"topics_covered" jsonb,
	"document_requirements" jsonb,
	"workflow" text,
	"deliverables" jsonb,
	"typical_duration" text,
	"estimated_days" integer,
	"pricing_type" "pricing_tier_type" DEFAULT 'FIXED' NOT NULL,
	"base_price" numeric(12, 2),
	"max_price" numeric(12, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"pricing_tiers" jsonb,
	"pricing_notes" text,
	"discounts_available" text,
	"government_fees" text,
	"government_agencies" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text
);
--> statement-breakpoint
CREATE TABLE "service_category" (
	"id" text PRIMARY KEY NOT NULL,
	"business" "business" NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text
);
--> statement-breakpoint
CREATE TABLE "matter" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_number" text NOT NULL,
	"client_id" text NOT NULL,
	"service_type_id" text NOT NULL,
	"business" "business" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "matter_status" DEFAULT 'NEW' NOT NULL,
	"priority" "matter_priority" DEFAULT 'NORMAL' NOT NULL,
	"start_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"completed_date" date,
	"assigned_staff_id" text,
	"estimated_fee" numeric(10, 2),
	"actual_fee" numeric(10, 2),
	"is_paid" boolean DEFAULT false NOT NULL,
	"tax_year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text,
	CONSTRAINT "matter_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "matter_checklist" (
	"id" text PRIMARY KEY NOT NULL,
	"matter_id" text NOT NULL,
	"item" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"completed_by_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matter_link" (
	"id" text PRIMARY KEY NOT NULL,
	"matter_id" text NOT NULL,
	"linked_matter_id" text NOT NULL,
	"link_type" "matter_link_type" DEFAULT 'RELATED' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matter_note" (
	"id" text PRIMARY KEY NOT NULL,
	"matter_id" text NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT true NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_type" (
	"id" text PRIMARY KEY NOT NULL,
	"business" "business" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "service_type_category" NOT NULL,
	"default_checklist_items" jsonb,
	"estimated_days" integer,
	"default_fee" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"calculation_type" text NOT NULL,
	"input_data" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"location" varchar(255) NOT NULL,
	"instructor" varchar(255) NOT NULL,
	"status" "schedule_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"business" varchar(10) DEFAULT 'GCMC' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" "training_category" NOT NULL,
	"duration" integer NOT NULL,
	"max_participants" integer DEFAULT 20 NOT NULL,
	"price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"client_id" text NOT NULL,
	"status" "enrollment_status" DEFAULT 'REGISTERED' NOT NULL,
	"payment_status" "enrollment_payment_status" DEFAULT 'PENDING' NOT NULL,
	"certificate_number" varchar(50),
	"certificate_issued_at" timestamp with time zone,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_appointment_type_id_appointment_type_id_fk" FOREIGN KEY ("appointment_type_id") REFERENCES "public"."appointment_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_matter_id_matter_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_requested_by_staff_id_staff_id_fk" FOREIGN KEY ("requested_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_confirmed_by_id_user_id_fk" FOREIGN KEY ("confirmed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_cancelled_by_id_user_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_reminder" ADD CONSTRAINT "appointment_reminder_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_availability" ADD CONSTRAINT "staff_availability_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_availability_override" ADD CONSTRAINT "staff_availability_override_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_setup_token" ADD CONSTRAINT "password_setup_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_primary_staff_id_staff_id_fk" FOREIGN KEY ("primary_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_communication" ADD CONSTRAINT "client_communication_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_communication" ADD CONSTRAINT "client_communication_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contact" ADD CONSTRAINT "client_contact_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_link" ADD CONSTRAINT "client_link_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_link" ADD CONSTRAINT "client_link_linked_client_id_client_id_fk" FOREIGN KEY ("linked_client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_service_selection" ADD CONSTRAINT "client_service_selection_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_matter_id_matter_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_completed_by_id_user_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline_reminder" ADD CONSTRAINT "deadline_reminder_deadline_id_deadline_id_fk" FOREIGN KEY ("deadline_id") REFERENCES "public"."deadline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_matter_id_matter_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_template" ADD CONSTRAINT "document_template_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_matter_id_matter_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_sent_by_id_user_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_recorded_by_id_user_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_download" ADD CONSTRAINT "knowledge_base_download_knowledge_base_item_id_knowledge_base_item_id_fk" FOREIGN KEY ("knowledge_base_item_id") REFERENCES "public"."knowledge_base_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_item" ADD CONSTRAINT "knowledge_base_item_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_item" ADD CONSTRAINT "knowledge_base_item_last_updated_by_id_user_id_fk" FOREIGN KEY ("last_updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_activity_log" ADD CONSTRAINT "portal_activity_log_portal_user_id_portal_user_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."portal_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_activity_log" ADD CONSTRAINT "portal_activity_log_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_activity_log" ADD CONSTRAINT "portal_activity_log_impersonated_by_user_id_user_id_fk" FOREIGN KEY ("impersonated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_activity_log" ADD CONSTRAINT "portal_activity_log_session_id_portal_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."portal_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_invite" ADD CONSTRAINT "portal_invite_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_invite" ADD CONSTRAINT "portal_invite_used_by_id_portal_user_id_fk" FOREIGN KEY ("used_by_id") REFERENCES "public"."portal_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_invite" ADD CONSTRAINT "portal_invite_revoked_by_id_user_id_fk" FOREIGN KEY ("revoked_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_invite" ADD CONSTRAINT "portal_invite_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_password_reset" ADD CONSTRAINT "portal_password_reset_portal_user_id_portal_user_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."portal_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_session" ADD CONSTRAINT "portal_session_portal_user_id_portal_user_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."portal_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_user" ADD CONSTRAINT "portal_user_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_user" ADD CONSTRAINT "portal_user_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_impersonation_session" ADD CONSTRAINT "staff_impersonation_session_staff_user_id_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_impersonation_session" ADD CONSTRAINT "staff_impersonation_session_portal_user_id_portal_user_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."portal_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_impersonation_session" ADD CONSTRAINT "staff_impersonation_session_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_definition" ADD CONSTRAINT "report_definition_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution" ADD CONSTRAINT "report_execution_report_id_report_definition_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."report_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution" ADD CONSTRAINT "report_execution_executed_by_id_user_id_fk" FOREIGN KEY ("executed_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_report" ADD CONSTRAINT "scheduled_report_report_id_report_definition_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."report_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_report" ADD CONSTRAINT "scheduled_report_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_category_id_service_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_category" ADD CONSTRAINT "service_category_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter" ADD CONSTRAINT "matter_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter" ADD CONSTRAINT "matter_service_type_id_service_type_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter" ADD CONSTRAINT "matter_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter" ADD CONSTRAINT "matter_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter_checklist" ADD CONSTRAINT "matter_checklist_matter_id_matter_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter_checklist" ADD CONSTRAINT "matter_checklist_completed_by_id_user_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter_link" ADD CONSTRAINT "matter_link_matter_id_matter_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter_link" ADD CONSTRAINT "matter_link_linked_matter_id_matter_id_fk" FOREIGN KEY ("linked_matter_id") REFERENCES "public"."matter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter_note" ADD CONSTRAINT "matter_note_matter_id_matter_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matter_note" ADD CONSTRAINT "matter_note_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculations" ADD CONSTRAINT "tax_calculations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_schedules" ADD CONSTRAINT "course_schedules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_schedule_id_course_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."course_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_user_id_idx" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_log_staff_id_idx" ON "activity_log" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "activity_log_action_idx" ON "activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "activity_log_entity_type_idx" ON "activity_log" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "activity_log_entity_id_idx" ON "activity_log" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "appointment_appointment_type_id_idx" ON "appointment" USING btree ("appointment_type_id");--> statement-breakpoint
CREATE INDEX "appointment_client_id_idx" ON "appointment" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "appointment_matter_id_idx" ON "appointment" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "appointment_business_idx" ON "appointment" USING btree ("business");--> statement-breakpoint
CREATE INDEX "appointment_scheduled_at_idx" ON "appointment" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "appointment_assigned_staff_id_idx" ON "appointment" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "appointment_status_idx" ON "appointment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointment_reminder_appointment_id_idx" ON "appointment_reminder" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "appointment_reminder_scheduled_at_idx" ON "appointment_reminder" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "appointment_reminder_is_sent_idx" ON "appointment_reminder" USING btree ("is_sent");--> statement-breakpoint
CREATE INDEX "appointment_type_business_idx" ON "appointment_type" USING btree ("business");--> statement-breakpoint
CREATE INDEX "appointment_type_is_active_idx" ON "appointment_type" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "staff_availability_staff_id_idx" ON "staff_availability" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_availability_day_of_week_idx" ON "staff_availability" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "staff_availability_override_staff_id_idx" ON "staff_availability_override" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_availability_override_date_idx" ON "staff_availability_override" USING btree ("date");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_setup_token_userId_idx" ON "password_setup_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "client_type_idx" ON "client" USING btree ("type");--> statement-breakpoint
CREATE INDEX "client_status_idx" ON "client" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_display_name_idx" ON "client" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "client_email_idx" ON "client" USING btree ("email");--> statement-breakpoint
CREATE INDEX "client_tin_idx" ON "client" USING btree ("tin_number");--> statement-breakpoint
CREATE INDEX "client_primary_staff_idx" ON "client" USING btree ("primary_staff_id");--> statement-breakpoint
CREATE INDEX "client_communication_client_id_idx" ON "client_communication" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_communication_staff_id_idx" ON "client_communication" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "client_communication_date_idx" ON "client_communication" USING btree ("communicated_at");--> statement-breakpoint
CREATE INDEX "client_contact_client_id_idx" ON "client_contact" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_link_client_id_idx" ON "client_link" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_link_linked_client_id_idx" ON "client_link" USING btree ("linked_client_id");--> statement-breakpoint
CREATE INDEX "client_service_selection_client_id_idx" ON "client_service_selection" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_service_selection_status_idx" ON "client_service_selection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_service_selection_business_idx" ON "client_service_selection" USING btree ("business");--> statement-breakpoint
CREATE INDEX "client_service_selection_service_code_idx" ON "client_service_selection" USING btree ("service_code");--> statement-breakpoint
CREATE INDEX "staff_user_id_idx" ON "staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deadline_client_id_idx" ON "deadline" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "deadline_matter_id_idx" ON "deadline" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "deadline_business_idx" ON "deadline" USING btree ("business");--> statement-breakpoint
CREATE INDEX "deadline_due_date_idx" ON "deadline" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "deadline_is_completed_idx" ON "deadline" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "deadline_assigned_staff_idx" ON "deadline" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "deadline_type_idx" ON "deadline" USING btree ("type");--> statement-breakpoint
CREATE INDEX "deadline_parent_id_idx" ON "deadline" USING btree ("parent_deadline_id");--> statement-breakpoint
CREATE INDEX "deadline_reminder_deadline_id_idx" ON "deadline_reminder" USING btree ("deadline_id");--> statement-breakpoint
CREATE INDEX "deadline_reminder_reminder_date_idx" ON "deadline_reminder" USING btree ("reminder_date");--> statement-breakpoint
CREATE INDEX "deadline_reminder_is_sent_idx" ON "deadline_reminder" USING btree ("is_sent");--> statement-breakpoint
CREATE INDEX "document_client_id_idx" ON "document" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "document_matter_id_idx" ON "document" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "document_category_idx" ON "document" USING btree ("category");--> statement-breakpoint
CREATE INDEX "document_status_idx" ON "document" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_expiration_date_idx" ON "document" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "document_uploaded_by_idx" ON "document" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX "document_is_backed_up_idx" ON "document" USING btree ("is_backed_up");--> statement-breakpoint
CREATE INDEX "document_template_category_idx" ON "document_template" USING btree ("category");--> statement-breakpoint
CREATE INDEX "document_template_business_idx" ON "document_template" USING btree ("business");--> statement-breakpoint
CREATE INDEX "document_template_is_active_idx" ON "document_template" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "invoice_invoice_number_idx" ON "invoice" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoice_business_idx" ON "invoice" USING btree ("business");--> statement-breakpoint
CREATE INDEX "invoice_client_id_idx" ON "invoice" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invoice_matter_id_idx" ON "invoice" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_invoice_date_idx" ON "invoice" USING btree ("invoice_date");--> statement-breakpoint
CREATE INDEX "invoice_due_date_idx" ON "invoice" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "invoice_created_by_idx" ON "invoice" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "invoice_line_item_invoice_id_idx" ON "invoice_line_item" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_line_item_sort_order_idx" ON "invoice_line_item" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "invoice_payment_invoice_id_idx" ON "invoice_payment" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_payment_payment_date_idx" ON "invoice_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "invoice_payment_recorded_by_idx" ON "invoice_payment" USING btree ("recorded_by_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_download_item_id_idx" ON "knowledge_base_download" USING btree ("knowledge_base_item_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_download_downloaded_by_idx" ON "knowledge_base_download" USING btree ("downloaded_by_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_download_client_id_idx" ON "knowledge_base_download" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_item_type_idx" ON "knowledge_base_item" USING btree ("type");--> statement-breakpoint
CREATE INDEX "knowledge_base_item_category_idx" ON "knowledge_base_item" USING btree ("category");--> statement-breakpoint
CREATE INDEX "knowledge_base_item_business_idx" ON "knowledge_base_item" USING btree ("business");--> statement-breakpoint
CREATE INDEX "knowledge_base_item_is_active_idx" ON "knowledge_base_item" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "knowledge_base_item_is_staff_only_idx" ON "knowledge_base_item" USING btree ("is_staff_only");--> statement-breakpoint
CREATE INDEX "knowledge_base_item_is_featured_idx" ON "knowledge_base_item" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "portal_activity_log_portal_user_id_idx" ON "portal_activity_log" USING btree ("portal_user_id");--> statement-breakpoint
CREATE INDEX "portal_activity_log_client_id_idx" ON "portal_activity_log" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_activity_log_action_idx" ON "portal_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "portal_activity_log_created_at_idx" ON "portal_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "portal_activity_log_is_impersonated_idx" ON "portal_activity_log" USING btree ("is_impersonated");--> statement-breakpoint
CREATE INDEX "portal_activity_log_impersonated_by_idx" ON "portal_activity_log" USING btree ("impersonated_by_user_id");--> statement-breakpoint
CREATE INDEX "portal_invite_client_id_idx" ON "portal_invite" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_invite_token_idx" ON "portal_invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "portal_invite_email_idx" ON "portal_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "portal_invite_status_idx" ON "portal_invite" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portal_invite_expires_at_idx" ON "portal_invite" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "portal_password_reset_portal_user_id_idx" ON "portal_password_reset" USING btree ("portal_user_id");--> statement-breakpoint
CREATE INDEX "portal_password_reset_token_idx" ON "portal_password_reset" USING btree ("token");--> statement-breakpoint
CREATE INDEX "portal_password_reset_expires_at_idx" ON "portal_password_reset" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "portal_session_portal_user_id_idx" ON "portal_session" USING btree ("portal_user_id");--> statement-breakpoint
CREATE INDEX "portal_session_token_idx" ON "portal_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "portal_session_expires_at_idx" ON "portal_session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "portal_user_client_id_idx" ON "portal_user" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_user_email_idx" ON "portal_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "portal_user_status_idx" ON "portal_user" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portal_user_invited_by_idx" ON "portal_user" USING btree ("invited_by_id");--> statement-breakpoint
CREATE INDEX "staff_impersonation_session_token_idx" ON "staff_impersonation_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "staff_impersonation_session_staff_user_id_idx" ON "staff_impersonation_session" USING btree ("staff_user_id");--> statement-breakpoint
CREATE INDEX "staff_impersonation_session_portal_user_id_idx" ON "staff_impersonation_session" USING btree ("portal_user_id");--> statement-breakpoint
CREATE INDEX "staff_impersonation_session_client_id_idx" ON "staff_impersonation_session" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "staff_impersonation_session_is_active_idx" ON "staff_impersonation_session" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "staff_impersonation_session_expires_at_idx" ON "staff_impersonation_session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "report_definition_type_idx" ON "report_definition" USING btree ("type");--> statement-breakpoint
CREATE INDEX "report_definition_category_idx" ON "report_definition" USING btree ("category");--> statement-breakpoint
CREATE INDEX "report_definition_report_code_idx" ON "report_definition" USING btree ("report_code");--> statement-breakpoint
CREATE INDEX "report_execution_report_id_idx" ON "report_execution" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_execution_status_idx" ON "report_execution" USING btree ("status");--> statement-breakpoint
CREATE INDEX "report_execution_user_idx" ON "report_execution" USING btree ("executed_by_id");--> statement-breakpoint
CREATE INDEX "report_execution_started_at_idx" ON "report_execution" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "scheduled_report_report_id_idx" ON "scheduled_report" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "scheduled_report_next_run_idx" ON "scheduled_report" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "scheduled_report_active_idx" ON "scheduled_report" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "service_catalog_category_idx" ON "service_catalog" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "service_catalog_business_idx" ON "service_catalog" USING btree ("business");--> statement-breakpoint
CREATE INDEX "service_catalog_is_active_idx" ON "service_catalog" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "service_catalog_is_featured_idx" ON "service_catalog" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "service_catalog_sort_order_idx" ON "service_catalog" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "service_category_business_idx" ON "service_category" USING btree ("business");--> statement-breakpoint
CREATE INDEX "service_category_is_active_idx" ON "service_category" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "service_category_sort_order_idx" ON "service_category" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "matter_client_id_idx" ON "matter" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "matter_service_type_id_idx" ON "matter" USING btree ("service_type_id");--> statement-breakpoint
CREATE INDEX "matter_business_idx" ON "matter" USING btree ("business");--> statement-breakpoint
CREATE INDEX "matter_status_idx" ON "matter" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matter_assigned_staff_idx" ON "matter" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "matter_due_date_idx" ON "matter" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "matter_reference_number_idx" ON "matter" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "matter_checklist_matter_id_idx" ON "matter_checklist" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "matter_checklist_is_completed_idx" ON "matter_checklist" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "matter_link_matter_id_idx" ON "matter_link" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "matter_link_linked_matter_id_idx" ON "matter_link" USING btree ("linked_matter_id");--> statement-breakpoint
CREATE INDEX "matter_note_matter_id_idx" ON "matter_note" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "service_type_business_idx" ON "service_type" USING btree ("business");--> statement-breakpoint
CREATE INDEX "service_type_category_idx" ON "service_type" USING btree ("category");--> statement-breakpoint
CREATE INDEX "service_type_is_active_idx" ON "service_type" USING btree ("is_active");