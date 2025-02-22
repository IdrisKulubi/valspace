import { relations, sql } from "drizzle-orm";
import {
  timestamp,
  pgTable,
  text,
  integer,
  boolean,
  uuid,
  json,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "@auth/core/adapters";

// First define all tables
export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(), 
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    role: text("role").$type<"user" | "admin">().default("user"),
    emailVerified: timestamp("emailVerified"),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastActive: timestamp("last_active").defaultNow().notNull(),
    isOnline: boolean("is_online").default(false),
    profilePhoto: text("profile_photo"),
    phoneNumber: text("phone_number").notNull(),
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email),
    createdAtIdx: index("user_created_at_idx").on(table.createdAt),
    lastActiveIdx: index("user_last_active_idx").on(table.lastActive),
  })
);

// Auth.js tables
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Extended user profiles
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bio: text("bio"),
    age: integer("age"),
    gender: text("gender"),
    role: text("role").$type<"user" | "admin">().default("user"),

    interests: json("interests").$type<string[]>(),
    photos: json("photos").$type<string[]>(), // Array of photo URLs
    isVisible: boolean("is_visible").default(true),
    lastActive: timestamp("last_active").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    isComplete: boolean("is_complete").default(false),
    profileCompleted: boolean("profile_completed").default(false),
    lookingFor: text("looking_for"),
    course: text("course"),
    yearOfStudy: integer("year_of_study"),
    instagram: text("instagram"),
    spotify: text("spotify"),
    snapchat: text("snapchat"),
    profilePhoto: text("profile_photo"),
    phoneNumber: text("phone_number"),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    isMatch: boolean("is_match").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("profile_user_id_idx").on(table.userId),
    isVisibleIdx: index("profile_is_visible_idx").on(table.isVisible),
    genderIdx: index("profile_gender_idx").on(table.gender),
    lastActiveIdx: index("profile_last_active_idx").on(table.lastActive),
    completedIdx: index("profile_completed_idx").on(table.profileCompleted),
  })
);

// Swipes/Likes
export const swipes = pgTable(
  "swipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    swiperId: text("swiper_id")
      .notNull()
      .references(() => users.id),
    swipedId: text("swiped_id")
      .notNull()
      .references(() => users.id),
    isLike: boolean("is_like").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    swiperIdx: index("swipe_swiper_idx").on(table.swiperId),
    swipedIdx: index("swipe_swiped_idx").on(table.swipedId),
    createdAtIdx: index("swipe_created_at_idx").on(table.createdAt),
    // Compound index for faster lookups
    swipeComboIdx: index("swipe_combo_idx").on(table.swiperId, table.swipedId),
  })
);

// Matches
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user1Id: text("user1_id")
      .notNull()
      .references(() => users.id),
    user2Id: text("user2_id")
      .notNull()
      .references(() => users.id),
    user1Typing: boolean("user1_typing").default(false),
    user2Typing: boolean("user2_typing").default(false),
    lastMessageAt: timestamp("last_message_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("match_users_idx").on(table.user1Id, table.user2Id),
    lastMessageIdx: index("last_message_idx").on(table.lastMessageAt),
  })
);

export const feedbacks = pgTable("feedbacks", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  phoneNumber: text("phone_number"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages
export const messages = pgTable(
  "messages",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    content: text("content").notNull(),
    matchId: uuid("match_id")
      .references(() => matches.id)
      .notNull(),
    senderId: text("sender_id")
      .references(() => users.id)
      .notNull(),
    status: text("status", { enum: ["sent", "delivered", "read"] })
      .default("sent")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => ({
    matchIdIdx: index("match_id_idx").on(table.matchId),
    senderIdIdx: index("sender_id_idx").on(table.senderId),
    createdAtIdx: index("created_at_idx").on(table.createdAt)
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  })
}));

// Blocks
export const blocks = pgTable("blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  blockerId: text("blocker_id")
    .notNull()
    .references(() => users.id),
  blockedId: text("blocked_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Starred Profiles
export const starredProfiles = pgTable("starred_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  starredId: text("starred_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reports
export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => users.id),
  reportedUserId: text("reported_user_id")
    .notNull()
    .references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status").$type<"PENDING" | "RESOLVED">().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  adminNotes: text("admin_notes"),
}, (table) => ({
  reportedIdx: index("reported_user_idx").on(table.reportedUserId),
  statusIdx: index("report_status_idx").on(table.status),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  sentSwipes: many(swipes, { relationName: "swiperRelation" }),
  receivedSwipes: many(swipes, { relationName: "swipedRelation" }),
  matches1: many(matches, { relationName: "user1Relation" }),
  matches2: many(matches, { relationName: "user2Relation" }),
  starredProfiles: many(starredProfiles, {
    relationName: "userStarredProfiles",
  }),
  reports: many(reports, { relationName: "userReports" }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  messages: many(messages, { relationName: "matchMessages" }),
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  reportedUser: one(users, {
    fields: [reports.reportedUserId],
    references: [users.id],
  }),
}));

// Then create type references at the end
export type Profile = typeof profiles.$inferSelect & {
  isMatch: boolean | null;
  userId: string;
  unreadMessages?: number;
  matchId?: string;
};

// Export the Message type if needed
export type Message = typeof messages.$inferSelect;
