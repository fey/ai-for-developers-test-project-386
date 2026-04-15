export type SlotConfig = {
  startHour: number;
  endHour: number;
  slotDurationMinutes: number;
  baseDate: string;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const tomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
};

export const getSlotConfig = (env: NodeJS.ProcessEnv): SlotConfig => ({
  startHour: parseNumber(env.SLOT_START_HOUR, 9),
  endHour: parseNumber(env.SLOT_END_HOUR, 18),
  slotDurationMinutes: parseNumber(env.SLOT_DURATION_MINUTES, 30),
  baseDate: env.SLOT_BASE_DATE ?? tomorrowDate(),
});
