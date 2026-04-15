import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { BookHostProfile } from '../components/book-host-profile';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import type { EventType, Slot } from '../lib/booking';
import {
  addMonthsUtc,
  createCalendarDays,
  dateFromKey,
  dateKeyFromIso,
  formatDate,
  formatTime,
  startOfMonthUtc,
} from '../lib/booking';
import { apiBookingsPath, apiEventTypeAvailabilityPath, apiEventTypesPath, bookPath } from '../lib/routes';

type BookingStep = 'select' | 'confirm' | 'success';
type BookingPayloadError = {
  error?: string;
  details?: string[];
};
type CreatedBooking = {
  eventTypeName: string;
  startTime: string;
  endTime: string;
  notes: string;
};

export const BookEventTypePage = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const requestedSlug = (slug ?? '').toLowerCase();

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [isEventTypeLoading, setIsEventTypeLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<BookingStep>('select');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null);
  const [status, setStatus] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonthUtc(new Date()));

  const selectedEventTypeSlug = eventType?.slug ?? '';

  const slotsByDate = useMemo(() => {
    return slots
      .slice()
      .sort((left, right) => left.startTime.localeCompare(right.startTime))
      .reduce<Record<string, Slot[]>>((acc, slotItem) => {
        const dateKey = dateKeyFromIso(slotItem.startTime);
        acc[dateKey] = [...(acc[dateKey] ?? []), slotItem];
        return acc;
      }, {});
  }, [slots]);

  const allDates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);
  const selectedDateSlots = useMemo(() => slotsByDate[selectedDate] ?? [], [slotsByDate, selectedDate]);
  const selectedSlotData = useMemo(
    () => slots.find((slotItem) => slotItem.startTime === selectedSlot) ?? null,
    [slots, selectedSlot],
  );

  const calendarDays = useMemo(() => createCalendarDays(currentMonth), [currentMonth]);

  const loadSlots = async (eventTypeSlug: string): Promise<void> => {
    try {
      const response = await fetch(apiEventTypeAvailabilityPath(eventTypeSlug));
      if (!response.ok) {
        setStatus(t('book.errors.loadSlots'));
        setSlots([]);
        return;
      }

      const data = (await response.json()) as Slot[];
      setSlots(data);
    } catch {
      setStatus(t('book.errors.loadSlotsApi'));
      setSlots([]);
    }
  };

  useEffect(() => {
    const loadEventType = async (): Promise<void> => {
      setIsEventTypeLoading(true);
      setIsNotFound(false);
      setEventType(null);

      if (!requestedSlug) {
        setIsNotFound(true);
        setIsEventTypeLoading(false);
        return;
      }

      try {
        const response = await fetch(apiEventTypesPath());
        if (!response.ok) {
          setStatus(t('book.errors.loadEventTypes'));
          setIsEventTypeLoading(false);
          return;
        }

        const data = (await response.json()) as EventType[];
        const foundEventType = data.find((item) => item.slug === requestedSlug) ?? null;

        if (!foundEventType) {
          setIsNotFound(true);
          setIsEventTypeLoading(false);
          return;
        }

        setEventType(foundEventType);
        setStatus('');
      } catch {
        setStatus(t('book.errors.loadEventTypesApi'));
      } finally {
        setIsEventTypeLoading(false);
      }
    };

    void loadEventType();
  }, [requestedSlug, t]);

  useEffect(() => {
    setSelectedDate('');
    setSelectedSlot('');
    setBookingStep('select');
    setSubmitError('');
    setNotes('');
    setCreatedBooking(null);

    if (!selectedEventTypeSlug) {
      setSlots([]);
      return;
    }

    void loadSlots(selectedEventTypeSlug);
  }, [selectedEventTypeSlug]);

  useEffect(() => {
    if (allDates.length === 0) {
      setSelectedDate('');
      return;
    }

    if (!allDates.includes(selectedDate)) {
      const firstDate = allDates[0];
      setSelectedDate(firstDate);
      setCurrentMonth(startOfMonthUtc(dateFromKey(firstDate)));
    }
  }, [allDates, selectedDate]);

  useEffect(() => {
    if (!selectedSlot) {
      return;
    }

    const hasSelectedSlot = selectedDateSlots.some((slotItem) => slotItem.startTime === selectedSlot);
    if (!hasSelectedSlot) {
      setSelectedSlot('');
      if (bookingStep !== 'success') {
        setBookingStep('select');
      }
    }
  }, [bookingStep, selectedDateSlots, selectedSlot]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    if (!selectedSlot) {
      setSubmitError(t('book.errors.noSlotSelected'));
      return;
    }

    if (!selectedEventTypeSlug) {
      setSubmitError(t('book.errors.noEventTypes'));
      return;
    }

    try {
      const response = await fetch(apiBookingsPath(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTypeSlug: selectedEventTypeSlug,
          startTime: selectedSlot,
          clientName,
          clientEmail,
          notes: notes.trim(),
        }),
      });

      if (response.ok) {
        const created = (await response.json()) as {
          eventTypeName?: string;
          startTime?: string;
          endTime?: string;
          notes?: string;
        };

        setStatus(t('book.success'));
        setSubmitError('');
        setCreatedBooking({
          eventTypeName: created.eventTypeName ?? eventType.name,
          startTime: created.startTime ?? selectedSlot,
          endTime: created.endTime ?? selectedSlotData?.endTime ?? selectedSlot,
          notes: created.notes ?? notes.trim(),
        });
        await loadSlots(selectedEventTypeSlug);
        setBookingStep('success');
        setClientName('');
        setClientEmail('');
        setNotes('');
        return;
      }

      const payload = (await response.json()) as BookingPayloadError;
      if (payload.error === 'invalid_payload' && payload.details && payload.details.length > 0) {
        setSubmitError(payload.details.join('. '));
        return;
      }

      setSubmitError(payload.error === 'slot_already_booked' ? t('book.errors.slotAlreadyBooked') : t('book.errors.bookingFailed'));
    } catch {
      setSubmitError(t('book.errors.bookingApiError'));
    }
  };

  const weekDays = t('book.calendar.weekDays', { returnObjects: true }) as string[];

  if (isEventTypeLoading) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground" data-testid="book-title">{t('book.title')}</h1>
        <Card>
          <p className="text-sm text-muted-foreground">{t('book.catalog.loading')}</p>
        </Card>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground" data-testid="book-title">{t('book.notFound.title')}</h1>
        <Card data-testid="book-not-found">
          <p className="text-sm text-muted-foreground">{t('book.notFound.description')}</p>
          <Link className="mt-4 inline-flex" to={bookPath()}>
            <Button type="button" variant="outline">{t('book.notFound.back')}</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (!eventType) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground" data-testid="book-title">{t('book.title')}</h1>
        <Card>
          <p className="text-sm text-muted-foreground">{status || t('book.errors.loadEventTypes')}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground" data-testid="book-title">{eventType.name}</h1>
      <div
        className={`grid gap-6 ${
          bookingStep === 'select'
            ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,1fr)]'
            : 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]'
        }`}
      >
        <Card>
          <BookHostProfile compact />
          <div className="mt-4 flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">{eventType.name}</h2>
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {eventType.durationMinutes} {t('book.slots.minutesSuffix')}
            </span>
          </div>
          <p className="mt-2 text-sm text-foreground">
            {eventType.description || t('book.info.noDescription')}
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <p className="rounded-xl bg-muted p-3" data-testid="info-selected-date">
              <span className="block text-muted-foreground">{t('book.info.selectedDate')}</span>
              <span className="mt-1 block font-medium text-foreground">
                {selectedDate ? formatDate(selectedDate) : t('book.info.noDate')}
              </span>
            </p>
            <p className="rounded-xl bg-muted p-3" data-testid="info-selected-time">
              <span className="block text-muted-foreground">{t('book.info.selectedTime')}</span>
              <span className="mt-1 block font-medium text-foreground">
                {selectedSlotData ? `${formatTime(selectedSlotData.startTime)} - ${formatTime(selectedSlotData.endTime)}` : t('book.info.noTime')}
              </span>
            </p>
          </div>
        </Card>

        {bookingStep === 'select' ? (
          <>
            <Card>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{t('book.calendar.heading')}</h2>
                <div className="flex items-center gap-2">
                  <Button
                    className="h-9 w-9 p-0"
                    data-testid="calendar-prev-month"
                    onClick={() => setCurrentMonth((month) => addMonthsUtc(month, -1))}
                    type="button"
                    variant="outline"
                  >
                    ←
                  </Button>
                  <Button
                    className="h-9 w-9 p-0"
                    data-testid="calendar-next-month"
                    onClick={() => setCurrentMonth((month) => addMonthsUtc(month, 1))}
                    type="button"
                    variant="outline"
                  >
                    →
                  </Button>
                </div>
              </div>

              <p className="mb-4 text-sm font-medium text-foreground">
                {currentMonth.toLocaleDateString('ru-RU', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </p>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
                {weekDays.map((dayName) => (
                  <div key={dayName} className="py-2">
                    {dayName}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const daySlots = slotsByDate[day.dateKey] ?? [];
                  const totalCount = daySlots.length;
                  const freeCount = daySlots.filter((slotItem) => slotItem.isAvailable).length;
                  const isDisabled = totalCount === 0;
                  const isSelected = selectedDate === day.dateKey;
                  const dayClassName = isDisabled
                    ? 'cursor-not-allowed border-border/50 bg-muted/60 text-muted-foreground'
                    : isSelected
                      ? 'border-primary bg-primary/10'
                      : day.inCurrentMonth
                        ? 'border-border hover:bg-muted'
                        : 'border-border/60 text-muted-foreground hover:bg-muted/50';

                  return (
                    <button
                      key={day.dateKey}
                      className={`flex min-h-[56px] flex-col items-center justify-center rounded-lg border px-1 py-2 text-sm transition ${dayClassName}`}
                      data-date={day.dateKey}
                      data-free-count={freeCount}
                      data-testid="calendar-day"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) {
                          return;
                        }
                        setSelectedDate(day.dateKey);
                        setSelectedSlot('');
                        setCurrentMonth(startOfMonthUtc(dateFromKey(day.dateKey)));
                        setSubmitError('');
                        setStatus('');
                        setBookingStep('select');
                      }}
                      type="button"
                    >
                      <span className="font-medium">{day.dayNumber}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {!isDisabled && freeCount > 0 ? `${freeCount} ${t('book.calendar.freeSuffix')}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card data-testid="slots-card">
              <h2 className="text-lg font-semibold">{t('book.slots.heading')}</h2>
              <div className="mt-4 grid max-h-[360px] gap-2 overflow-y-auto pr-1" data-testid="slots-list">
                {selectedDate ? (
                  selectedDateSlots.length > 0 ? (
                    selectedDateSlots.map((slotItem) => {
                      const isSelected = selectedSlot === slotItem.startTime;
                      return (
                        <button
                          key={slotItem.startTime}
                          className={`rounded-xl border p-3 text-left text-sm transition ${
                            isSelected && slotItem.isAvailable
                              ? 'border-primary bg-primary/10'
                              : slotItem.isAvailable
                                ? 'border-border hover:bg-muted'
                                : 'cursor-not-allowed border-border/70 bg-muted/50 text-muted-foreground'
                          }`}
                          data-available={slotItem.isAvailable}
                          data-start-time={slotItem.startTime}
                          data-testid="slot-button"
                          data-time={`${formatTime(slotItem.startTime)} - ${formatTime(slotItem.endTime)}`}
                          disabled={!slotItem.isAvailable}
                          onClick={() => {
                            setSelectedSlot(slotItem.startTime);
                            setSubmitError('');
                            setStatus('');
                          }}
                          type="button"
                        >
                          <div className="flex items-center justify-between">
                            <span>
                              {formatTime(slotItem.startTime)} - {formatTime(slotItem.endTime)}
                            </span>
                            <span className={`text-xs font-semibold ${slotItem.isAvailable ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {slotItem.isAvailable ? t('book.slots.available') : t('book.slots.booked')}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">
                      {t('book.slots.noSlots')}
                    </p>
                  )
                ) : (
                  <p className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">
                    {t('book.slots.selectDate')}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setSelectedSlot('');
                    setSubmitError('');
                    setStatus('');
                  }}
                  type="button"
                  variant="outline"
                >
                  {t('book.actions.back')}
                </Button>
                <Button
                  className="flex-1"
                  data-testid="continue-button"
                  disabled={!selectedSlot}
                  onClick={() => {
                    setSubmitError('');
                    setStatus('');
                    setBookingStep('confirm');
                  }}
                  type="button"
                >
                  {t('book.actions.continue')}
                </Button>
              </div>
            </Card>
          </>
        ) : bookingStep === 'confirm' ? (
          <Card data-testid="confirm-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" data-testid="confirm-heading">{t('book.confirm.heading')}</h2>
              <Button
                onClick={() => {
                  setSubmitError('');
                  setStatus('');
                  setBookingStep('select');
                }}
                type="button"
                variant="outline"
              >
                {t('book.actions.change')}
              </Button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input data-testid="name-input" onChange={(event) => setClientName(event.target.value)} placeholder={t('book.confirm.namePlaceholder')} required value={clientName} />
              <Input
                data-testid="email-input"
                onChange={(event) => setClientEmail(event.target.value)}
                placeholder={t('book.confirm.emailPlaceholder')}
                required
                type="email"
                value={clientEmail}
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="booking-notes">
                  {t('book.confirm.notesLabel')}
                </label>
                <textarea
                  className="min-h-[88px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="notes-input"
                  id="booking-notes"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t('book.confirm.notesPlaceholder')}
                  value={notes}
                />
              </div>
              <Button className="w-full" data-testid="submit-button" disabled={!selectedSlot} type="submit">
                {t('book.actions.submit')}
              </Button>
              {submitError ? <p className="text-sm text-red-600" data-testid="conflict-error">{submitError}</p> : null}
            </form>
          </Card>
        ) : (
          <Card className="bg-muted/50 text-center" data-testid="success-card">
            <p className="text-2xl font-semibold text-foreground" data-testid="success-message">{status || t('book.success')}</p>
            {createdBooking ? (
              <div className="mt-6 rounded-xl border border-border bg-background p-4 text-left">
                <p className="text-base font-semibold text-foreground">{t('book.successDetails.title')}</p>
                <p className="mt-3 text-sm text-foreground">
                  <span className="font-semibold">{t('book.successDetails.descriptionLabel')}:</span> {createdBooking.eventTypeName}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  <span className="font-semibold">{t('book.successDetails.whenLabel')}:</span>{' '}
                  {new Date(createdBooking.startTime).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}{' '}
                  • {formatTime(createdBooking.startTime)} - {formatTime(createdBooking.endTime)}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  <span className="font-semibold">{t('book.successDetails.notesLabel')}:</span>{' '}
                  {createdBooking.notes || t('book.successDetails.noNotes')}
                </p>
              </div>
            ) : null}
            <Button
              className="mt-6 w-full"
              data-testid="book-again-button"
              onClick={() => {
                setStatus('');
                setSubmitError('');
                setSelectedSlot('');
                setNotes('');
                setCreatedBooking(null);
                setBookingStep('select');
              }}
              type="button"
            >
              {t('book.actions.bookAgain')}
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
};
