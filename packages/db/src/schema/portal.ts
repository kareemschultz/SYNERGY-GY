import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { client } from "./clients";

// Portal user status
export const portalUserStatusEnum = pgEnum("portal_user_status", [
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
]);

// Portal invite status
export const portalInviteStatusEnum = pgEnum("portal_invite_status", [
  "PENDING",
  "USED",
  "EXPIRED",
  "REVOKED",
]);

// Portal user table - separate auth context from staff users
export const portalUser = pgTable(
  "portal_user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Link to client record (one-to-one)
    clientId: text("client_id")
      .notNull()
      .unique()
      .references(() => client.id, { onDelete: "cascade" }),

    // Authentication
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),

    // Account status
    status: portalUserStatusEnum("status").default("INVITED").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),

    // Activity tracking
    lastLoginAt: timestamp("last_login_at"),
    lastActivityAt: timestamp("last_activity_at"),
    loginAttempts: text("login_attempts").default("0").notNull(), // Track failed attempts

    // Invitation tracking
    invitedById: text("invited_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    invitedAt: timestamp("invited_at").notNull(),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("portal_user_client_id_idx").on(table.clientId),
    index("portal_user_email_idx").on(table.email),
    index("portal_user_status_idx").on(table.status),
    index("portal_user_invited_by_idx").on(table.invitedById),
  ]
);

// Portal invites - track invitation tokens
export const portalInvite = pgTable(
  "portal_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Client being invited
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    // Invitation details
    email: text("email").notNull(),
    token: text("token").notNull().unique(), // Secure random token
    status: portalInviteStatusEnum("status").default("PENDING").notNull(),

    // Expiration
    expiresAt: timestamp("expires_at").notNull(), // 7 days from creation

    // Usage tracking
    usedAt: timestamp("used_at"),
    usedById: text("used_by_id").references(() => portalUser.id, {
      onDelete: "set null",
    }),

    // Revocation
    revokedAt: timestamp("revoked_at"),
    revokedById: text("revoked_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    revocationReason: text("revocation_reason"),

    // Creator
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("portal_invite_client_id_idx").on(table.clientId),
    index("portal_invite_token_idx").on(table.token),
    index("portal_invite_email_idx").on(table.email),
    index("portal_invite_status_idx").on(table.status),
    index("portal_invite_expires_at_idx").on(table.expiresAt),
  ]
);

// Portal sessions - separate from staff sessions
export const portalSession = pgTable(
  "portal_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // User reference
    portalUserId: text("portal_user_id")
      .notNull()
      .references(() => portalUser.id, { onDelete: "cascade" }),

    // Session token
    token: text("token").notNull().unique(),

    // Expiration (30 minutes inactivity)
    expiresAt: timestamp("expires_at").notNull(),

    // Security tracking
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  },
  (table) => [
    index("portal_session_portal_user_id_idx").on(table.portalUserId),
    index("portal_session_token_idx").on(table.token),
    index("portal_session_expires_at_idx").on(table.expiresAt),
  ]
);

// Password reset tokens for portal users
export const portalPasswordReset = pgTable(
  "portal_password_reset",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    portalUserId: text("portal_user_id")
      .notNull()
      .references(() => portalUser.id, { onDelete: "cascade" }),

    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(), // 1 hour

    usedAt: timestamp("used_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("portal_password_reset_portal_user_id_idx").on(table.portalUserId),
    index("portal_password_reset_token_idx").on(table.token),
    index("portal_password_reset_expires_at_idx").on(table.expiresAt),
  ]
);

// Relations
export const portalUserRelations = relations(portalUser, ({ one, many }) => ({
  client: one(client, {
    fields: [portalUser.clientId],
    references: [client.id],
  }),
  invitedBy: one(user, {
    fields: [portalUser.invitedById],
    references: [user.id],
  }),
  sessions: many(portalSession),
  passwordResets: many(portalPasswordReset),
}));

export const portalInviteRelations = relations(portalInvite, ({ one }) => ({
  client: one(client, {
    fields: [portalInvite.clientId],
    references: [client.id],
  }),
  createdBy: one(user, {
    fields: [portalInvite.createdById],
    references: [user.id],
    relationName: "inviteCreator",
  }),
  usedBy: one(portalUser, {
    fields: [portalInvite.usedById],
    references: [portalUser.id],
  }),
  revokedBy: one(user, {
    fields: [portalInvite.revokedById],
    references: [user.id],
    relationName: "inviteRevoker",
  }),
}));

export const portalSessionRelations = relations(portalSession, ({ one }) => ({
  portalUser: one(portalUser, {
    fields: [portalSession.portalUserId],
    references: [portalUser.id],
  }),
}));

export const portalPasswordResetRelations = relations(
  portalPasswordReset,
  ({ one }) => ({
    portalUser: one(portalUser, {
      fields: [portalPasswordReset.portalUserId],
      references: [portalUser.id],
    }),
  })
);
