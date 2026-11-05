import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Export du registre des mandats (CSV séparé par des points-virgules, lisible par Excel). */
export async function GET() {
  if (!isSupabaseConfigured) return new Response("Indisponible en mode démo", { status: 404 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new Response("Non connecté", { status: 401 });

  const { data } = await supabase.from("mandates").select("*").order("number");
  const header = ["N°", "Date de signature", "Mandant", "Bien", "Type", "Date de fin", "Prix (€)", "Honoraires", "Statut", "Notes"];
  const rows = (data ?? []).map((m) =>
    [m.number, m.signed_on, m.seller_name, m.property_label, m.type, m.ends_on, m.price_eur, m.fee_text, m.status, m.notes].map(esc).join(";"),
  );
  const csv = "﻿" + [header.join(";"), ...rows].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registre-des-mandats.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
