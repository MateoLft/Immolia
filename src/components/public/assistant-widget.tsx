"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { askAssistant } from "@/app/(public)/b/[slug]/assistant-actions";
import type { ChatTurn } from "@/lib/ai";

const SUGGESTIONS = ["Quelles sont les charges ?", "Le bien a-t-il un extérieur ?", "Comment organiser une visite ?"];

export function AssistantWidget({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const list = useRef<HTMLDivElement>(null);

  function ask(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    const next: ChatTurn[] = [...turns, { role: "user", text: q }];
    setTurns(next);
    setInput("");
    setError(null);
    start(async () => {
      const r = await askAssistant(slug, next);
      if (r.ok) setTurns([...next, { role: "assistant", text: r.text }]);
      else {
        setError(r.error);
        setTurns(turns);
      }
      setTimeout(() => list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }), 50);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fixed right-4 bottom-4 z-40 flex h-12 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-pop hover:bg-brand-700">
        <MessageCircle aria-hidden className="size-5" />Une question sur ce bien ?
      </button>
    );
  }

  return (
    <section aria-label="Assistant de l'annonce" className="fixed right-4 bottom-4 z-40 flex h-[min(560px,calc(100vh-2rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Assistant de l&apos;annonce</p>
          <p className="text-xs text-subtle">Réponses automatiques à partir de l&apos;annonce</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Fermer l'assistant" className="flex size-9 items-center justify-center rounded-lg hover:bg-hover">
          <X aria-hidden className="size-5" />
        </button>
      </header>
      <div ref={list} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-hover px-3.5 py-2.5 text-sm">Bonjour ! Posez-moi vos questions sur ce bien.</p>
        {turns.map((t, i) => (
          <p key={i} className={t.role === "user" ? "max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2.5 text-sm text-white" : "max-w-[85%] rounded-2xl rounded-tl-sm bg-hover px-3.5 py-2.5 text-sm whitespace-pre-line"}>
            {t.text}
          </p>
        ))}
        {pending && <Loader2 aria-label="Réponse en cours" className="size-5 animate-spin text-muted" />}
        {turns.length === 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-line-strong px-3 py-1.5 text-[13px] text-body hover:bg-canvas">{s}</button>
            ))}
          </div>
        )}
        {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <label htmlFor="assistant-input" className="sr-only">Votre question</label>
        <input id="assistant-input" value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder="Votre question…" className="h-11 min-w-0 flex-1 rounded-lg border border-line-strong px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
        <button type="submit" disabled={pending || !input.trim()} aria-label="Envoyer" className="flex size-11 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50">
          <Send aria-hidden className="size-4" />
        </button>
      </form>
      <p className="px-3 pb-2 text-[11px] text-subtle">Assistant automatique : seul l&apos;agent peut s&apos;engager pour l&apos;agence.</p>
    </section>
  );
}
