"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eraser, Loader2 } from "lucide-react";
import { saveVoucherSignature } from "@/app/app/visites/actions";

export function SignaturePad({ visitId, defaultName }: { visitId: string; defaultName: string }) {
  const router = useRouter();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);
  const [name, setName] = useState(defaultName);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#101828";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function clear() {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
  }

  function submit() {
    setError(null);
    if (empty) return setError("Faites signer l'acquéreur dans le cadre.");
    if (!agree) return setError("Cochez la case de reconnaissance de visite.");
    const dataUrl = canvas.current!.toDataURL("image/png");
    start(async () => {
      const r = await saveVoucherSignature(visitId, name, dataUrl);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Nom du signataire
        <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-lg border border-line-strong px-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
      </label>
      <div>
        <p className="mb-1.5 text-sm font-medium text-body" id="sig-label">Signature (avec le doigt ou la souris)</p>
        <canvas
          ref={canvas}
          aria-labelledby="sig-label"
          className="h-48 w-full touch-none rounded-lg border-2 border-dashed border-line-strong"
          style={{ background: "#FFFFFF" }}
          onPointerDown={(e) => {
            drawing.current = true;
            const ctx = canvas.current!.getContext("2d")!;
            const p = pos(e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            canvas.current!.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvas.current!.getContext("2d")!;
            const p = pos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            setEmpty(false);
          }}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
        />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-body">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-brand-600" />
        <span>Je reconnais avoir visité ce bien par l&apos;intermédiaire de l&apos;agence et m&apos;engage à ne pas traiter directement ou par un autre intermédiaire avec le propriétaire.</span>
      </label>
      {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={clear} className="flex h-11 items-center gap-2 rounded-lg border border-line-strong px-4 text-sm font-semibold text-body shadow-xs hover:bg-canvas">
          <Eraser aria-hidden className="size-4" />Effacer
        </button>
        <button type="button" disabled={pending} onClick={submit} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}Valider la signature
        </button>
      </div>
    </div>
  );
}
