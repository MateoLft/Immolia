import clsx from "clsx";
import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "brand" | "neutral" | "danger";

const tones: Record<BadgeTone, { box: string; dot: string }> = {
  success: { box: "bg-success-50 text-success-700", dot: "bg-success-700" },
  warning: { box: "bg-warning-50 text-warning-700", dot: "bg-warning-700" },
  brand: { box: "bg-brand-50 text-brand-700", dot: "bg-brand-700" },
  neutral: { box: "bg-hover text-body", dot: "bg-body" },
  danger: { box: "bg-danger-50 text-danger-700", dot: "bg-danger-700" },
};

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone].box,
        className,
      )}
    >
      {dot && <span aria-hidden className={clsx("size-1.5 rounded-full", tones[tone].dot)} />}
      {children}
    </span>
  );
}
