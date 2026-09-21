/**
 * D1 schema for the Cloudflare copy of Firebase data.
 * Indexed columns for common queries; nested Firestore fields live in `payload` JSON.
 */
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull().default(''),
    role: text('role').notNull().default('admin'),
    permissions: text('permissions').notNull().default('[]'),
    permissionsVersion: integer('permissions_version').notNull().default(5),
    disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false),
    emailVerified: integer('email_verified', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('users_email_idx').on(t.email)],
)

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    slug: text('slug'),
    title: text('title').notNull().default(''),
    createdBy: text('created_by'),
    payload: text('payload').notNull().default('{}'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (t) => [index('events_slug_idx').on(t.slug)],
)

export const bookings = sqliteTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id').notNull(),
    registrationId: text('registration_id'),
    email: text('email'),
    payload: text('payload').notNull().default('{}'),
    createdAt: text('created_at'),
  },
  (t) => [
    index('bookings_event_id_idx').on(t.eventId),
    index('bookings_registration_id_idx').on(t.registrationId),
  ],
)

export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default(''),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  payload: text('payload').notNull().default('{}'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
})

export const news = sqliteTable(
  'news',
  {
    id: text('id').primaryKey(),
    slug: text('slug'),
    title: text('title').notNull().default(''),
    published: integer('published', { mode: 'boolean' }).notNull().default(false),
    payload: text('payload').notNull().default('{}'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (t) => [index('news_slug_idx').on(t.slug)],
)

export const galleryGroups = sqliteTable('gallery_groups', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  payload: text('payload').notNull().default('{}'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
})

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    payload: text('payload').notNull().default('{}'),
    createdAt: text('created_at'),
  },
  (t) => [index('notifications_user_id_idx').on(t.userId)],
)

export const robofestContent = sqliteTable('robofest_content', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull().default('{}'),
  updatedAt: text('updated_at'),
})

export const robofestRegistrations = sqliteTable(
  'robofest_registrations',
  {
    id: text('id').primaryKey(),
    teamNumber: text('team_number'),
    status: text('status'),
    email: text('email'),
    category: text('category'),
    roundCity: text('round_city'),
    ageCategory: text('age_category'),
    campusAmbassadorId: text('campus_ambassador_id'),
    paymentStatus: text('payment_status'),
    amountPaid: real('amount_paid'),
    teamSize: integer('team_size'),
    payload: text('payload').notNull().default('{}'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (t) => [
    index('robofest_registrations_team_number_idx').on(t.teamNumber),
    index('robofest_registrations_status_idx').on(t.status),
    index('robofest_registrations_status_created_at_idx').on(t.status, t.createdAt),
    index('robofest_registrations_campus_ambassador_id_idx').on(t.campusAmbassadorId),
    index('robofest_registrations_created_at_idx').on(t.createdAt),
  ],
)

export const robofestCampusAmbassadors = sqliteTable(
  'robofest_campus_ambassadors',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().default(''),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    payload: text('payload').notNull().default('{}'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
)

export const robofestTeamCounters = sqliteTable('robofest_team_counters', {
  id: text('id').primaryKey(),
  prefix: text('prefix').notNull(),
  next: integer('next').notNull().default(1),
  updatedAt: text('updated_at'),
})

export const schoolDirectory = sqliteTable(
  'school_directory',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().default(''),
    nameLower: text('name_lower'),
    status: text('status'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    payload: text('payload').notNull().default('{}'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (t) => [index('school_directory_name_lower_idx').on(t.nameLower)],
)

export const homepageOrgs = sqliteTable('homepage_orgs', {
  id: text('id').primaryKey(),
  kind: text('kind'),
  name: text('name').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  payload: text('payload').notNull().default('{}'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
})

export const certificateTemplates = sqliteTable('certificate_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default(''),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  payload: text('payload').notNull().default('{}'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
})

export const bkashPendingRegistrations = sqliteTable(
  'bkash_pending_registrations',
  {
    id: text('id').primaryKey(),
    kind: text('kind'),
    status: text('status'),
    eventId: text('event_id'),
    payload: text('payload').notNull().default('{}'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
)

export const paymentGatewayTokens = sqliteTable('payment_gateway_tokens', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull().default('{}'),
  updatedAt: text('updated_at'),
})

export const passwordResetTokens = sqliteTable(
  'password_reset_tokens',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: text('expires_at').notNull(),
    usedAt: text('used_at'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('password_reset_tokens_hash_idx').on(t.tokenHash)],
)
