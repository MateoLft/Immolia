import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Créer votre compte"
      subtitle="14 jours d'essai gratuit, sans carte bancaire."
      footer={<>Déjà un compte ? <Link href="/connexion" className="font-semibold text-brand-700">Se connecter</Link></>}
    >
      <SignUpForm />
    </AuthCard>
  );
}
