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
