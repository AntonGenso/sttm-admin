const DATE = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Renders a timestamp, or an em dash when the API sent none. */
export const formatDate = (value?: string | null) =>
  value ? DATE.format(new Date(value)) : "—";

export const formatDateTime = (value?: string | null) =>
  value ? DATE_TIME.format(new Date(value)) : "—";

/**
 * Missions are scheduled in Tashkent time, whatever the admin's own timezone
 * is: the academy runs there, and a lesson that opens "1 сентября в 09:00"
 * means 09:00 in Tashkent for everyone. The API stores and returns UTC, so the
 * conversion happens here, at the edges of the form.
 */
export const MISSION_TIMEZONE = "Asia/Tashkent";

const OPENS_AT = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: MISSION_TIMEZONE,
});

/** The instant's wall-clock fields in Tashkent, as numbers. */
const tashkentParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: MISSION_TIMEZONE,
  }).formatToParts(date);

  const field = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  // `hour12: false` renders midnight as 24 in some engines; 24:00 is 00:00.
  const hour = field("hour") % 24;
  return {
    year: field("year"),
    month: field("month"),
    day: field("day"),
    hour,
    minute: field("minute"),
    second: field("second"),
  };
};

const pad = (value: number) => String(value).padStart(2, "0");

/** UTC timestamp from the API → the `datetime-local` value the form shows. */
export const toDateTimeLocal = (value?: string | null): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const { year, month, day, hour, minute } = tashkentParts(date);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
};

/**
 * The `datetime-local` value back to a UTC ISO string. The input carries no
 * offset, so it is read as Tashkent wall time: the naive UTC reading is shifted
 * by however far Tashkent sits from UTC at that moment.
 */
export const fromDateTimeLocal = (value: string): string => {
  if (!value) {
    return "";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) {
    return "";
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const naive = Date.UTC(year, month - 1, day, hour, minute);

  const { year: y, month: mo, day: d, hour: h, minute: mi, second: s } =
    tashkentParts(new Date(naive));
  const offset = Date.UTC(y, mo - 1, d, h, mi, s) - naive;

  return new Date(naive - offset).toISOString();
};

/** «01.09.2025, 09:00» — the opening moment as Tashkent reads it. */
export const formatOpensAt = (value?: string | null) =>
  value ? OPENS_AT.format(new Date(value)) : "—";

/** Whether the mission is still waiting for its opening date. */
export const isUpcoming = (value?: string | null): boolean =>
  Boolean(value) && new Date(value as string).getTime() > Date.now();
