import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { staffRoleEnum } from "./core";

/**
 * Invite status enum
 * - PENDING: Invite sent, awaiting acceptance
 * - ACCEPTED: User has registered using this invite
 * - EXPIRED: Invite has expired (past expiresAt)
 * - REVOKED: Invite was manually revoked by admin
 */
export const inviteStatusEnum = pgEnum("invite_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

/**
 * Staff invites table
 *
 * This table tracks all invitations to create accounts in the system.
 * In production, signup is disabled by default - users can only register
 * via a valid invite link.
 *
 * Security considerations:
 * - Tokens are cryptographically random UUIDs
 * - Invites expire after a configurable period (default 7 days)
 * - Each invite can only be used once
 * - Invites are tied to a specific email address
 */
export const staffInvite = pgTable(
  "staff_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // The email address the invite is for
    email: text("email").notNull(),
    // Cryptographically random token for the invite URL
    token: text("token").notNull().unique(),
    // Pre-assigned role for when they complete registration
    role: staffRoleEnum("role").notNull(),
    // Business assignments (["GCMC"], ["KAJ"], or ["GCMC", "KAJ"])
    businesses: text("businesses").array().notNull(),
    // Current status of the invite
    status: inviteStatusEnum("status").default("PENDING").notNull(),
    // Who created this invite
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // Who accepted this invite (populated after acceptance)
    acceptedById: text("accepted_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // When the invite expires
    expiresAt: timestamp("expires_at").notNull(),
    // When the invite was accepted
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("staff_invite_email_idx").on(table.email),
    index("staff_invite_token_idx").on(table.token),
    index("staff_invite_status_idx").on(table.status),
  ]
);

/**
 * Bootstrap token for initial OWNER setup
 *
 * This is a special single-use token that can be used to create
 * the first OWNER account when no staff exist in the database.
 *
 * Security considerations:
 * - Only ONE bootstrap token can exist at a time
 * - Token is only valid when NO staff exist in the database
 * - Token can only be used once
 * - Token expires after a configurable period
 */
export const bootstrapToken = pgTable("bootstrap_token", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // The bootstrap token value (cryptographically random)
  token: text("token").notNull().unique(),
  // Whether this token has been used
  usedAt: timestamp("used_at"),
  // Who used this token (populated after use)
  usedById: text("used_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  // When the token expires
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const staffInviteRelations = relations(staffInvite, ({ one }) => ({
  createdBy: one(user, {
    fields: [staffInvite.createdById],
    references: [user.id],
    relationName: "inviteCreator",
  }),
  acceptedBy: one(user, {
    fields: [staffInvite.acceptedById],
    references: [user.id],
    relationName: "inviteAcceptor",
  }),
}));

export const bootstrapTokenRelations = relations(bootstrapToken, ({ one }) => ({
  usedBy: one(user, {
    fields: [bootstrapToken.usedById],
    references: [user.id],
  }),
}));
