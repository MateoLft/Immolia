import Link from "next/link";
import { Check, FileCheck2, MessageSquare, Server, ShieldCheck } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pricing } from "@/components/marketing/pricing";
import { MODULES } from "@/lib/modules";
import { PLANS } from "@/lib/plans";

const TRUST = [
  { icon: ShieldCheck, label: "Conforme RGPD" },
  { icon: Server, label: "Données hébergées en France" },
  { icon: FileCheck2, label: "Bons de visite conformes loi Hoguet" },
  { icon: MessageSquare, label: "Support en français" },
];

const FAQ = [
  {
    q: "Puis-je importer mes biens depuis mon logiciel actuel ?",
    a: "Oui. L'import se fait à partir d'un fichier ou des flux de diffusion, et notre équipe vous accompagne gratuitement.",
  },
  { q: "Les annonces sont-elles diffusées sur les portails ?", a: "[À DÉFINIR : liste des portails connectés au lancement.]" },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Vos données et celles de vos clients sont hébergées en France, chiffrées, et ne sont jamais revendues.",
  },
  {
    q: "Puis-je changer d'offre ou résilier ?",
    a: "À tout moment, depuis votre espace, sans frais ni engagement sur l'offre mensuelle.",
  },
];

const SHOWCASE_MODULES = MODULES.filter((m) => !["conformite", "equipe", "parametres"].includes(m.slug));

