import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Indiquez votre email : nous vous envoyons un lien pour en choisir un nouveau."
      footer={<Link href="/connexion" className="font-semibold text-brand-700">Retour à la connexion</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
