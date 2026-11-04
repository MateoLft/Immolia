import Link from "next/link";
import { AuthCard, Field } from "@/components/auth/auth-card";

export const metadata = { title: "Créer un compte" };

// TODO(auth) : brancher Supabase Auth (étape « Socle » de ROADMAP.md).
export default function SignUpPage() {
  return (
    <AuthCard
      title="Créer votre compte"
      subtitle="14 jours d'essai gratuit, sans carte bancaire."
      footer={<>Déjà un compte ? <Link href="/connexion" className="font-semibold text-brand-700">Se connecter</Link></>}
    >
      <form className="flex flex-col gap-4">
        <Field label="Prénom et nom" name="name" autoComplete="name" />
        <Field label="Nom de l'agence" name="agency" autoComplete="organization" />
        <Field label="Email professionnel" name="email" type="email" autoComplete="email" />
        <Field label="Mot de passe" name="password" type="password" autoComplete="new-password" />
        <button type="submit" disabled className="mt-2 h-11 rounded-lg bg-brand-600 text-[15px] font-semibold text-white shadow-xs disabled:opacity-60">
          Créer mon compte
        </button>
        <p className="text-xs text-subtle">L&apos;inscription sera activée avec la mise en place des comptes.</p>
      </form>
    </AuthCard>
  );
}
