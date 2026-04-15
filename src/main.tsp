import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{ title: "Calendar Slot Booking API" })
@server("http://localhost:8080", "Local development server")
namespace Api;

model EventType {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: int32;
  publicUrl: string;
}

model AdminEventType extends EventType {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model AvailabilitySlot {
  startTime: utcDateTime;
  endTime: utcDateTime;
  isAvailable: boolean;
}

model Booking {
  id: string;
  eventTypeId: string;
  eventTypeSlug: string;
  eventTypeName: string;
  startTime: utcDateTime;
  endTime: utcDateTime;
  clientName: string;
  clientEmail: string;
  notes: string;
  bookedAt: utcDateTime;
}

model CreateEventTypeRequest {
  name: string;
  slug: string;
  description: string;
  durationMinutes: int32;
}

model UpdateEventTypeRequest {
  name?: string;
  slug?: string;
  description?: string;
  durationMinutes?: int32;
}

model CreateBookingRequest {
  eventTypeSlug: string;
  startTime: utcDateTime;
  clientName: string;
  clientEmail: string;
  notes?: string;
}

@route("/api/event-types")
interface EventTypes {
  @get
  list(): EventType[];
}

@route("/api/event-types/{slug}/availability")
interface Availability {
  @get
  list(@path slug: string): AvailabilitySlot[];
}

@route("/api/admin/event-types")
interface AdminEventTypes {
  @get
  list(): AdminEventType[];

  @get
  @route("/{id}")
  getById(@path id: string): AdminEventType;

  @post
  create(@body body: CreateEventTypeRequest): AdminEventType;

  @patch
  @route("/{id}")
  update(@path id: string, @body body: UpdateEventTypeRequest): AdminEventType;

  @delete
  @route("/{id}")
  delete(@path id: string): void;
}

@route("/api/bookings")
interface Bookings {
  @get
  list(): Booking[];

  @post
  create(@body body: CreateBookingRequest): Booking;
}
