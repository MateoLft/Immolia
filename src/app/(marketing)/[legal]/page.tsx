import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";

const PAGES: Record<string, string> = {
  "mentions-legales": "Mentions légales",
  confidentialite: "Politique de confidentialité",
  cgv: "Conditions générales de vente",
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((legal) => ({ legal }));
}

export async function generateMetadata({ params }: PageProps<"/[legal]">) {
  const { legal } = await params;
  return { title: PAGES[legal] };
}

export default async function LegalPage({ params }: PageProps<"/[legal]">) {
  const { legal } = await params;
  const title = PAGES[legal];
  if (!title) notFound();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <Logo />
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted">[À RÉDIGER avant le lancement commercial — à faire valider par un juriste.]</p>
    </div>
  );
}
