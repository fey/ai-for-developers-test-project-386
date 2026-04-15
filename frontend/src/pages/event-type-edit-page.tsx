import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { adminEventTypesPath, apiAdminEventTypePath } from '../lib/routes';

type EventType = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  publicUrl: string;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  durationMinutes: string;
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

export const EventTypeEditPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormState>({
    name: '',
    slug: '',
    description: '',
    durationMinutes: '30',
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!id) {
        setStatus(t('eventTypes.errors.notFound'));
        setIsLoading(false);
        return;
      }

      const response = await fetch(apiAdminEventTypePath(id));
      if (!response.ok) {
        setStatus(await payloadErrorMessage(response, t('eventTypes.errors.notFound')));
        setIsLoading(false);
        return;
      }

      const eventType = (await response.json()) as EventType;
      setForm({
        name: eventType.name,
        slug: eventType.slug,
        description: eventType.description,
        durationMinutes: String(eventType.durationMinutes),
      });
      setIsLoading(false);
    };

    void load();
  }, [id, t]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus('');

    if (!id) {
      setStatus(t('eventTypes.errors.notFound'));
      return;
    }

    const durationMinutes = Number.parseInt(form.durationMinutes, 10);
    if (!Number.isFinite(durationMinutes)) {
      setStatus(t('eventTypes.errors.minutesInvalid'));
      return;
    }

    const response = await fetch(apiAdminEventTypePath(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        durationMinutes,
      }),
    });

    if (!response.ok) {
      setStatus(await payloadErrorMessage(response, t('eventTypes.errors.saveFailed')));
      return;
    }

    navigate(adminEventTypesPath());
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-foreground" data-testid="event-type-edit-title">{t('eventTypes.form.edit')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('eventTypes.subtitle')}</p>
        </div>
        <Link className="inline-flex" to={adminEventTypesPath()}>
          <Button type="button" variant="outline">
            {t('eventTypes.actions.cancel')}
          </Button>
        </Link>
      </div>

      <Card className="mt-6" data-testid="event-type-edit-form">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('eventTypes.loading')}</p>
        ) : (
          <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="event-type-edit-name">
                {t('eventTypes.form.name')}
              </label>
              <Input
                data-testid="event-type-edit-name-input"
                id="event-type-edit-name"
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
                value={form.name}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="event-type-edit-slug">
                {t('eventTypes.form.slug')}
              </label>
              <Input
                data-testid="event-type-edit-slug-input"
                id="event-type-edit-slug"
                onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                value={form.slug}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="event-type-edit-description">
                {t('eventTypes.form.description')}
              </label>
              <textarea
                className="min-h-[88px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="event-type-edit-description-input"
                id="event-type-edit-description"
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                value={form.description}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="event-type-edit-duration">
                {t('eventTypes.form.duration')}
              </label>
              <Input
                data-testid="event-type-edit-duration-input"
                id="event-type-edit-duration"
                min={5}
                onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                required
                type="number"
                value={form.durationMinutes}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full md:w-auto" data-testid="event-type-edit-save-button" type="submit">
                {t('eventTypes.actions.update')}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {status && (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-foreground" data-testid="event-type-edit-status">
          {status}
        </p>
      )}
    </div>
  );
};
