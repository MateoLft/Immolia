import clsx from "clsx";

/** Vignette d'un bien : sa photo principale, ou une couleur si le bien n'a pas encore de photo. */
export function PropertyThumb({ tint, src, className }: { tint: string; src?: string | null; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire du stockage privé
      <img src={src} alt="" className={clsx("block flex-none rounded-md object-cover", className)} loading="lazy" />
    );
  }
  return <span aria-hidden className={clsx("block flex-none rounded-md", className)} style={{ background: tint }} />;
}
