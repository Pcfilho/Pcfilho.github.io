// Pure, DST-safe clock formatting. Uses Intl.DateTimeFormat with an IANA time
// zone instead of a manual getTimezoneOffset() round-trip, so the displayed
// time stays correct for visitors near their own DST transition.
export function formatClock(date, timeZone, label) {
  const hhmm = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date);
  return `${hhmm} ${label}`;
}
