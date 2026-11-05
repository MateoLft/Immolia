import { Mail, MessageCircle, Smartphone } from "lucide-react";
import { whatsappNumber } from "@/lib/buyers";

/** Liens pour envoyer un bien à un acquéreur depuis la messagerie de l'agent (gratuit). */
export function SendProperty({ email, phone, subject, message }: { email: string | null; phone: string | null; subject: string; message: string }) {
  const link = "flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas";
  if (!email && !phone) return <span className="text-sm text-muted">Pas de coordonnées</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {email && (
        <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`} className={link}>
          <Mail aria-hidden className="size-4" />Email
        </a>
      )}
      {phone && (
        <>
          <a href={`https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={link}>
            <MessageCircle aria-hidden className="size-4" />WhatsApp
          </a>
          <a href={`sms:${phone.replace(/\s/g, "")}?&body=${encodeURIComponent(message)}`} className={link}>
            <Smartphone aria-hidden className="size-4" />SMS
          </a>
        </>
      )}
    </div>
  );
}
