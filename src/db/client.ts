import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import { addMinutesIso } from '../slots.js';
import * as schema from './schema.js';

type Schema = typeof schema;
export type AppDatabase = BetterSQLite3Database<Schema>;

export type DatabaseContext = {
  db: AppDatabase;
  sqlite: Database.Database;
};

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const dateByOffsetUtc = (dayOffset: number): string => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
};

const toUtcIso = (date: string, hour: number, minute = 0): string =>
  new Date(`${date}T${pad2(hour)}:${pad2(minute)}:00.000Z`).toISOString();

export const createInMemoryDatabase = (): DatabaseContext => {
  const sqlite = new Database(':memory:');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS event_types (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      event_type_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      booked_at TEXT NOT NULL,
      FOREIGN KEY(event_type_id) REFERENCES event_types(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS bookings_event_type_start_unique
      ON bookings(event_type_id, start_time);

    CREATE INDEX IF NOT EXISTS bookings_event_type_start_idx
      ON bookings(event_type_id, start_time);
  `);

  const db = drizzle(sqlite, { schema });

  const nowIso = new Date().toISOString();
  const introCallId = 'default-event-type-30';
  const quickCallId = 'default-event-type-15';

  db.insert(schema.eventTypesTable)
    .values([
      {
        id: introCallId,
        slug: 'intro-call',
        name: 'Встреча 30 минут',
        description: 'Базовый тип события для бронирования.',
        durationMinutes: 30,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: quickCallId,
        slug: 'quick-call',
        name: 'Встреча 15 минут',
        description: 'Короткий тип события для быстрого слота.',
        durationMinutes: 15,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ])
    .onConflictDoNothing()
    .run();

  const plusTwoDaysDate = dateByOffsetUtc(2);
  const plusSevenDaysDate = dateByOffsetUtc(7);
  const quickCallStart = toUtcIso(plusTwoDaysDate, 15);
  const introCallStart = toUtcIso(plusSevenDaysDate, 11);

  db.insert(schema.bookingsTable)
    .values([
      {
        id: 'seed-booking-quick-call-plus-2d',
        eventTypeId: quickCallId,
        startTime: quickCallStart,
        endTime: addMinutesIso(quickCallStart, 15),
        clientName: 'Seed Quick Client',
        clientEmail: 'seed-quick@example.com',
        notes: '',
        bookedAt: nowIso,
      },
      {
        id: 'seed-booking-intro-call-plus-7d',
        eventTypeId: introCallId,
        startTime: introCallStart,
        endTime: addMinutesIso(introCallStart, 30),
        clientName: 'Seed Intro Client',
        clientEmail: 'seed-intro@example.com',
        notes: '',
        bookedAt: nowIso,
      },
    ])
    .onConflictDoNothing()
    .run();

  return { db, sqlite };
};
