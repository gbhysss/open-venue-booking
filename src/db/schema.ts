import { pgTable, text, timestamp, boolean, integer, date, time, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

// Better Auth core tables. Keep aligned with the installed Better Auth version.
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, t => [index('session_user_idx').on(t.userId)]);
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [index('account_user_idx').on(t.userId)]);
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const admins = pgTable('admins', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  location: text('location').notNull().default(''),
  capacity: integer('capacity').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  venueId: uuid('venue_id').notNull().references(() => venues.id),
  bookingDate: date('booking_date', { mode:'string' }).notNull(),
  startsAt: time('starts_at', { precision: 0 }).notNull(),
  endsAt: time('ends_at', { precision: 0 }).notNull(),
  applicantName: text('applicant_name').notNull(),
  applicantEmail: text('applicant_email').notNull(),
  purpose: text('purpose').notNull(),
  attendees: integer('attendees').notNull(),
  status: text('status').notNull().default('pending'),
  trackingTokenHash: text('tracking_token_hash').notNull().unique(),
  decisionNote: text('decision_note'),
  decidedBy: text('decided_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
}, t=>[index('reservations_venue_day_idx').on(t.venueId,t.bookingDate),
  index('reservations_created_at_idx').on(t.createdAt),
  index('reservations_email_created_at_idx').on(t.applicantEmail,t.createdAt)]);
export const reservationEvents = pgTable('reservation_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  reservationId: uuid('reservation_id').notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  actorId: text('actor_id').references(()=>user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
