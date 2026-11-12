"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="text-muted">Vos données ne sont pas perdues. Réessayez, et si le problème persiste, rechargez la page.</p>
      <Button onClick={() => reset()}>Réessayer</Button>
    </main>
  );
}
