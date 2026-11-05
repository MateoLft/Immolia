import clsx from "clsx";

const CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const;
const COLORS: Record<string, string> = {
  A: "#009C6D",
  B: "#52B153",
  C: "#78BD76",
  D: "#F4E70F",
  E: "#F0B40F",
  F: "#EB8235",
  G: "#D7221F",
};
const DARK_TEXT = new Set(["B", "C", "D", "E", "F"]);

/** Étiquette énergie / climat (DPE, GES), obligatoire dans les annonces. */
export function EnergyLabel({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{title}</p>
      {value ? (
        <div role="img" aria-label={`${title} : classe ${value}`} className="flex gap-1">
          {CLASSES.map((c) => (
            <span
              key={c}
              aria-hidden
              className={clsx(
                "flex h-8 flex-1 items-center justify-center rounded text-sm font-bold",
                c === value ? "scale-110 ring-2 ring-ink" : "opacity-35",
                DARK_TEXT.has(c) ? "text-ink" : "text-white",
              )}
              style={{ background: COLORS[c] }}
            >
              {c}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Non communiqué</p>
      )}
    </div>
  );
}
