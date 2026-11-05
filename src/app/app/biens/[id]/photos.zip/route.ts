import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Toutes les photos d'un bien, dans l'ordre, dans un fichier ZIP (01.jpg, 02.jpg…). */
export async function GET(_req: Request, ctx: RouteContext<"/app/biens/[id]/photos.zip">) {
  const { id } = await ctx.params;
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Introuvable", { status: 404 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new Response("Non connecté", { status: 401 });

  // RLS : seules les photos de l'agence de l'utilisateur sont renvoyées.
  const { data: photos } = await supabase
    .from("property_photos")
    .select("storage_path, position")
    .eq("property_id", id)
    .order("position");
  if (!photos || photos.length === 0) return new Response("Aucune photo", { status: 404 });

  const zip = new JSZip();
  await Promise.all(
    photos.map(async (p, i) => {
      const { data } = await supabase.storage.from("property-photos").download(p.storage_path);
      if (data) zip.file(`${String(i + 1).padStart(2, "0")}.jpg`, await data.arrayBuffer());
    }),
  );
  const body = await zip.generateAsync({ type: "uint8array", compression: "STORE" });

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="photos-bien.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
