CREATE TYPE "public"."recurring_interval" AS ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."recurring_invoice_status" AS ENUM('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'STRIPE' BEFORE 'OTHER';--> statement-breakpoint
CREATE TABLE "email_template" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"business" text,
	"available_variables" text,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_template_version" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"version" text NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"changed_by_id" text,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"change_notes" text
);
--> statement-breakpoint
CREATE TABLE "recurring_invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"business" "business" NOT NULL,
	"client_id" text NOT NULL,
	"matter_id" text,
	"interval" "recurring_interval" NOT NULL,
	"day_of_month" integer,
	"day_of_week" integer,
	"next_invoice_date" date NOT NULL,
	"end_date" date,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"terms" text,
	"status" "recurring_invoice_status" DEFAULT 'ACTIVE' NOT NULL,
	"invoices_generated" integer DEFAULT 0 NOT NULL,
	"last_invoice_id" text,
	"last_generated_at" timestamp,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_invoice_line_item" (
	"id" text PRIMARY KEY NOT NULL,
	"recurring_invoice_id" text NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"service_type_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "stripe_payment_link_id" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "stripe_payment_link_url" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "payment_token" text;--> statement-breakpoint
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template_version" ADD CONSTRAINT "email_template_version_template_id_email_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template_version" ADD CONSTRAINT "email_template_version_changed_by_id_user_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoice" ADD CONSTRAINT "recurring_invoice_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoice" ADD CONSTRAINT "recurring_invoice_matter_id_matter_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoice" ADD CONSTRAINT "recurring_invoice_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoice_line_item" ADD CONSTRAINT "recurring_invoice_line_item_recurring_invoice_id_recurring_invoice_id_fk" FOREIGN KEY ("recurring_invoice_id") REFERENCES "public"."recurring_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_invoice_business_idx" ON "recurring_invoice" USING btree ("business");--> statement-breakpoint
CREATE INDEX "recurring_invoice_client_id_idx" ON "recurring_invoice" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "recurring_invoice_status_idx" ON "recurring_invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recurring_invoice_next_date_idx" ON "recurring_invoice" USING btree ("next_invoice_date");--> statement-breakpoint
CREATE INDEX "recurring_line_item_recurring_id_idx" ON "recurring_invoice_line_item" USING btree ("recurring_invoice_id");