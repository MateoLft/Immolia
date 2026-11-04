import Link from "next/link";
import { AuthCard, Field } from "@/components/auth/auth-card";

export const metadata = { title: "Connexion" };

// TODO(auth) : brancher Supabase Auth (étape « Socle » de ROADMAP.md).
export default function SignInPage() {
  return (
    <AuthCard
      title="Bon retour parmi nous"
      subtitle="Connectez-vous à votre espace Immolia."
      footer={<>Pas encore de compte ? <Link href="/inscription" className="font-semibold text-brand-700">Démarrer l&apos;essai</Link></>}
    >
      <form className="flex flex-col gap-4">
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" />
        <button type="submit" disabled className="mt-2 h-11 rounded-lg bg-brand-600 text-[15px] font-semibold text-white shadow-xs disabled:opacity-60">
          Se connecter
        </button>
        <Link href="/app" className="text-center text-sm font-semibold text-brand-700">Accéder à la démo</Link>
      </form>
    </AuthCard>
  );
}
