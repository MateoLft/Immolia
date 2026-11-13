import Link from "next/link";
import { Download } from "lucide-react";
import { ImportProperties } from "@/components/app/import-properties";

export const metadata = { title: "Importer des biens" };

export default function ImportPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-7 lg:px-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/biens" className="hover:text-ink">Biens</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Importer</span>
      </nav>
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Importer des biens</h1>
        <p className="mt-1 text-[15px] text-muted">
          Reprenez votre portefeuille depuis un fichier CSV (export Excel ou de votre logiciel actuel). Vous vérifiez le résultat avant que quoi que ce soit soit enregistré.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-[17px] font-semibold">Comment préparer le fichier</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-body">
          <li>Une ligne par bien, et une première ligne avec les noms de colonnes.</li>
          <li><strong>Seule la ville est obligatoire.</strong> Sans titre, Immolia en génère un (« Appartement · 3 pièces · 68 m² · Lyon »).</li>
          <li>Colonnes reconnues : titre, ville, code postal, adresse, type de bien, prix, surface, pièces, chambres, étage, DPE, GES, charges, référence, statut, mandat, fin de mandat, description. Les autres sont ignorées.</li>
          <li>Les biens dont la <strong>référence</strong> existe déjà chez vous sont ignorés : vous pouvez relancer un import sans créer de doublons.</li>
          <li>Les photos ne sont pas importées : ajoutez-les ensuite depuis chaque bien.</li>
        </ul>
        <a href="/modele-import-biens.csv" download className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-body shadow-xs hover:bg-canvas">
          <Download aria-hidden className="size-4" />Télécharger un fichier modèle
        </a>
      </section>

      <ImportProperties />
    </div>
  );
}