export default function HomePage() {
  return (
    <div className="bg-white text-ink">
      {/* Navigation */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <nav aria-label="Navigation principale" className="hidden gap-8 text-[15px] font-medium text-muted md:flex">
            <a href="#modules" className="hover:text-ink">Modules</a>
            <a href="#tarifs" className="hover:text-ink">Tarifs</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/connexion" variant="ghost">Se connecter</ButtonLink>
            <ButtonLink href="/inscription">Démarrer l&apos;essai</ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
          <a
            href="#modules"
            className="inline-flex items-center gap-2.5 rounded-full border border-line py-1 pr-3 pl-1 text-sm font-medium text-body"
          >
            <Badge tone="brand">Nouveau</Badge>
            Studio IA : annonces, posts et vidéos en un clic
          </a>
          <h1 className="max-w-4xl text-4xl leading-[1.08] font-bold tracking-tight md:text-6xl">
            Le logiciel tout-en-un des agents immobiliers
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            Biens, visites, acquéreurs, vendeurs et mandats réunis dans une seule plateforme. L&apos;intelligence
            artificielle automatise les tâches répétitives pour que vous vous concentriez sur la vente.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/inscription" size="lg">Démarrer l&apos;essai gratuit</ButtonLink>
            <ButtonLink href="/app" variant="secondary" size="lg">Voir la démo</ButtonLink>
          </div>
          <p className="text-sm text-subtle">14 jours d&apos;essai · Sans carte bancaire · Résiliable à tout moment</p>

          {/* Aperçu produit */}
          <div className="mt-10 w-full rounded-t-2xl border border-b-0 border-line bg-canvas px-3.5 pt-3.5">
            <div className="flex min-h-[340px] overflow-hidden rounded-t-[10px] border border-b-0 border-line bg-white text-left">
              <div className="hidden w-48 flex-none flex-col gap-1 border-r border-line p-4 text-[13px] text-muted sm:flex">
                <span className="px-2 pb-3 text-sm font-bold text-ink">Immolia</span>
                <span className="rounded-md bg-hover px-2 py-2 font-semibold text-ink">Tableau de bord</span>
                {["Biens", "Visites", "Acquéreurs", "Mandats", "Studio IA"].map((l) => (
                  <span key={l} className="px-2 py-2">{l}</span>
                ))}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
                <span className="text-lg font-bold">Tableau de bord</span>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ["Biens actifs", "12"],
                    ["Visites (7 j)", "8"],
                    ["Acquéreurs qualifiés", "15"],
                    ["Mandats (mois)", "3"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-[10px] border border-line p-3.5">
                      <p className="text-xs text-subtle">{k}</p>
                      <p className="mt-1.5 text-[22px] font-bold">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-hidden rounded-[10px] border border-line text-[13px]">
                  <div className="flex gap-3 bg-canvas px-3.5 py-2.5 text-xs font-semibold text-subtle">
                    <span className="flex-[2]">Bien</span><span className="flex-1">Statut</span><span className="flex-1">Vues</span>
                  </div>
                  {[
                    ["T3 avec balcon · Lyon 6e", "En ligne", "success", "412"],
                    ["Maison · Écully", "À publier", "warning", "—"],
                    ["Loft · Lyon 7e", "Compromis", "brand", "1 208"],
                  ].map(([t, s, tone, v]) => (
                    <div key={t} className="flex gap-3 border-t border-line px-3.5 py-3">
                      <span className="flex-[2] font-semibold">{t}</span>
                      <span className="flex-1"><Badge tone={tone as "success" | "warning" | "brand"}>{s}</Badge></span>
                      <span className="flex-1 text-muted">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confiance */}
      <section className="border-y border-line bg-canvas px-6 py-7">
        <ul className="mx-auto flex max-w-6xl flex-wrap justify-between gap-5 text-[15px] font-medium text-body">
          {TRUST.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon aria-hidden className="size-5 text-brand-600" strokeWidth={1.8} />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Modules */}
      <section id="modules" className="px-6 py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-14">
          <div className="flex max-w-2xl flex-col gap-3.5">
            <span className="text-sm font-semibold text-brand-700">Modules</span>
            <h2 className="text-4xl leading-tight font-bold tracking-tight">Une plateforme, tout le cycle de vente</h2>
            <p className="text-lg leading-relaxed text-muted">
              De la rentrée du mandat à la signature chez le notaire, chaque étape est couverte et connectée.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE_MODULES.map((m, i) => (
              <div key={m.slug} className="flex flex-col gap-3 bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-line text-[13px] font-bold text-brand-700 shadow-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="rounded-md border border-line px-2 py-0.5 text-xs font-semibold text-muted">
                    {PLANS[m.plan].name}
                  </span>
                </div>
                <h3 className="mt-1 text-[17px] font-semibold">{m.name}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio IA */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold text-brand-700">Studio IA</span>
            <h2 className="text-4xl leading-tight font-bold tracking-tight">
              Vos annonces rédigées en 30 secondes, à votre image
            </h2>
            <p className="text-[17px] leading-relaxed text-muted">
              À partir des photos et des caractéristiques, Immolia produit un contenu prêt à diffuser, avec les
              mentions légales obligatoires.
            </p>
            <ul className="mt-2 flex flex-col gap-3.5 text-base text-body">
              {[
                "Textes adaptés à chaque portail et à chaque réseau social",
                "Vidéos verticales montées automatiquement",
                "Plaquette PDF à vos couleurs",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="flex size-[22px] flex-none items-center justify-center rounded-full bg-brand-50">
                    <Check aria-hidden className="size-3.5 text-brand-700" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-canvas p-7">
            <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-white p-6 shadow-[0_12px_24px_-8px_rgba(16,24,40,0.10)]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-subtle">Texte d&apos;annonce · ton Premium</span>
                <Badge tone="success">Généré</Badge>
              </div>
              <p className="text-[17px] leading-snug font-semibold">Lyon 6e — Appartement traversant, balcon plein sud</p>
              <p className="text-sm leading-relaxed text-muted">
                Au 4e étage avec ascenseur, cet appartement de 68 m² offre une luminosité remarquable. Réception
                ouverte sur balcon sud, deux chambres au calme, cuisine équipée, cave.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="border-t border-line bg-canvas px-6 py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <div className="flex flex-col items-center gap-3.5 text-center">
            <span className="text-sm font-semibold text-brand-700">Tarifs</span>
            <h2 className="text-4xl font-bold tracking-tight">Une offre pour chaque étape de votre activité</h2>
            <p className="text-lg text-muted">Prix HT. Changez d&apos;offre à tout moment.</p>
          </div>
          <Pricing />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <h2 className="text-center text-4xl font-bold tracking-tight">Questions fréquentes</h2>
          <div className="border-t border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="border-b border-line py-5">
                <summary className="cursor-pointer text-[17px] font-semibold">{f.q}</summary>
                <p className="mt-3 text-base leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="px-6 pb-24">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-7 rounded-[20px] bg-ink px-8 py-16 md:px-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-[34px]">Prêt à moderniser votre agence ?</h2>
            <p className="mt-2.5 text-lg text-line-strong">Lancez votre essai en 2 minutes, sans carte bancaire.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/app" variant="secondary" size="lg">Voir la démo</ButtonLink>
            <ButtonLink href="/inscription" size="lg">Démarrer l&apos;essai</ButtonLink>
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-line px-6 pt-14 pb-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <div className="flex flex-wrap justify-between gap-10">
            <div className="flex max-w-xs flex-col gap-3">
              <span className="flex items-center gap-2.5 font-bold"><LogoMark size={26} />Immolia</span>
              <p className="text-[15px] leading-relaxed text-muted">Le logiciel tout-en-un des agents immobiliers.</p>
            </div>
            <div className="flex flex-wrap gap-16 text-[15px] text-muted">
              {[
                { title: "Produit", links: [["Modules", "#modules"], ["Tarifs", "#tarifs"]] },
                { title: "Entreprise", links: [["Contact", "mailto:contact@immolia.fr"]] },
                { title: "Légal", links: [["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"], ["CGV", "/cgv"]] },
              ].map((col) => (
                <div key={col.title} className="flex flex-col gap-3">
                  <span className="text-sm font-semibold text-subtle">{col.title}</span>
                  {col.links.map(([label, href]) => (
                    <Link key={label} href={href} className="hover:text-ink">{label}</Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="border-t border-line pt-6 text-sm text-subtle">© 2026 Immolia. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
