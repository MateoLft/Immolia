/** Contenu des e-mails envoyés à l'acquéreur : confirmation de visite et rappel. */

export type VisitEmailInput = {
  kind: "confirmation" | "rappel";
  buyerName: string | null;
  propertyTitle: string;
  propertyAddress: string | null;
  city: string;
  startsAt: Date;
  agentName: string;
  agentPhone: string | null;
  agencyName: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
const hmFmt = new Intl.DateTimeFormat("fr-FR", { hour: "numeric", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Paris" });

/** « mardi 17 novembre 2026 à 14 h 30 » */
export function whenLabel(d: Date): string {
  const parts = Object.fromEntries(hmFmt.formatToParts(d).map((p) => [p.type, p.value]));
  const time = parts.minute === "00" ? `${parts.hour} h` : `${parts.hour} h ${parts.minute}`;
  return `${dayFmt.format(d)} à ${time}`;
}

export function buildVisitEmail(i: VisitEmailInput): { subject: string; text: string; html: string } {
  const when = whenLabel(i.startsAt);
  const where = [i.propertyAddress, i.city].filter(Boolean).join(", ");
  const hello = i.buyerName ? `Bonjour ${i.buyerName.trim().split(/\s+/)[0]},` : "Bonjour,";
  const intro =
    i.kind === "confirmation"
      ? `Je vous confirme notre visite de « ${i.propertyTitle} ».`
      : `Petit rappel de notre visite de « ${i.propertyTitle} ».`;
  const subject = i.kind === "confirmation" ? `Confirmation de visite : ${i.propertyTitle}` : `Rappel : visite de ${i.propertyTitle}`;

  const details = [`Date : ${when}`, `Lieu : ${where}`];
  const outro = "Un empêchement ou un retard ? Répondez simplement à ce message" + (i.agentPhone ? ` ou appelez-moi au ${i.agentPhone}.` : ".");
  const signature = [i.agentName, i.agencyName].filter(Boolean).join(" – ");

  const text = [hello, "", intro, "", ...details, "", outro, "", "À bientôt,", signature, "", "Une invitation de calendrier est jointe à ce message."].join("\n");
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#1a1f2b">
<p>${esc(hello)}</p>
<p>${esc(intro)}</p>
<table style="border-collapse:collapse;margin:12px 0"><tr><td style="padding:4px 14px 4px 0;color:#667085">Date</td><td style="padding:4px 0"><strong>${esc(when)}</strong></td></tr>
<tr><td style="padding:4px 14px 4px 0;color:#667085">Lieu</td><td style="padding:4px 0"><strong>${esc(where)}</strong></td></tr></table>
<p>${esc(outro)}</p>
<p>À bientôt,<br>${esc(signature)}</p>
<p style="color:#667085;font-size:13px">Une invitation de calendrier est jointe à ce message.</p></div>`;
  return { subject, text, html };
}
