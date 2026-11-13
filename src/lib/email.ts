import "server-only";

/**
 * Envoi d'e-mails via Resend (https://resend.com).
 * Variables d'environnement (côté serveur uniquement) :
 *   RESEND_API_KEY  clé secrète Resend
 *   MAIL_FROM       adresse d'expédition d'un domaine vérifié chez Resend (ex. rendez-vous@votredomaine.fr)
 */

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export type EmailResult = { ok: true } | { ok: false; error: string; notConfigured?: boolean };

/** Nom affiché de l'expéditeur : sans caractère pouvant casser l'en-tête. */
const displayName = (s: string) => s.replace(/[<>"\r\n,;:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Immolia";

export async function sendEmail(input: {
  to: string;
  fromName: string;
  replyTo?: string | null;
  subject: string;
  text: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) return { ok: false, notConfigured: true, error: "L'envoi d'e-mails n'est pas encore configuré." };
  if (!/^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(input.to)) return { ok: false, error: "Adresse e-mail de l'acquéreur invalide." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${displayName(input.fromName)} <${from}>`,
        to: [input.to],
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        subject: input.subject.replace(/[\r\n]+/g, " ").slice(0, 200),
        text: input.text,
        html: input.html,
        ...(input.attachments ? { attachments: input.attachments } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error("Envoi d'e-mail refusé", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return { ok: false, error: "Le service d'e-mails a refusé l'envoi. Vérifiez l'adresse de l'acquéreur et la configuration." };
    }
    return { ok: true };
  } catch (e) {
    console.error("Envoi d'e-mail impossible", e instanceof Error ? e.message : e);
    return { ok: false, error: "Le service d'e-mails ne répond pas. Réessayez dans un instant." };
  }
}
