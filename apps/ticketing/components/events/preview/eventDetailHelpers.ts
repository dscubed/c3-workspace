import { format, parseISO } from "date-fns";

export function formatTime12(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatDateFull(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE do MMMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const s = formatTime12(startTime);
  const e = formatTime12(endTime);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return "All day";
}

export function getTzAbbrev(timezone: string): string {
  if (!timezone) return "";
  try {
    const parts = new Date()
      .toLocaleString("en-AU", { timeZone: timezone, timeZoneName: "short" })
      .split(/\s/);
    return parts[parts.length - 1] ?? "";
  } catch {
    return "";
  }
}
