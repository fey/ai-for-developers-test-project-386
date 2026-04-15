import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card } from '../components/ui/card';
import { apiBookingsPath } from '../lib/routes';

type Booking = {
  id: string;
  eventTypeSlug: string;
  eventTypeName: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  notes: string;
  bookedAt: string;
};

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

const formatTimeRange = (startIso: string, endIso: string): string =>
  `${new Date(startIso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} - ${new Date(endIso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`;

export const EventsPage = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetch(apiBookingsPath())
      .then((response) => response.json())
      .then((data: Booking[]) => setBookings(data));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground" data-testid="events-title">{t('events.title')}</h1>
      <div className="mt-6 grid gap-4" data-testid="bookings-list">
        {bookings.length === 0 ? (
          <Card data-testid="events-empty-state">
            <p className="text-sm text-muted-foreground">{t('events.empty')}</p>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card data-client-name={booking.clientName} data-testid="booking-card" key={booking.id}>
              <p className="text-base font-semibold text-foreground">{booking.clientName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{booking.clientEmail}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t('events.type')} {booking.eventTypeName} ({booking.eventTypeSlug})</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('events.time')} {formatDateTime(booking.startTime)} • {formatTimeRange(booking.startTime, booking.endTime)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('events.notes')} {booking.notes || t('events.noNotes')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('events.createdAt')} {formatDateTime(booking.bookedAt)}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
