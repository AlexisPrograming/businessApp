/**
 * Clearpath Finance — Date helpers for weekly range and transaction dates
 */

/**
 * Current week Monday 00:00:00 and Sunday 23:59:59
 */
export function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

/**
 * Parse "Mar 7" into Date using current year
 */
export function parseTxDate(dateStr) {
  if (!dateStr) return new Date();
  const year = new Date().getFullYear();
  const d = new Date(`${dateStr} ${year}`);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Format ISO date string to short display "Mar 7"
 */
export function formatShortDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Check if two ISO date strings are in the same calendar month
 */
export function isSameMonth(isoA, isoB) {
  if (!isoA || !isoB) return false;
  const a = new Date(isoA);
  const b = new Date(isoB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
