ALTER TABLE "appointment" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_user" ALTER COLUMN "login_attempts" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "is_public_booking" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "public_booker_name" text;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "public_booker_email" text;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "public_booker_phone" text;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "public_booking_token" text;--> statement-breakpoint
ALTER TABLE "appointment_type" ADD COLUMN "is_public_booking" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment_type" ADD COLUMN "public_booking_token" text;--> statement-breakpoint
ALTER TABLE "appointment_type" ADD COLUMN "public_booking_description" text;--> statement-breakpoint
ALTER TABLE "appointment_type" ADD COLUMN "booking_instructions" text;--> statement-breakpoint
ALTER TABLE "appointment_type" ADD COLUMN "max_bookings_per_day" integer;--> statement-breakpoint
ALTER TABLE "appointment_type" ADD COLUMN "min_advance_notice_hours" integer DEFAULT 24;--> statement-breakpoint
ALTER TABLE "appointment_type" ADD COLUMN "max_advance_booking_days" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "backup_schedule" ADD COLUMN "scope" text DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_base_item" ADD COLUMN "direct_pdf_url" text;--> statement-breakpoint
ALTER TABLE "knowledge_base_item" ADD COLUMN "last_download_attempt" timestamp;--> statement-breakpoint
ALTER TABLE "knowledge_base_item" ADD COLUMN "last_download_error" text;--> statement-breakpoint
ALTER TABLE "system_backup" ADD COLUMN "scope" text DEFAULT 'database' NOT NULL;--> statement-breakpoint
ALTER TABLE "system_backup" ADD COLUMN "includes_files" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "system_backup" ADD COLUMN "file_manifest_path" text;--> statement-breakpoint
ALTER TABLE "system_backup" ADD COLUMN "restored_at" timestamp;--> statement-breakpoint
ALTER TABLE "system_backup" ADD COLUMN "restored_by_id" text;--> statement-breakpoint
ALTER TABLE "system_backup" ADD CONSTRAINT "system_backup_restored_by_id_user_id_fk" FOREIGN KEY ("restored_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointment_public_booking_token_idx" ON "appointment" USING btree ("public_booking_token");--> statement-breakpoint
CREATE INDEX "appointment_is_public_booking_idx" ON "appointment" USING btree ("is_public_booking");--> statement-breakpoint
CREATE INDEX "appointment_type_public_booking_token_idx" ON "appointment_type" USING btree ("public_booking_token");--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_public_booking_token_unique" UNIQUE("public_booking_token");--> statement-breakpoint
ALTER TABLE "appointment_type" ADD CONSTRAINT "appointment_type_public_booking_token_unique" UNIQUE("public_booking_token");