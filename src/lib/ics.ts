/** Invitation de calendrier (.ics) pour une visite : s'ouvre dans Google Agenda, Outlook, Apple Calendrier. */

const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Les lignes d'un .ics ne dépassent pas 75 caractères : la suite commence par un espace. */
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

export function visitIcs(v: {
  uid: string;
  startsAt: Date;
  durationMinutes?: number;
  summary: string;
  location?: string | null;
  description?: string | null;
  now?: Date;
}): string {
  const end = new Date(v.startsAt.getTime() + (v.durationMinutes ?? 45) * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Immolia//Visites//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${v.uid}@immolia`,
    `DTSTAMP:${stamp(v.now ?? new Date())}`,
    `DTSTART:${stamp(v.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(v.summary)}`,
    ...(v.location ? [`LOCATION:${escapeText(v.location)}`] : []),
    ...(v.description ? [`DESCRIPTION:${escapeText(v.description)}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(v.summary)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
