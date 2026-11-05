"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMandateStatus } from "@/app/app/mandats/actions";
import { MANDATE_STATUS_LABEL, type MandateStatus as Status } from "@/lib/property-types";

export function MandateStatusSelect({ id, status, number }: { id: string; status: Status; number: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <label htmlFor={`st-${id}`} className="sr-only">Statut du mandat n° {number}</label>
      <select
        id={`st-${id}`}
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            setError(null);
            const res = await setMandateStatus(id, e.target.value as Status);
            if (!res.ok) setError(res.error);
            router.refresh();
          })
        }
        className="h-9 rounded-lg border border-line-strong bg-white px-2 text-sm print:border-0 print:bg-transparent print:p-0"
      >
        {(Object.keys(MANDATE_STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{MANDATE_STATUS_LABEL[s].label}</option>)}
      </select>
      {error && <span role="alert" className="block text-xs text-danger-700">{error}</span>}
    </>
  );
}
