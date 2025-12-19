CREATE TYPE "public"."invite_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TABLE "bootstrap_token" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"used_at" timestamp,
	"used_by_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bootstrap_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"businesses" text[] NOT NULL,
	"status" "invite_status" DEFAULT 'PENDING' NOT NULL,
	"created_by_id" text,
	"accepted_by_id" text,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "bootstrap_token" ADD CONSTRAINT "bootstrap_token_used_by_id_user_id_fk" FOREIGN KEY ("used_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invite" ADD CONSTRAINT "staff_invite_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invite" ADD CONSTRAINT "staff_invite_accepted_by_id_user_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_invite_email_idx" ON "staff_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "staff_invite_token_idx" ON "staff_invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "staff_invite_status_idx" ON "staff_invite" USING btree ("status");