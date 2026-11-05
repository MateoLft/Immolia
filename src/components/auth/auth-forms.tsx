"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword, type AuthState } from "@/app/(auth)/actions";
import { Field } from "./auth-card";

function Feedback({ state }: { state: AuthState }) {
  if (state.error) {
    return <p role="alert" className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">{state.error}</p>;
  }
  if (state.message) {
    return <p role="status" className="rounded-lg bg-success-50 px-3.5 py-2.5 text-sm text-success-700">{state.message}</p>;
  }
  return null;
}

const submitClasses =
  "mt-2 h-11 rounded-lg bg-brand-600 text-[15px] font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60";

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Prénom et nom" name="name" autoComplete="name" />
      <Field label="Nom de l'agence" name="agency" autoComplete="organization" />
      <Field label="Email professionnel" name="email" type="email" autoComplete="email" />
      <Field label="Mot de passe (8 caractères minimum)" name="password" type="password" autoComplete="new-password" />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={submitClasses}>
        {pending ? "Création en cours…" : "Créer mon compte"}
      </button>
    </form>
  );
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="suite" value={next ?? "/app"} />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" />
      <Link href="/mot-de-passe-oublie" className="-mt-2 self-end text-sm font-semibold text-brand-700">Mot de passe oublié ?</Link>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={submitClasses}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      <Link href="/app" className="text-center text-sm font-semibold text-brand-700">Accéder à la démo</Link>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={submitClasses}>
        {pending ? "Envoi…" : "Recevoir le lien"}
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nouveau mot de passe (8 caractères minimum)" name="password" type="password" autoComplete="new-password" />
      <Field label="Confirmer le mot de passe" name="confirm" type="password" autoComplete="new-password" />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={submitClasses}>
        {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}
