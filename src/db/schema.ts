import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const eventTypesTable = sqliteTable(
  'event_types',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    slugUniqueIdx: uniqueIndex('event_types_slug_unique').on(table.slug),
  }),
);

export const bookingsTable = sqliteTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    eventTypeId: text('event_type_id').notNull().references(() => eventTypesTable.id),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email').notNull(),
    notes: text('notes').notNull().default(''),
    bookedAt: text('booked_at').notNull(),
  },
  (table) => ({
    eventTypeStartUniqueIdx: uniqueIndex('bookings_event_type_start_unique').on(table.eventTypeId, table.startTime),
    eventTypeStartIdx: index('bookings_event_type_start_idx').on(table.eventTypeId, table.startTime),
  }),
);
