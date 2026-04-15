import type { SlotConfig } from './config.js';

export const AVAILABILITY_DAYS = 14;

type CandidateSeed = {
  startTime: string;
  endTime: string;
};

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const toUtcIso = (date: string, hour: number, minute: number): string =>
  new Date(`${date}T${pad2(hour)}:${pad2(minute)}:00.000Z`).toISOString();

const dateByOffset = (baseDate: string, dayOffset: number): string => {
  const date = new Date(`${baseDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
};

export const addMinutesIso = (iso: string, minutes: number): string => {
  const date = new Date(iso);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
};

export const buildAvailabilityCandidates = (
  config: SlotConfig,
  durationMinutes: number,
): CandidateSeed[] => {
  const { startHour, endHour, baseDate } = config;
  const slots: CandidateSeed[] = [];

  for (let dayOffset = 0; dayOffset < AVAILABILITY_DAYS; dayOffset += 1) {
    const slotDate = dateByOffset(baseDate, dayOffset);
    let cursorMinutes = startHour * 60;
    const endMinutes = endHour * 60;

    while (cursorMinutes + durationMinutes <= endMinutes) {
      const startHourPart = Math.floor(cursorMinutes / 60);
      const startMinutePart = cursorMinutes % 60;
      const startTime = toUtcIso(slotDate, startHourPart, startMinutePart);

      slots.push({
        startTime,
        endTime: addMinutesIso(startTime, durationMinutes),
      });

      cursorMinutes += durationMinutes;
    }
  }

  return slots;
};

export const isIntervalsOverlapping = (
  leftStartIso: string,
  leftEndIso: string,
  rightStartIso: string,
  rightEndIso: string,
): boolean => leftStartIso < rightEndIso && leftEndIso > rightStartIso;
