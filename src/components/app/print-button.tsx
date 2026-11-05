"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Imprimer" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-body shadow-xs hover:bg-canvas print:hidden">
      <Printer aria-hidden className="size-4" />{label}
    </button>
  );
}
