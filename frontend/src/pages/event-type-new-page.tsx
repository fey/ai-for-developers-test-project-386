import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { adminEventTypesPath, apiAdminEventTypesPath } from '../lib/routes';

type FormState = {
  name: string;
  slug: string;
  description: string;
  durationMinutes: string;
};

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  durationMinutes: '30',
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

export const EventTypeNewPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus('');

    const durationMinutes = Number.parseInt(form.durationMinutes, 10);
    if (!Number.isFinite(durationMinutes)) {
      setStatus(t('eventTypes.errors.minutesInvalid'));
      return;
    }

    const response = await fetch(apiAdminEventTypesPath(), {
      method: 'POST',
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
          <h2 className="text-3xl font-bold text-foreground" data-testid="event-type-new-title">{t('eventTypes.form.create')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('eventTypes.subtitle')}</p>
        </div>
        <Link className="inline-flex" to={adminEventTypesPath()}>
          <Button type="button" variant="outline">
            {t('eventTypes.actions.cancel')}
          </Button>
        </Link>
      </div>

      <Card className="mt-6" data-testid="event-type-new-form">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="event-type-new-name">
              {t('eventTypes.form.name')}
            </label>
            <Input
              data-testid="event-type-new-name-input"
              id="event-type-new-name"
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              value={form.name}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="event-type-new-slug">
              {t('eventTypes.form.slug')}
            </label>
            <Input
              data-testid="event-type-new-slug-input"
              id="event-type-new-slug"
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
              value={form.slug}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="event-type-new-description">
              {t('eventTypes.form.description')}
            </label>
            <textarea
              className="min-h-[88px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-hidden transition focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="event-type-new-description-input"
              id="event-type-new-description"
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              value={form.description}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="event-type-new-duration">
              {t('eventTypes.form.duration')}
            </label>
            <Input
              data-testid="event-type-new-duration-input"
              id="event-type-new-duration"
              min={5}
              onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
              required
              type="number"
              value={form.durationMinutes}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full md:w-auto" data-testid="event-type-new-save-button" type="submit">
              {t('eventTypes.actions.create')}
            </Button>
          </div>
        </form>
      </Card>

      {status && (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-foreground" data-testid="event-type-new-status">
          {status}
        </p>
      )}
    </div>
  );
};
