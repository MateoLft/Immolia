"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Mail, UserPlus } from "lucide-react";
import { inviteMember, revokeInvitation, updateMember } from "@/app/app/equipe/actions";
import { ROLE_LABEL, type Invitation, type Member, type MemberRole } from "@/lib/property-types";

const input = "h-10 rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";
const btn = "flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Action impossible.");
      router.refresh();
    });
  return { pending, error, setError, run, start, router };
}

export function InviteForm({ canInviteManager, agencyName, inviterName }: { canInviteManager: boolean; agencyName: string; inviterName: string }) {
  const { pending, error, setError, start, router } = useRun();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("agent");
  const [link, setLink] = useState<{ url: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const message = link
    ? `Bonjour,\n\n${inviterName} vous invite à rejoindre l'équipe ${agencyName} sur Immolia.\n\nCréez votre compte avec ce lien (valable 14 jours) :\n${link.url}\n\nÀ bientôt !`
    : "";

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-[17px] font-semibold">Inviter un membre</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setLink(null);
          start(async () => {
            const r = await inviteMember(email, role);
            if (r.ok) {
              setLink({ url: r.link, email });
              setEmail("");
            } else setError(r.error);
            router.refresh();
          });
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-medium text-body">
          Email professionnel
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
          Rôle
          <select value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className={input}>
            <option value="agent">Agent</option>
            {canInviteManager && <option value="manager">Manager</option>}
          </select>
        </label>
        <button type="submit" disabled={pending} className="flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <UserPlus aria-hidden className="size-4" />}Créer l&apos;invitation
        </button>
      </form>
      {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
      {link && (
        <div role="status" className="flex flex-col gap-2 rounded-lg bg-success-50 p-4 text-sm text-success-700">
          <p className="font-semibold">Invitation créée pour {link.email}. Envoyez-lui ce lien :</p>
          <p className="break-all text-ink">{link.url}</p>
          <div className="flex flex-wrap gap-2">
            <a href={`mailto:${link.email}?subject=${encodeURIComponent(`Rejoignez ${agencyName} sur Immolia`)}&body=${encodeURIComponent(message)}`} className={btn}>
              <Mail aria-hidden className="size-4" />Envoyer par email
            </a>
            <button
              type="button"
              className={btn}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* le lien reste sélectionnable */
                }
              }}
            >
              {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}Copier le lien
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function MemberControls({ member, isOwner, isSelf }: { member: Member; isOwner: boolean; isSelf: boolean }) {
  const { pending, error, run } = useRun();
  if (!isOwner || isSelf || member.role === "owner") return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`role-${member.id}`}>Rôle de {member.fullName}</label>
      <select
        id={`role-${member.id}`}
        defaultValue={member.role}
        disabled={pending || !member.active}
        onChange={(e) => run(() => updateMember(member.id, { role: e.target.value }))}
        className={input}
      >
        <option value="agent">{ROLE_LABEL.agent}</option>
        <option value="manager">{ROLE_LABEL.manager}</option>
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (member.active && !confirm(`Désactiver l'accès de ${member.fullName} ? Ses biens et son historique restent dans l'agence.`)) return;
          run(() => updateMember(member.id, { active: !member.active }));
        }}
        className={btn}
      >
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {member.active ? "Désactiver" : "Réactiver"}
      </button>
      {error && <p role="alert" className="w-full text-sm text-danger-700">{error}</p>}
    </div>
  );
}

export function RevokeInvitationButton({ invitation }: { invitation: Invitation }) {
  const { pending, error, run } = useRun();
  return (
    <>
      <button type="button" disabled={pending} onClick={() => run(() => revokeInvitation(invitation.id))} className={btn}>Annuler</button>
      {error && <span role="alert" className="text-sm text-danger-700">{error}</span>}
    </>
  );
}
