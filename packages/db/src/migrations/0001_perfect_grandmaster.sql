CREATE TYPE "public"."client_aml_risk_rating" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."preferred_contact_method" AS ENUM('EMAIL', 'PHONE', 'WHATSAPP', 'IN_PERSON');--> statement-breakpoint
CREATE TYPE "public"."aml_risk_rating" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'PROHIBITED');--> statement-breakpoint
CREATE TYPE "public"."aml_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."ownership_type" AS ENUM('DIRECT', 'INDIRECT', 'BENEFICIAL');--> statement-breakpoint
CREATE TYPE "public"."pep_category" AS ENUM('DOMESTIC', 'FOREIGN', 'INTERNATIONAL_ORG');--> statement-breakpoint
CREATE TYPE "public"."pep_relationship" AS ENUM('SELF', 'FAMILY_MEMBER', 'CLOSE_ASSOCIATE');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."source_of_funds" AS ENUM('EMPLOYMENT', 'BUSINESS', 'INHERITANCE', 'INVESTMENTS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."emergency_contact_type" AS ENUM('EMERGENCY', 'NEXT_OF_KIN');--> statement-breakpoint
CREATE TYPE "public"."employment_status" AS ENUM('EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'STUDENT');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REQUIRES_RENEWAL');--> statement-breakpoint
ALTER TYPE "public"."client_link_type" ADD VALUE 'BENEFICIAL_OWNER' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."client_link_type" ADD VALUE 'TRUSTEE' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."client_link_type" ADD VALUE 'AUTHORIZED_SIGNATORY' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."client_link_type" ADD VALUE 'FAMILY_MEMBER' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."client_link_type" ADD VALUE 'BUSINESS_ASSOCIATE' BEFORE 'OTHER';--> statement-breakpoint
CREATE TABLE "client_aml_assessment" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"assessment_date" date DEFAULT now() NOT NULL,
	"assessed_by_id" text NOT NULL,
	"client_type_risk" integer DEFAULT 0 NOT NULL,
	"service_risk" integer DEFAULT 0 NOT NULL,
	"geographic_risk" integer DEFAULT 0 NOT NULL,
	"transaction_risk" integer DEFAULT 0 NOT NULL,
	"total_risk_score" integer DEFAULT 0 NOT NULL,
	"risk_rating" "aml_risk_rating" NOT NULL,
	"is_pep" boolean DEFAULT false NOT NULL,
	"pep_category" "pep_category",
	"pep_position" text,
	"pep_jurisdiction" text,
	"requires_edd" boolean DEFAULT false NOT NULL,
	"edd_reasons" text[],
	"edd_completed_at" timestamp,
	"sanctions_screened" boolean DEFAULT false NOT NULL,
	"sanctions_screened_at" timestamp,
	"sanctions_match" boolean DEFAULT false,
	"sanctions_details" text,
	"source_of_funds" "source_of_funds",
	"source_of_funds_details" text,
	"source_of_wealth" text,
	"status" "aml_status" DEFAULT 'PENDING' NOT NULL,
	"approved_by_id" text,
	"approved_at" timestamp,
	"rejection_reason" text,
	"next_review_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_beneficial_owner" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"nationality" text NOT NULL,
	"national_id" text,
	"passport_number" text,
	"ownership_percentage" integer NOT NULL,
	"ownership_type" "ownership_type" NOT NULL,
	"position_held" text,
	"address" text,
	"email" text,
	"phone" text,
	"is_pep" boolean DEFAULT false NOT NULL,
	"pep_details" text,
	"pep_relationship" "pep_relationship",
	"risk_level" "risk_level" DEFAULT 'LOW',
	"risk_notes" text,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by_id" text,
	"verification_document_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_emergency_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"contact_type" "emergency_contact_type" NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"phone" text NOT NULL,
	"alternate_phone" text,
	"email" text,
	"address" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_employment_info" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"employment_status" "employment_status" NOT NULL,
	"employer_name" text,
	"job_title" text,
	"industry" text,
	"employment_start_date" date,
	"annual_income" text,
	"income_source" text[],
	"employer_address" text,
	"employer_phone" text,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verification_document_id" text,
	"is_current" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"verified_by_id" text,
	"verified_at" timestamp,
	"rejection_reason" text,
	"issue_date" date,
	"expiry_date" date,
	"expiry_notification_sent" boolean DEFAULT false,
	"expiry_notification_sent_at" timestamp,
	"issuing_authority" text,
	"document_number" text,
	"renewal_required" boolean DEFAULT false,
	"renewal_reminder_days" integer DEFAULT 30,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "preferred_contact_method" "preferred_contact_method" DEFAULT 'EMAIL';--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "preferred_language" text DEFAULT 'English';--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "aml_risk_rating" "client_aml_risk_rating" DEFAULT 'LOW';--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "is_pep" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "requires_enhanced_due_diligence" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "gra_compliant" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "nis_compliant" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "last_compliance_check_date" date;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "client_aml_assessment" ADD CONSTRAINT "client_aml_assessment_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_aml_assessment" ADD CONSTRAINT "client_aml_assessment_assessed_by_id_staff_id_fk" FOREIGN KEY ("assessed_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_aml_assessment" ADD CONSTRAINT "client_aml_assessment_approved_by_id_staff_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_beneficial_owner" ADD CONSTRAINT "client_beneficial_owner_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_beneficial_owner" ADD CONSTRAINT "client_beneficial_owner_verified_by_id_staff_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_beneficial_owner" ADD CONSTRAINT "client_beneficial_owner_verification_document_id_document_id_fk" FOREIGN KEY ("verification_document_id") REFERENCES "public"."document"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_emergency_contact" ADD CONSTRAINT "client_emergency_contact_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_employment_info" ADD CONSTRAINT "client_employment_info_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_employment_info" ADD CONSTRAINT "client_employment_info_verification_document_id_document_id_fk" FOREIGN KEY ("verification_document_id") REFERENCES "public"."document"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verification" ADD CONSTRAINT "document_verification_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verification" ADD CONSTRAINT "document_verification_verified_by_id_staff_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_aml_assessment_client_id_idx" ON "client_aml_assessment" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_aml_assessment_risk_rating_idx" ON "client_aml_assessment" USING btree ("risk_rating");--> statement-breakpoint
CREATE INDEX "client_aml_assessment_status_idx" ON "client_aml_assessment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_aml_assessment_next_review_idx" ON "client_aml_assessment" USING btree ("next_review_date");--> statement-breakpoint
CREATE INDEX "client_beneficial_owner_client_id_idx" ON "client_beneficial_owner" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_beneficial_owner_is_pep_idx" ON "client_beneficial_owner" USING btree ("is_pep");--> statement-breakpoint
CREATE INDEX "client_beneficial_owner_risk_level_idx" ON "client_beneficial_owner" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "client_emergency_contact_client_id_idx" ON "client_emergency_contact" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_emergency_contact_type_idx" ON "client_emergency_contact" USING btree ("contact_type");--> statement-breakpoint
CREATE INDEX "client_employment_info_client_id_idx" ON "client_employment_info" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_employment_info_is_current_idx" ON "client_employment_info" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "client_employment_info_status_idx" ON "client_employment_info" USING btree ("employment_status");--> statement-breakpoint
CREATE INDEX "document_verification_document_id_idx" ON "document_verification" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_verification_status_idx" ON "document_verification" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "document_verification_expiry_date_idx" ON "document_verification" USING btree ("expiry_date");