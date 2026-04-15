import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import fastifyStatic from '@fastify/static';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { and, asc, eq, gt, gte, lt } from 'drizzle-orm';
import { z } from 'zod';

import { getSlotConfig } from './config.js';
import { createInMemoryDatabase } from './db/client.js';
import { bookingsTable, eventTypesTable } from './db/schema.js';
import { buildAvailabilityCandidates, isIntervalsOverlapping } from './slots.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const eventTypeBaseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().regex(slugPattern),
  description: z.string().trim().max(500).default(''),
  durationMinutes: z.int().min(5).max(480),
});

const createEventTypeSchema = eventTypeBaseSchema;

const updateEventTypeSchema = eventTypeBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'at_least_one_field_required' });

const createBookingSchema = z.object({
  eventTypeSlug: z.string().trim().regex(slugPattern),
  startTime: z.string().datetime(),
  clientName: z.string().trim().min(1),
  clientEmail: z.email(),
  notes: z.string().trim().max(2000).optional().default(''),
});

const idParamSchema = z.object({ id: z.string().min(1) });
const slugParamSchema = z.object({ slug: z.string().trim().regex(slugPattern) });

const publicUrlBySlug = (slug: string): string => `/book/${slug}`;

const app: FastifyPluginAsync = async (fastify) => {
  const slotConfig = getSlotConfig(process.env);
  const { db, sqlite } = createInMemoryDatabase();
  const frontendDistDir = resolve(process.cwd(), 'frontend-dist');

  fastify.addHook('onClose', async () => {
    sqlite.close();
  });

  if (existsSync(frontendDistDir)) {
    await fastify.register(fastifyStatic, {
      root: frontendDistDir,
      prefix: '/',
    });

    const renderApp = async (_request: FastifyRequest, reply: FastifyReply) => reply.sendFile('index.html');

    fastify.get('/', renderApp);
    fastify.get('/book', renderApp);
    fastify.get('/book/:slug', renderApp);
    fastify.get('/admin', renderApp);
    fastify.get('/admin/events', renderApp);
    fastify.get('/admin/event-types', renderApp);
    fastify.get('/admin/event-types/new', renderApp);
    fastify.get('/admin/event-types/:id', renderApp);
  } else {
    fastify.get('/', async (_request, reply) => {
      reply.type('text/html');
      return '<!doctype html><html><body><h1>Calendar Slot Smoke OK</h1></body></html>';
    });
  }

  fastify.get('/api/event-types', async () => {
    const eventTypes = db.select().from(eventTypesTable).orderBy(asc(eventTypesTable.name)).all();

    return eventTypes.map((eventType) => ({
      id: eventType.id,
      slug: eventType.slug,
      name: eventType.name,
      description: eventType.description,
      durationMinutes: eventType.durationMinutes,
      publicUrl: publicUrlBySlug(eventType.slug),
    }));
  });

  fastify.get('/api/admin/event-types', async () => {
    const eventTypes = db.select().from(eventTypesTable).orderBy(asc(eventTypesTable.name)).all();

    return eventTypes.map((eventType) => ({
      id: eventType.id,
      slug: eventType.slug,
      name: eventType.name,
      description: eventType.description,
      durationMinutes: eventType.durationMinutes,
      createdAt: eventType.createdAt,
      updatedAt: eventType.updatedAt,
      publicUrl: publicUrlBySlug(eventType.slug),
    }));
  });

  fastify.get('/api/admin/event-types/:id', async (request, reply) => {
    const parsedParams = idParamSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.status(422);
      return { error: 'invalid_event_type_id' };
    }

    const eventType = db.select().from(eventTypesTable).where(eq(eventTypesTable.id, parsedParams.data.id)).get();
    if (!eventType) {
      reply.status(404);
      return { error: 'event_type_not_found' };
    }

    return {
      ...eventType,
      publicUrl: publicUrlBySlug(eventType.slug),
    };
  });

  fastify.post('/api/admin/event-types', async (request, reply) => {
    const parsed = createEventTypeSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(422);
      return {
        error: 'invalid_payload',
        details: parsed.error.issues.map((issue) => issue.message),
      };
    }

    const payload = parsed.data;
    const nowIso = new Date().toISOString();

    try {
      const eventType = {
        id: randomUUID(),
        slug: payload.slug,
        name: payload.name,
        description: payload.description,
        durationMinutes: payload.durationMinutes,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.insert(eventTypesTable).values(eventType).run();

      reply.status(201);
      return {
        ...eventType,
        publicUrl: publicUrlBySlug(eventType.slug),
      };
    } catch {
      reply.status(409);
      return { error: 'event_type_slug_exists' };
    }
  });

  fastify.patch('/api/admin/event-types/:id', async (request, reply) => {
    const parsedParams = idParamSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.status(422);
      return { error: 'invalid_event_type_id' };
    }

    const parsedBody = updateEventTypeSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(422);
      return {
        error: 'invalid_payload',
        details: parsedBody.error.issues.map((issue) => issue.message),
      };
    }

    const eventTypeId = parsedParams.data.id;
    const existing = db.select().from(eventTypesTable).where(eq(eventTypesTable.id, eventTypeId)).get();

    if (!existing) {
      reply.status(404);
      return { error: 'event_type_not_found' };
    }

    const payload = parsedBody.data;

    try {
      db.update(eventTypesTable)
        .set({
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
          ...(payload.description !== undefined ? { description: payload.description } : {}),
          ...(payload.durationMinutes !== undefined ? { durationMinutes: payload.durationMinutes } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(eventTypesTable.id, eventTypeId))
        .run();
    } catch {
      reply.status(409);
      return { error: 'event_type_slug_exists' };
    }

    const updated = db.select().from(eventTypesTable).where(eq(eventTypesTable.id, eventTypeId)).get();
    if (!updated) {
      reply.status(404);
      return { error: 'event_type_not_found' };
    }

    return {
      ...updated,
      publicUrl: publicUrlBySlug(updated.slug),
    };
  });

  fastify.delete('/api/admin/event-types/:id', async (request, reply) => {
    const parsedParams = idParamSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.status(422);
      return { error: 'invalid_event_type_id' };
    }

    const eventTypeId = parsedParams.data.id;
    const eventType = db.select().from(eventTypesTable).where(eq(eventTypesTable.id, eventTypeId)).get();
    if (!eventType) {
      reply.status(404);
      return { error: 'event_type_not_found' };
    }

    const nowIso = new Date().toISOString();
    const futureBooking = db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.eventTypeId, eventTypeId), gte(bookingsTable.startTime, nowIso)))
      .get();

    if (futureBooking) {
      reply.status(409);
      return { error: 'event_type_has_future_bookings' };
    }

    db.delete(bookingsTable).where(eq(bookingsTable.eventTypeId, eventTypeId)).run();
    db.delete(eventTypesTable).where(eq(eventTypesTable.id, eventTypeId)).run();

    reply.status(204);
    return null;
  });

  fastify.get('/api/event-types/:slug/availability', async (request, reply) => {
    const parsedParams = slugParamSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.status(422);
      return { error: 'invalid_event_type_slug' };
    }

    const eventType = db
      .select()
      .from(eventTypesTable)
      .where(eq(eventTypesTable.slug, parsedParams.data.slug))
      .get();

    if (!eventType) {
      reply.status(404);
      return { error: 'event_type_not_found' };
    }

    const bookedIntervals = db
      .select({ startTime: bookingsTable.startTime, endTime: bookingsTable.endTime })
      .from(bookingsTable)
      .all();

    const candidates = buildAvailabilityCandidates(slotConfig, eventType.durationMinutes);

    return candidates.map((candidate) => ({
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      isAvailable: !bookedIntervals.some((booking) =>
        isIntervalsOverlapping(candidate.startTime, candidate.endTime, booking.startTime, booking.endTime),
      ),
    }));
  });

  fastify.post('/api/bookings', async (request, reply) => {
    const parsed = createBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(422);
      return {
        error: 'invalid_payload',
        details: parsed.error.issues.map((issue) => issue.message),
      };
    }

    const payload = parsed.data;

    const eventType = db
      .select()
      .from(eventTypesTable)
      .where(eq(eventTypesTable.slug, payload.eventTypeSlug))
      .get();

    if (!eventType) {
      reply.status(404);
      return { error: 'event_type_not_found' };
    }

    const candidateSlots = buildAvailabilityCandidates(slotConfig, eventType.durationMinutes);
    const selectedSlot = candidateSlots.find((candidate) => candidate.startTime === payload.startTime);

    if (!selectedSlot) {
      reply.status(422);
      return { error: 'invalid_start_time' };
    }

    const overlappingBooking = db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          lt(bookingsTable.startTime, selectedSlot.endTime),
          gt(bookingsTable.endTime, selectedSlot.startTime),
        ),
      )
      .get();

    if (overlappingBooking) {
      reply.status(409);
      return { error: 'slot_already_booked' };
    }

    const booking = {
      id: randomUUID(),
      eventTypeId: eventType.id,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      notes: payload.notes,
      bookedAt: new Date().toISOString(),
    };

    db.insert(bookingsTable).values(booking).run();

    reply.status(201);
    return {
      ...booking,
      eventTypeSlug: eventType.slug,
      eventTypeName: eventType.name,
    };
  });

  fastify.get('/api/bookings', async () => {
    const nowIso = new Date().toISOString();

    const rows = db
      .select({
        id: bookingsTable.id,
        eventTypeId: bookingsTable.eventTypeId,
        eventTypeSlug: eventTypesTable.slug,
        eventTypeName: eventTypesTable.name,
        startTime: bookingsTable.startTime,
        endTime: bookingsTable.endTime,
        clientName: bookingsTable.clientName,
        clientEmail: bookingsTable.clientEmail,
        notes: bookingsTable.notes,
        bookedAt: bookingsTable.bookedAt,
      })
      .from(bookingsTable)
      .innerJoin(eventTypesTable, eq(bookingsTable.eventTypeId, eventTypesTable.id))
      .where(gte(bookingsTable.startTime, nowIso))
      .orderBy(asc(bookingsTable.startTime))
      .all();

    return rows;
  });
};

export default app;
