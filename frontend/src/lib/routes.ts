const API_PREFIX = '/api';

export const homePath = (): string => '/';
export const bookPath = (): string => '/book';
export const adminPath = (): string => '/admin';
export const adminEventsPath = (): string => '/admin/events';
export const adminEventTypesPath = (): string => '/admin/event-types';
export const adminEventTypeNewPath = (): string => '/admin/event-types/new';
export const adminEventTypeEditPath = (id: string): string => `/admin/event-types/${id}`;

export const bookBySlugPath = (slug: string): string => `/book/${slug}`;
export const apiEventTypesPath = (): string => `${API_PREFIX}/event-types`;
export const apiEventTypeAvailabilityPath = (slug: string): string => `${API_PREFIX}/event-types/${slug}/availability`;
export const apiAdminEventTypesPath = (): string => `${API_PREFIX}/admin/event-types`;
export const apiAdminEventTypePath = (id: string): string => `${API_PREFIX}/admin/event-types/${id}`;
export const apiBookingsPath = (): string => `${API_PREFIX}/bookings`;
