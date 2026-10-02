// The backend stores due dates as midnight UTC (e.g. 2026-10-05T00:00:00.000Z),
// so we format them in UTC too. Otherwise users west of UTC would see the day before.
export function formatDueDate(isoString) {
  if (!isoString) return "No due date";
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// "2026-10-05T00:00:00.000Z" -> "2026-10-05" (what <input type="date"> needs)
export function toDateInputValue(isoString) {
  return isoString ? isoString.slice(0, 10) : "";
}
