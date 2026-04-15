import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import app from '../src/app.js';

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const dateByOffsetUtc = (dayOffset: number): string => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
};

const toUtcIso = (date: string, hour: number, minute = 0): string =>
  new Date(`${date}T${pad2(hour)}:${pad2(minute)}:00.000Z`).toISOString();

const addMinutesIso = (iso: string, minutes: number): string => {
  const date = new Date(iso);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
};

describe('calendar booking API', () => {
  it('returns seeded event types', async () => {
    const server = Fastify();
    await server.register(app);

    const response = await server.inject({ method: 'GET', url: '/api/event-types' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'intro-call',
          durationMinutes: 30,
        }),
        expect.objectContaining({
          slug: 'quick-call',
          durationMinutes: 15,
        }),
      ]),
    );

    await server.close();
  });

  it('returns two seeded bookings by default', async () => {
    const server = Fastify();
    await server.register(app);

    const response = await server.inject({ method: 'GET', url: '/api/bookings' });

    expect(response.statusCode).toBe(200);
    const bookings = response.json();
    expect(bookings).toHaveLength(2);

    const expectedQuickStart = toUtcIso(dateByOffsetUtc(2), 15);
    const expectedIntroStart = toUtcIso(dateByOffsetUtc(7), 11);
    const expectedQuickEnd = addMinutesIso(expectedQuickStart, 15);
    const expectedIntroEnd = addMinutesIso(expectedIntroStart, 30);

    expect(bookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventTypeSlug: 'quick-call',
          startTime: expectedQuickStart,
          endTime: expectedQuickEnd,
        }),
        expect.objectContaining({
          eventTypeSlug: 'intro-call',
          startTime: expectedIntroStart,
          endTime: expectedIntroEnd,
        }),
      ]),
    );

    await server.close();
  });

  it('returns computed availability for event type', async () => {
    const server = Fastify();
    await server.register(app);

    const response = await server.inject({ method: 'GET', url: '/api/event-types/intro-call/availability' });

    expect(response.statusCode).toBe(200);
    const slots = response.json();
    expect(slots).toHaveLength(18 * 14);
    expect(slots[0]).toMatchObject({
      isAvailable: true,
    });

    await server.close();
  });

  it('books slot by eventTypeSlug + startTime and hides it from availability', async () => {
    const server = Fastify();
    await server.register(app);

    const availabilityResponse = await server.inject({ method: 'GET', url: '/api/event-types/intro-call/availability' });
    const [slot] = availabilityResponse.json();

    const bookResponse = await server.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeSlug: 'intro-call',
        startTime: slot.startTime,
        clientName: 'Alice',
        clientEmail: 'alice@example.com',
        notes: 'Need to discuss contract details',
      },
    });

    expect(bookResponse.statusCode).toBe(201);
    expect(bookResponse.json()).toMatchObject({ notes: 'Need to discuss contract details' });

    const updatedAvailabilityResponse = await server.inject({ method: 'GET', url: '/api/event-types/intro-call/availability' });
    const updatedSlot = updatedAvailabilityResponse
      .json()
      .find((candidate: { startTime: string }) => candidate.startTime === slot.startTime);

    expect(updatedSlot).toMatchObject({ isAvailable: false });

    const bookingsResponse = await server.inject({ method: 'GET', url: '/api/bookings' });
    const savedBooking = bookingsResponse
      .json()
      .find((booking: { startTime: string }) => booking.startTime === slot.startTime);
    expect(savedBooking).toMatchObject({ notes: 'Need to discuss contract details' });

    await server.close();
  });

  it('blocks overlapping slots across different event types', async () => {
    const server = Fastify();
    await server.register(app);

    const quarterHourAvailabilityResponse = await server.inject({
      method: 'GET',
      url: '/api/event-types/quick-call/availability',
    });
    const quarterHourAvailability = quarterHourAvailabilityResponse.json();

    const bookedQuarterHourSlot = quarterHourAvailability.find(
      (slot: { startTime: string }) => slot.startTime.endsWith('15:00:00.000Z'),
    );

    expect(bookedQuarterHourSlot).toBeDefined();

    const firstBookingResponse = await server.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeSlug: 'quick-call',
        startTime: bookedQuarterHourSlot.startTime,
        clientName: 'Bob',
        clientEmail: 'bob@example.com',
      },
    });

    expect(firstBookingResponse.statusCode).toBe(201);

    const introCallAvailabilityResponse = await server.inject({
      method: 'GET',
      url: '/api/event-types/intro-call/availability',
    });
    const introCallAvailability = introCallAvailabilityResponse.json();
    const introCallFifteen = introCallAvailability.find(
      (slot: { startTime: string }) => slot.startTime.endsWith('15:00:00.000Z'),
    );

    expect(introCallFifteen).toMatchObject({ isAvailable: false });

    await server.close();
  });

  it('supports admin create/update/delete with guard for future bookings', async () => {
    const server = Fastify();
    await server.register(app);

    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/admin/event-types',
      payload: {
        name: 'Discovery',
        slug: 'discovery',
        description: 'Initial event type',
        durationMinutes: 45,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();

    const updateResponse = await server.inject({
      method: 'PATCH',
      url: `/api/admin/event-types/${created.id}`,
      payload: {
        name: 'Discovery Updated',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({ name: 'Discovery Updated' });

    const availabilityResponse = await server.inject({
      method: 'GET',
      url: '/api/event-types/discovery/availability',
    });
    const [slot] = availabilityResponse.json();

    await server.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeSlug: 'discovery',
        startTime: slot.startTime,
        clientName: 'Demo',
        clientEmail: 'demo@example.com',
      },
    });

    const deleteConflictResponse = await server.inject({
      method: 'DELETE',
      url: `/api/admin/event-types/${created.id}`,
    });

    expect(deleteConflictResponse.statusCode).toBe(409);
    expect(deleteConflictResponse.json()).toMatchObject({ error: 'event_type_has_future_bookings' });

    await server.close();
  });
});
