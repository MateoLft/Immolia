import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-brand-700">Erreur 404</p>
      <h1 className="text-2xl font-semibold">Cette page est introuvable</h1>
      <p className="text-muted">Le lien est peut-être incorrect, ou l&apos;annonce n&apos;est plus publiée.</p>
      <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
    </main>
  );
}
