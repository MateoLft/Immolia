import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/app/coming-soon";
import { MODULES, getModule } from "@/lib/modules";

export function generateStaticParams() {
  // Ces modules ont leurs propres pages.
  return MODULES.filter((m) => !["biens", "studio"].includes(m.slug)).map((m) => ({ module: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/app/[module]">) {
  const { module } = await params;
  return { title: getModule(module)?.name ?? "Module" };
}

export default async function ModulePage({ params }: PageProps<"/app/[module]">) {
  const { module } = await params;
  const mod = getModule(module);
  if (!mod) notFound();
  return <ComingSoon title={mod.name} description={mod.description} plan={mod.plan} />;
}
