export const SHOP_TIME_ZONE =
  ((import.meta.env.VITE_SHOP_TIME_ZONE as string | undefined)?.trim() || 'Asia/Kolkata');

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  weekday: number;
};

function getPartsInTimeZone(date: Date, timeZone = SHOP_TIME_ZONE): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    millisecond: Number(parts.fractionalSecond || '0'),
    weekday: weekdayMap[parts.weekday] ?? 0,
  };
}

function getTimeZoneOffsetMinutes(date: Date, timeZone = SHOP_TIME_ZONE): number {
  const parts = getPartsInTimeZone(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
  return (asUtc - date.getTime()) / 60000;
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  timeZone = SHOP_TIME_ZONE,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMinutes * 60_000);
}

export function startOfTimeZoneDay(date: Date, timeZone = SHOP_TIME_ZONE): Date {
  const parts = getPartsInTimeZone(date, timeZone);
  return zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, 0, timeZone);
}

export function endOfTimeZoneDay(date: Date, timeZone = SHOP_TIME_ZONE): Date {
  const parts = getPartsInTimeZone(date, timeZone);
  return zonedTimeToUtc(parts.year, parts.month, parts.day, 23, 59, 59, 999, timeZone);
}

export function startOfTimeZoneWeek(date: Date, timeZone = SHOP_TIME_ZONE): Date {
  const parts = getPartsInTimeZone(date, timeZone);
  const localDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const day = parts.weekday;
  const diff = localDate.getUTCDate() - day + (day === 0 ? -6 : 1);
  localDate.setUTCDate(diff);
  return zonedTimeToUtc(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth() + 1,
    localDate.getUTCDate(),
    0,
    0,
    0,
    0,
    timeZone,
  );
}

export function formatTimeInTimeZone(iso: string, timeZone = SHOP_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function formatDateTimeInTimeZone(iso: string, timeZone = SHOP_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function getTimeZoneDayKey(date: Date, timeZone = SHOP_TIME_ZONE): string {
  const parts = getPartsInTimeZone(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}
