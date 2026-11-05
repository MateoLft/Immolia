/** Pièces du dossier de vente (partagé serveur / navigateur). */

export type DocumentKind = {
  value: string;
  label: string;
  /** Uniquement pour les biens en copropriété. */
  copro?: boolean;
  /** L'IA peut en faire une synthèse utile. */
  analyzable?: boolean;
};

export const DOCUMENT_KINDS: DocumentKind[] = [
  { value: "titre-propriete", label: "Titre de propriété" },
  { value: "diagnostics", label: "Dossier de diagnostics techniques (DPE, amiante, plomb, électricité, gaz, termites, ERP)", analyzable: true },
  { value: "taxe-fonciere", label: "Dernier avis de taxe foncière" },
  { value: "plans", label: "Plans du bien" },
  { value: "pv-ag", label: "PV des 3 dernières assemblées générales", copro: true, analyzable: true },
  { value: "reglement-copro", label: "Règlement de copropriété et état descriptif de division", copro: true, analyzable: true },
  { value: "fiche-synthetique", label: "Fiche synthétique de la copropriété", copro: true, analyzable: true },
  { value: "charges", label: "Charges des 2 derniers exercices", copro: true, analyzable: true },
  { value: "carnet-entretien", label: "Carnet d'entretien de l'immeuble", copro: true, analyzable: true },
  { value: "pre-etat-date", label: "Pré-état daté", copro: true, analyzable: true },
  { value: "autre", label: "Autre document", analyzable: true },
];

export const kindOf = (value: string) => DOCUMENT_KINDS.find((k) => k.value === value);

/** Pièces attendues pour un bien (la copropriété concerne surtout les appartements). */
export function requiredKinds(propertyKind: string, hasCharges: boolean) {
  const copro = propertyKind === "appartement" || propertyKind === "parking" || hasCharges;
  return DOCUMENT_KINDS.filter((k) => k.value !== "autre" && (!k.copro || copro));
}

export type PropertyDocument = {
  id: string;
  kind: string;
  fileName: string;
  url: string | null;
  analysis: string | null;
  createdAt: string;
};
