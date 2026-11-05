import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { NewPasswordForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Nouveau mot de passe" };

export default function NewPasswordPage() {
  return (
    <AuthCard
      title="Choisissez un nouveau mot de passe"
      subtitle="Il remplacera l'ancien immédiatement."
      footer={<Link href="/connexion" className="font-semibold text-brand-700">Retour à la connexion</Link>}
    >
      <NewPasswordForm />
    </AuthCard>
  );
}
