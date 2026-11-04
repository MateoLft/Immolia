import clsx from "clsx";

/** Vignette en attendant les vraies photos (stockage Supabase). */
export function PropertyThumb({ tint, className }: { tint: string; className?: string }) {
  return <span aria-hidden className={clsx("block flex-none rounded-md", className)} style={{ background: tint }} />;
}
