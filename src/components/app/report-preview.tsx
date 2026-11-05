"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

export function ReportPreview({ subject, text, email }: { subject: string; text: string; email: string | null }) {
  const [copied, setCopied] = useState(false);
  const btn = "flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas";
  return (
    <div className="flex flex-col gap-3">
      <pre className="max-h-96 overflow-auto rounded-lg border border-line bg-canvas p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-body">{text}</pre>
      <div className="flex flex-wrap gap-2">
        {email ? (
          <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`} className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-700">
            <Mail aria-hidden className="size-4" />Envoyer par email
          </a>
        ) : (
          <span className="text-sm text-muted">Ajoutez l&apos;email du vendeur pour l&apos;envoyer.</span>
        )}
        <button
          type="button"
          className={btn}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${subject}\n\n${text}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* copie refusée : le texte reste sélectionnable */
            }
          }}
        >
          {copied ? <Check aria-hidden className="size-4 text-success-700" /> : <Copy aria-hidden className="size-4" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
    </div>
  );
}
