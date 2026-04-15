import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  adminEventTypeEditPath,
  adminEventTypeNewPath,
  apiAdminEventTypePath,
  apiAdminEventTypesPath,
} from '../lib/routes';

type EventType = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  publicUrl: string;
};

const payloadErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const payload = (await response.json()) as { error?: string; details?: string[] };
    if (payload.details && payload.details.length > 0) {
      return payload.details.join('. ');
    }
    if (payload.error) {
      return payload.error;
    }
  } catch {
    // Ignore JSON parse errors for non-JSON responses.
  }
  return fallback;
};

export const EventTypesPage = () => {
  const { t } = useTranslation();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadEventTypes = async (): Promise<void> => {
    const response = await fetch(apiAdminEventTypesPath());
    if (!response.ok) {
      throw new Error(await payloadErrorMessage(response, t('eventTypes.errors.loadFailed')));
    }

    const data = (await response.json()) as EventType[];
    setEventTypes(data);
  };

  useEffect(() => {
    setIsLoading(true);
    loadEventTypes()
      .catch((error) => setStatus(error instanceof Error ? error.message : t('eventTypes.errors.loadFailed')))
      .finally(() => setIsLoading(false));
  }, [t]);

  const handleDelete = async (id: string): Promise<void> => {
    setStatus('');

    const confirmed = window.confirm(t('eventTypes.confirmDelete'));
    if (!confirmed) {
      return;
    }

    const response = await fetch(apiAdminEventTypePath(id), {
      method: 'DELETE',
    });

    if (!response.ok) {
      setStatus(await payloadErrorMessage(response, t('eventTypes.errors.deleteFailed')));
      return;
    }

    await loadEventTypes();
    setStatus(t('eventTypes.messages.deleted'));
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-foreground" data-testid="event-types-title">{t('eventTypes.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('eventTypes.subtitle')}</p>
        </div>
        <Link className="inline-flex" data-testid="event-type-create-link" to={adminEventTypeNewPath()}>
          <Button type="button">
            {t('eventTypes.actions.create')}
          </Button>
        </Link>
      </div>

      {status && (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-foreground" data-testid="event-types-status">
          {status}
        </p>
      )}

      <div className="mt-6 grid gap-3" data-testid="event-types-list">
        {isLoading ? (
          <Card>
            <p className="text-sm text-muted-foreground">{t('eventTypes.loading')}</p>
          </Card>
        ) : eventTypes.length === 0 ? (
          <Card data-testid="event-types-empty-state">
            <p className="text-sm text-muted-foreground">{t('eventTypes.empty')}</p>
          </Card>
        ) : (
          eventTypes.map((eventType) => (
            <Card data-testid="event-type-card" key={eventType.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{eventType.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{eventType.description || t('eventTypes.noDescription')}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('eventTypes.labels.slug')} {eventType.slug} • {t('eventTypes.labels.duration')} {eventType.durationMinutes}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('eventTypes.labels.publicLink')} <code data-testid="event-type-public-link">{eventType.publicUrl}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link data-testid="event-type-edit-link" to={adminEventTypeEditPath(eventType.id)}>
                    <Button data-testid="event-type-edit-button" type="button" variant="outline">
                      {t('eventTypes.actions.edit')}
                    </Button>
                  </Link>
                  <Button
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    data-testid="event-type-delete-button"
                    onClick={() => void handleDelete(eventType.id)}
                    type="button"
                    variant="outline"
                  >
                    {t('eventTypes.actions.delete')}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
