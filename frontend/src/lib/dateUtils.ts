export function datetimeLocalToISO(datetimeLocal: string): string | null {
  if (!datetimeLocal) return null;
  const [datePart, timePart] = datetimeLocal.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const d = new Date(year, month - 1, day, hours, minutes);

  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absOffset = Math.abs(offset);
  const offsetH = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const offsetM = String(absOffset % 60).padStart(2, "0");

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${datePart}T${pad(hours)}:${pad(minutes)}:00.000${sign}${offsetH}:${offsetM}`;
}

export function formatDateTime(date: Date | null, locale: string): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateTimeLocal(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
