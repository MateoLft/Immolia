import { PORTALS } from "./portals";
import { formatNumber, type Listing, type Property, type Visit } from "./property-types";

const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const short = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

/** Rapport hebdomadaire au vendeur, à partir des données déjà présentes dans Immolia. */
export function buildSellerReport({
  property,
  visits,
  listings,
  sellerName,
  agentName,
  agencyName,
  now = new Date(),
  days = 7,
}: {
  property: Property;
  visits: Visit[];
  listings: Listing[];
  sellerName: string;
  agentName: string;
  agencyName: string;
  now?: Date;
  days?: number;
}) {
  const since = new Date(now.getTime() - days * 86_400_000);
  const inPeriod = visits.filter((v) => v.status === "realisee" && new Date(v.startsAt) >= since && new Date(v.startsAt) <= now);
  const upcoming = visits.filter((v) => v.status === "prevue" && new Date(v.startsAt) > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const totalDone = visits.filter((v) => v.status === "realisee").length;
  const live = listings.filter((l) => l.status === "publie").map((l) => PORTALS.find((p) => p.id === l.portal)?.name ?? l.portal);
  const firstName = sellerName.split(/\s+/)[0];

  const lines: string[] = [
    `Bonjour ${firstName},`,
    "",
    `Voici le point sur votre bien « ${property.title} » pour la période du ${short.format(since)} au ${short.format(now)}.`,
    "",
    "EN CHIFFRES",
    `• ${formatNumber(property.views)} consultation${property.views > 1 ? "s" : ""} de l'annonce en ligne depuis sa publication`,
    `• ${inPeriod.length} visite${inPeriod.length > 1 ? "s" : ""} cette semaine (${totalDone} au total)`,
    `• ${upcoming.length} visite${upcoming.length > 1 ? "s" : ""} programmée${upcoming.length > 1 ? "s" : ""}`,
  ];
  if (live.length > 0) lines.push(`• Annonce diffusée sur : ${live.join(", ")}`);

  const withFeedback = inPeriod.filter((v) => v.feedback);
  if (withFeedback.length > 0) {
    lines.push("", "RETOURS DES VISITEURS");
    for (const v of withFeedback) lines.push(`• ${day.format(new Date(v.startsAt))} : ${v.feedback!.replace(/\s+/g, " ").trim()}`);
  }
  if (upcoming.length > 0) {
    lines.push("", "PROCHAINES VISITES");
    for (const v of upcoming.slice(0, 5)) lines.push(`• ${day.format(new Date(v.startsAt))}`);
  }
  lines.push("", "Je reste à votre disposition pour en parler.", "", `${agentName}`, agencyName);

  return {
    subject: `Votre bien « ${property.title} » : le point de la semaine`,
    text: lines.join("\n"),
    stats: { views: property.views, visitsInPeriod: inPeriod.length, totalDone, upcoming: upcoming.length },
  };
}
