"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { createClient, PHOTOS_BUCKET } from "@/lib/supabase/client";
import { deletePhoto, preparePhotoUpload, registerPhotos, setCoverPhoto } from "@/app/app/biens/photos-actions";
import type { PropertyPhoto } from "@/lib/property-types";

const MAX_SIDE = 2000;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/** Réduit la photo (2000 px max, JPEG) avant l'envoi : plus rapide et moins de stockage. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compression"))), "image/jpeg", 0.85),
  );
}

export function PhotoManager({ propertyId, photos }: { propertyId: string; photos: PropertyPhoto[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const prep = await preparePhotoUpload(propertyId);
    if (!prep.ok) return setError(prep.error);

    const list = Array.from(files).slice(0, prep.remaining);
    if (list.length === 0) return setError("Limite de 30 photos atteinte pour ce bien.");

    const supabase = createClient();
    const uploaded: string[] = [];
    const failed: string[] = [];
    setProgress({ done: 0, total: list.length });

    for (const file of list) {
      try {
        if (!file.type.startsWith("image/") || file.size > MAX_INPUT_BYTES) throw new Error("format");
        const blob = await compress(file);
        const path = `${prep.folder}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        uploaded.push(path);
      } catch {
        failed.push(file.name);
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    if (uploaded.length > 0) {
      const res = await registerPhotos(propertyId, uploaded);
      if (!res.ok) setError(res.error);
    }
    if (failed.length > 0) {
      setError(`${failed.length} photo${failed.length > 1 ? "s n'ont" : " n'a"} pas pu être ajoutée${failed.length > 1 ? "s" : ""} (formats acceptés : JPEG, PNG, WebP ; 25 Mo max).`);
    }
    if (files.length > list.length) {
      setError("Limite de 30 photos par bien : certaines photos n'ont pas été ajoutées.");
    }
    setProgress(null);
    if (input.current) input.current.value = "";
    startTransition(() => router.refresh());
  }

  async function run(id: string, action: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    setBusyId(id);
    setError(null);
    const res = await action(id);
    if (!res.ok) setError(res.error ?? "Action impossible.");
    setBusyId(null);
    startTransition(() => router.refresh());
  }

  const uploading = progress !== null;

  return (
    <section className="rounded-xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[17px] font-semibold">Photos</h2>
          <p className="mt-0.5 text-sm text-muted">{photos.length === 0 ? "Aucune photo" : `${photos.length} photo${photos.length > 1 ? "s" : ""} · la première est la photo principale`}</p>
        </div>
        <label className={clsx("flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600", uploading && "pointer-events-none opacity-60")}>
          {uploading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <ImagePlus aria-hidden className="size-4" />}
          {uploading ? `Envoi ${progress.done}/${progress.total}…` : "Ajouter des photos"}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="sr-only" disabled={uploading} onChange={(e) => upload(e.target.files)} />
        </label>
      </div>

      {error && <p role="alert" className="mx-5 mt-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</p>}

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="m-5 flex w-[calc(100%-2.5rem)] flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-12 text-center hover:bg-canvas"
        >
          <ImagePlus aria-hidden className="size-7 text-brand-600" strokeWidth={1.6} />
          <span className="font-semibold">Ajoutez les photos du bien</span>
          <span className="text-sm text-muted">Depuis votre ordinateur ou directement depuis votre téléphone.</span>
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <li key={photo.id} className={clsx("group relative overflow-hidden rounded-lg border border-line bg-canvas", i === 0 && "col-span-2 row-span-2")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire du stockage privé */}
              <img src={photo.url} alt={i === 0 ? "Photo principale du bien" : `Photo ${i + 1} du bien`} className="aspect-[4/3] h-full w-full object-cover" loading="lazy" />
              {i === 0 && <span className="absolute top-2 left-2 rounded-md bg-ink/75 px-2 py-1 text-xs font-semibold text-white">Photo principale</span>}
              <div className="absolute right-2 bottom-2 flex gap-1.5">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => run(photo.id, setCoverPhoto)}
                    disabled={busyId !== null}
                    aria-label={`Définir la photo ${i + 1} comme photo principale`}
                    title="Photo principale"
                    className="flex size-9 items-center justify-center rounded-lg bg-white/95 text-body shadow-xs hover:text-brand-700"
                  >
                    <Star aria-hidden className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Supprimer cette photo ?")) run(photo.id, deletePhoto);
                  }}
                  disabled={busyId !== null}
                  aria-label={`Supprimer la photo ${i + 1}`}
                  title="Supprimer"
                  className="flex size-9 items-center justify-center rounded-lg bg-white/95 text-body shadow-xs hover:text-danger-700"
                >
                  {busyId === photo.id ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Trash2 aria-hidden className="size-4" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
