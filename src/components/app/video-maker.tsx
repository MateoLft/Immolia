"use client";

import { useRef, useState } from "react";
import { Download, Film, Loader2 } from "lucide-react";
import clsx from "clsx";

type Photo = { id: string; url: string };
const W = 1080;
const H = 1920;
const FPS = 30;
const PER_PHOTO = 2.6; // secondes par photo
const FADE = 0.45;

function pickMime() {
  const candidates = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return candidates.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) ?? "";
}

function load(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, zoom: number, alpha: number) {
  const scale = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  ctx.globalAlpha = 1;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function VideoMaker({ photos, title, subtitle, price, contact }: { photos: Photo[]; title: string; subtitle: string; price: string | null; contact: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string[]>(photos.slice(0, 6).map((p) => p.id));
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{ url: string; ext: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function render() {
    setError(null);
    setResult(null);
    const mime = pickMime();
    if (!mime || !canvas.current?.captureStream) return setError("Votre navigateur ne permet pas de créer la vidéo. Essayez avec Chrome, Edge ou Safari récent.");
    const chosen = photos.filter((p) => selected.includes(p.id));
    if (chosen.length < 2) return setError("Choisissez au moins 2 photos.");

    let images: HTMLImageElement[];
    try {
      images = await Promise.all(chosen.map((p) => load(p.url)));
    } catch {
      return setError("Les photos n'ont pas pu être chargées. Rechargez la page et réessayez.");
    }

    const c = canvas.current;
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const stream = c.captureStream(FPS);
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<void>((r) => (recorder.onstop = () => r()));

    const outro = 3;
    const total = images.length * PER_PHOTO + outro;
    recorder.start(250);
    const t0 = performance.now();

    await new Promise<void>((resolve) => {
      const frame = () => {
        const t = (performance.now() - t0) / 1000;
        if (t >= total) return resolve();
        ctx.fillStyle = "#101828";
        ctx.fillRect(0, 0, W, H);

        const slideT = Math.min(t, images.length * PER_PHOTO - 0.001);
        const i = Math.floor(slideT / PER_PHOTO);
        const local = slideT - i * PER_PHOTO;
        drawCover(ctx, images[i], 1 + 0.08 * (local / PER_PHOTO), 1);
        if (local > PER_PHOTO - FADE && i + 1 < images.length) {
          drawCover(ctx, images[i + 1], 1, (local - (PER_PHOTO - FADE)) / FADE);
        }

        ctx.textAlign = "left";
        if (t < PER_PHOTO * 1.5) {
          // Titre sur la première photo
          ctx.fillStyle = "rgba(16,24,40,0.72)";
          ctx.fillRect(60, H - 560, W - 120, 440);
          ctx.fillStyle = "#ffffff";
          ctx.font = "700 78px Inter, system-ui, sans-serif";
          wrapText(ctx, title, W - 220).forEach((l, k) => ctx.fillText(l, 110, H - 450 + k * 92));
          ctx.font = "500 46px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#D0D5DD";
          ctx.fillText(subtitle, 110, H - 175);
        } else if (t < images.length * PER_PHOTO) {
          if (price) {
            ctx.font = "700 64px Inter, system-ui, sans-serif";
            const w = ctx.measureText(price).width;
            ctx.fillStyle = "#C8F560";
            ctx.fillRect(60, 120, w + 100, 120);
            ctx.fillStyle = "#0B0F17";
            ctx.fillText(price, 110, 202);
          }
        } else {
          // Fin : appel à l'action
          ctx.fillStyle = "rgba(16,24,40,0.82)";
          ctx.fillRect(0, 0, W, H);
          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.font = "700 84px Inter, system-ui, sans-serif";
          ctx.fillText("Envie de visiter ?", W / 2, H / 2 - 60);
          ctx.font = "500 50px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#D0D5DD";
          wrapText(ctx, contact, W - 200).forEach((l, k) => ctx.fillText(l, W / 2, H / 2 + 50 + k * 64));
        }
        setProgress(Math.min(100, Math.round((t / total) * 100)));
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });

    recorder.stop();
    await done;
    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    setResult({ url: URL.createObjectURL(blob), ext: mime.includes("mp4") ? "mp4" : "webm" });
    setProgress(null);
  }

  const busy = progress !== null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-[17px] font-semibold">Photos de la vidéo</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-muted">Ajoutez des photos sur la fiche du bien pour créer une vidéo.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p, i) => {
              const on = selected.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Photo ${i + 1}`}
                    disabled={busy}
                    onClick={() => setSelected((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                    className={clsx("relative block w-full overflow-hidden rounded-lg border-2", on ? "border-brand-600" : "border-transparent opacity-50")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire */}
                    <img src={p.url} alt="" className="aspect-[3/4] w-full object-cover" crossOrigin="anonymous" />
                    {on && <span className="absolute top-1 left-1 rounded bg-brand-600 px-1.5 text-xs font-bold text-white">{selected.indexOf(p.id) + 1}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-subtle">Format vertical 1080 × 1920 (Reels, TikTok, Stories), environ {Math.round(selected.length * PER_PHOTO + 3)} secondes. La vidéo est créée dans votre navigateur : laissez l&apos;onglet ouvert pendant l&apos;enregistrement.</p>
        <button type="button" onClick={render} disabled={busy || photos.length === 0} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Film aria-hidden className="size-4" />}
          {busy ? `Création… ${progress} %` : "Créer la vidéo"}
        </button>
        {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
      </section>

      <section className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white p-5 shadow-card">
        <canvas ref={canvas} aria-label="Aperçu de la vidéo" className={clsx("aspect-[9/16] w-full max-w-[260px] rounded-lg bg-canvas", result && "hidden")} />
        {result && (
          <>
            <video src={result.url} controls playsInline className="aspect-[9/16] w-full max-w-[260px] rounded-lg bg-canvas" />
            <a href={result.url} download={`video-bien.${result.ext}`} className="flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700">
              <Download aria-hidden className="size-4" />Télécharger ({result.ext.toUpperCase()})
            </a>
            {result.ext === "webm" && <p className="text-center text-xs text-subtle">Format WebM : certains réseaux sociaux demandent du MP4. Safari et les versions récentes de Chrome créent directement du MP4.</p>}
          </>
        )}
      </section>
    </div>
  );
}
