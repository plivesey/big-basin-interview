import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import type { MessageContent } from '@asba/shared-types';

// Re-export message content types from shared package
export type { TextContent, ToolUseContent, ToolResultContent, SystemNotificationContent, MessageContent } from '@asba/shared-types';

// Working hours type for JSON column
export type WorkingHours = Record<string, { open: string; close: string } | null>;

// Geographic regions for provider filtering
export type ProviderGeo =
  | 'seattle'
  | 'san_francisco'
  | 'south_bay'      // Mountain View, Palo Alto, Sunnyvale area
  | 'princeton'
  | 'vancouver'
  | 'toronto'
  | 'new_york';

export const PROVIDER_GEOS: ProviderGeo[] = [
  'seattle',
  'san_francisco',
  'south_bay',
  'princeton',
  'vancouver',
  'toronto',
  'new_york'
];

// Providers table - stores service providers (salons, mechanics, dentists, etc.)
export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'salon', 'mechanic', 'dentist', etc.
  description: text('description'),
  address: text('address').notNull(),
  geo: text('geo').$type<ProviderGeo>().notNull(), // Geographic region for filtering
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  rating: real('rating').notNull(), // 1-5
  reviewCount: integer('review_count').default(0),
  phoneNumber: text('phone_number'),
  email: text('email'),
  website: text('website'),
  // Working hours stored as JSON: { "monday": { "open": "09:00", "close": "17:00" }, ... }
  workingHours: text('working_hours', { mode: 'json' }).$type<WorkingHours>().notNull(),
  // Services offered as JSON array: ["haircut", "coloring", "styling"]
  services: text('services', { mode: 'json' }).$type<string[]>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('provider_geo_idx').on(table.geo),
]);

// Bookings table - stores user bookings with providers
export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default_user'), // Static for MVP
  providerId: text('provider_id').notNull().references(() => providers.id),
  serviceType: text('service_type').notNull(),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  duration: integer('duration').notNull(), // minutes
  status: text('status').notNull(), // 'pending', 'confirmed', 'cancelled'
  calendarEventId: text('calendar_event_id'), // Google Calendar event ID
  idempotencyKey: text('idempotency_key').notNull().unique(), // Prevent duplicates
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Sessions table - stores chat sessions
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default_user'), // Static for MVP
  currentWorkflowId: text('current_workflow_id'), // Currently active workflow (nullable, no FK to avoid circular ref)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastActivityAt: integer('last_activity_at', { mode: 'timestamp' }).notNull(),
});

// Calendar connections table - stores Google Calendar OAuth tokens per user
export const calendarConnections = sqliteTable('calendar_connections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(), // 'default_user' for MVP, one calendar per user
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  calendarId: text('calendar_id').notNull().default('primary'),
  email: text('email'), // Google account email for display
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Workflow states table - tracks booking workflow progress
export const workflowStates = sqliteTable('workflow_states', {
  id: text('id').primaryKey(), // Unique workflow ID (supports multiple bookings per session)
  sessionId: text('session_id').notNull().references(() => sessions.id),
  currentState: text('current_state').notNull(), // 'PROVIDER_SEARCH', 'PROVIDER_SELECTION', etc.
  // Context stored as JSON: { serviceType, location, selectedProviderId, bookingId, etc. }
  context: text('context', { mode: 'json' }).$type<WorkflowContext>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
}, (table) => [
  index('workflow_session_id_idx').on(table.sessionId),
]);

// Workflow context type for JSON column
export interface WorkflowContext {
  serviceType?: string;
  location?: string;
  timePreference?: string;
  selectedProviderId?: string;
  selectedProviders?: string[]; // IDs of search results
  selectedTimeSlot?: string; // ISO date string
  bookingId?: string;
}

// Messages table - stores conversation history
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  role: text('role').notNull(), // 'user' or 'assistant'
  // Content stored as JSON to support multi-block messages (text, tool_use, tool_result)
  content: text('content', { mode: 'json' }).$type<MessageContent[]>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('messages_session_id_idx').on(table.sessionId),
]);

// Type exports for use in other files
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type WorkflowState = typeof workflowStates.$inferSelect;
export type NewWorkflowState = typeof workflowStates.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type NewCalendarConnection = typeof calendarConnections.$inferInsert;

// Memories table - stores user information (location, preferences, etc.)
export const memories = sqliteTable('memories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),  // 'location', 'preference', etc.
  value: text('value', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('memories_user_type_idx').on(table.userId, table.type),
]);

export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
