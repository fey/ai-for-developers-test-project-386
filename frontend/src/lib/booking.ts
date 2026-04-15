export type EventType = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  publicUrl: string;
};

export type Slot = {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

export const dateKeyFromIso = (iso: string): string => iso.slice(0, 10);

export const dateKeyFromDate = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;

export const dateFromKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const startOfMonthUtc = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

export const addMonthsUtc = (date: Date, delta: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));

export const minutesBetween = (startIso: string, endIso: string): number =>
  Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60));

export const formatDate = (dateKey: string): string =>
  dateFromKey(dateKey).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

export const createCalendarDays = (monthStart: Date): CalendarDay[] => {
  const firstWeekDay = (monthStart.getUTCDay() + 6) % 7;
  const gridStartDate = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), 1 - firstWeekDay));

  return Array.from({ length: 42 }, (_, index) => {
    const currentDate = new Date(
      Date.UTC(gridStartDate.getUTCFullYear(), gridStartDate.getUTCMonth(), gridStartDate.getUTCDate() + index),
    );

    return {
      dateKey: dateKeyFromDate(currentDate),
      dayNumber: currentDate.getUTCDate(),
      inCurrentMonth: currentDate.getUTCMonth() === monthStart.getUTCMonth(),
    };
  });
};
