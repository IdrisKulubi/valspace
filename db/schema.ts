import { relations } from "drizzle-orm";
import {
  timestamp,
  pgTable,
  text,
  integer,
  boolean,
  uuid,
  json,
  primaryKey,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "@auth/core/adapters";

// Users table
export const users = pgTable("user", {
  id: text("id").primaryKey(), // Maps to Auth.js user id
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
export const profiles = pgTable("profiles", {
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
});

// Swipes/Likes
export const swipes = pgTable("swipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  swiperId: text("swiper_id")
    .notNull()
    .references(() => users.id),
  swipedId: text("swiped_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // 'like' or 'pass'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Matches
export const matches = pgTable("matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  user1Id: text("user1_id")
    .notNull()
    .references(() => users.id),
  user2Id: text("user2_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at"),
});

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  read: boolean("read").default(false),
});

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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  sentSwipes: many(swipes, { relationName: "swiperRelation" }),
  receivedSwipes: many(swipes, { relationName: "swipedRelation" }),
  matches1: many(matches, { relationName: "user1Relation" }),
  matches2: many(matches, { relationName: "user2Relation" }),
}));

export const matchesRelations = relations(matches, ({ many }) => ({
  messages: many(messages, { relationName: "matchMessages" }),
}));

export type Profile = typeof profiles.$inferSelect;
