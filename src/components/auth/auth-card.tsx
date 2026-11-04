import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 py-12">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-line bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="text-center text-sm text-muted">{footer}</p>
        <p className="text-center text-xs text-subtle">
          <Link href="/" className="hover:text-ink">Retour au site</Link>
        </p>
      </div>
    </div>
  );
}

export function Field({ label, type = "text", name, autoComplete }: { label: string; type?: string; name: string; autoComplete?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
      {label}
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        required
        className="h-11 rounded-lg border border-line-strong px-3.5 text-[15px] text-ink shadow-xs outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
      />
    </label>
  );
}
