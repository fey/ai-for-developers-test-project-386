import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { BookHostProfile } from '../components/book-host-profile';
import { Card } from '../components/ui/card';
import type { EventType } from '../lib/booking';
import { apiEventTypesPath, bookBySlugPath } from '../lib/routes';

export const BookPage = () => {
  const { t } = useTranslation();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadEventTypes = async (): Promise<void> => {
      try {
        const response = await fetch(apiEventTypesPath());
        if (!response.ok) {
          setStatus(t('book.errors.loadEventTypes'));
          setEventTypes([]);
          return;
        }

        const payload = (await response.json()) as EventType[];
        setEventTypes(payload);
      } catch {
        setStatus(t('book.errors.loadEventTypesApi'));
        setEventTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadEventTypes();
  }, [t]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6">
        <BookHostProfile />
        <h1 className="mt-4 text-3xl font-bold text-foreground" data-testid="book-title">{t('book.catalog.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('book.catalog.subtitle')}</p>
      </div>

      {status ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground" data-testid="book-status">{status}</p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2" data-testid="book-event-types-list">
        {isLoading ? (
          <Card>
            <p className="text-sm text-muted-foreground">{t('book.catalog.loading')}</p>
          </Card>
        ) : eventTypes.length === 0 ? (
          <Card data-testid="book-event-types-empty">
            <p className="text-sm text-muted-foreground">{t('book.catalog.empty')}</p>
          </Card>
        ) : (
          eventTypes.map((eventType) => (
            <Link className="block h-full" key={eventType.id} to={bookBySlugPath(eventType.slug)}>
              <Card
                className="h-full cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xs"
                data-testid="book-event-type-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-foreground">{eventType.name}</h2>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {eventType.durationMinutes} {t('book.catalog.minutes')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {eventType.description || t('book.info.noDescription')}
                </p>
              </Card>
            </Link>
          ))
        )}
      </section>
    </main>
  );
};
