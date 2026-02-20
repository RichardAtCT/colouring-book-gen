import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  plan: text("plan", { enum: ["free", "pro", "creator"] })
    .default("free")
    .notNull(),
  generationsToday: integer("generations_today").default(0).notNull(),
  generationsThisMonth: integer("generations_this_month").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  ageRange: text("age_range", { enum: ["2-4", "5-7", "8-12"] }).notNull(),
  provider: text("provider", { enum: ["openai", "flux"] }).notNull(),
  model: text("model").notNull(),
  quality: text("quality", { enum: ["low", "medium", "high"] })
    .default("low")
    .notNull(),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  width: integer("width"),
  height: integer("height"),
  costUsd: real("cost_usd"),
  status: text("status", { enum: ["pending", "completed", "failed"] })
    .default("pending")
    .notNull(),
  isFavourite: integer("is_favourite", { mode: "boolean" })
    .default(false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const books = sqliteTable("books", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  coverImageUrl: text("cover_image_url"),
  pdfUrl: text("pdf_url"),
  status: text("status", { enum: ["draft", "compiled", "failed"] })
    .default("draft")
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const bookPages = sqliteTable("book_pages", {
  id: text("id").primaryKey(),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  generationId: text("generation_id")
    .notNull()
    .references(() => generations.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  includePageNumber: integer("include_page_number", { mode: "boolean" })
    .default(true)
    .notNull(),
  includeFooter: integer("include_footer", { mode: "boolean" })
    .default(true)
    .notNull(),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  variablesJson: text("variables_json"),
  ageRange: text("age_range", { enum: ["2-4", "5-7", "8-12"] }).notNull(),
  previewUrl: text("preview_url"),
});
