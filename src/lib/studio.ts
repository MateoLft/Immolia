/** Types et libellés du Studio IA, partagés entre le serveur et le navigateur. */

export const CONTENT_KINDS = [
  { value: "annonce", label: "Annonce portails", description: "Texte complet pour SeLoger, Leboncoin, etc." },
  { value: "annonce-courte", label: "Annonce courte", description: "Version résumée pour vitrine ou SMS" },
  { value: "instagram", label: "Post Instagram", description: "Légende avec hashtags" },
  { value: "facebook", label: "Post Facebook", description: "Publication pour votre page" },
] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number]["value"];

export const TONES = [
  { value: "chaleureux", label: "Chaleureux" },
  { value: "premium", label: "Premium" },
  { value: "dynamique", label: "Dynamique" },
] as const;
export type Tone = (typeof TONES)[number]["value"];

export type GeneratedContent = {
  id: string;
  kind: ContentKind;
  tone: Tone;
  content: string;
  createdAt: string;
};

export const isContentKind = (v: unknown): v is ContentKind => CONTENT_KINDS.some((k) => k.value === v);
export const isTone = (v: unknown): v is Tone => TONES.some((t) => t.value === v);
