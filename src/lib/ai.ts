import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { formatEuros, kindLabel, mandateLabel, type Property } from "./property-types";
import type { ContentKind, Tone } from "./studio";

/**
 * Génération de contenus immobiliers avec Claude.
 * La clé ANTHROPIC_API_KEY est lue côté serveur uniquement (jamais envoyée au navigateur).
 */

export const AI_MODEL = "claude-opus-5-5";

export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

// Prompt système fixe (aucune donnée variable) : il reste identique d'une requête à l'autre.
const SYSTEM_PROMPT = `Tu es le rédacteur d'une agence immobilière française. Tu écris des contenus de commercialisation pour des biens à vendre, en français, prêts à être publiés tels quels.

Règles impératives :
- N'utilise que les informations fournies sur le bien. N'invente jamais une caractéristique, une distance, un équipement, une vue, un quartier ou un chiffre qui n'est pas donné. Si une information manque, n'en parle pas.
- Ne mentionne ni l'adresse exacte ni le numéro de rue, même s'ils sont fournis : seulement la ville ou le quartier.
- Respecte la loi : pas de discrimination, pas de promesse de rentabilité, pas d'affirmation trompeuse.
- Pour les annonces destinées aux portails, termine par une ligne de mentions avec la classe énergie (DPE) et la classe climat (GES) si elles sont fournies, sinon « DPE : en cours ». Ajoute « Honoraires : [À COMPLÉTER] » pour que l'agent indique qui les paie.
- Si des photos du bien sont jointes, sers-t'en pour décrire l'ambiance, la luminosité, le style, les matériaux et l'état apparent, uniquement pour ce qui est clairement visible. Ne déduis jamais des photos une surface, un nombre de pièces, une vue, une exposition ou un équipement incertain. En cas de contradiction, les informations écrites priment.
- Réponds uniquement avec le texte final, sans introduction, sans commentaire, sans titre du type « Voici l'annonce », et sans mise en forme Markdown (pas d'astérisques ni de dièses), sauf les hashtags des réseaux sociaux.`;

const KIND_INSTRUCTIONS: Record<ContentKind, string> = {
  annonce:
    "Rédige une annonce complète pour les portails immobiliers : un titre accrocheur sur la première ligne, puis 3 à 5 paragraphes courts (environ 150 à 250 mots au total), puis la ligne de mentions.",
  "annonce-courte":
    "Rédige une annonce courte de 2 à 3 phrases maximum (moins de 60 mots), pour une vitrine d'agence ou un message rapide.",
  instagram:
    "Rédige la légende d'un post Instagram : une première ligne qui accroche, 3 à 5 lignes aérées, un appel à l'action (contacter l'agence ou réserver une visite), puis 5 à 10 hashtags pertinents en fin de texte. Quelques émojis sont autorisés, avec modération.",
  facebook:
    "Rédige une publication Facebook pour la page de l'agence : 2 à 3 paragraphes courts, un ton conversationnel et un appel à l'action clair pour organiser une visite.",
};

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  chaleureux: "Ton chaleureux et accueillant : fais ressentir le plaisir d'y vivre.",
  premium: "Ton haut de gamme, sobre et élégant : vocabulaire soigné, pas d'exclamations.",
  dynamique: "Ton dynamique et enthousiaste : phrases courtes, rythme vif, sentiment d'opportunité.",
};

function describeProperty(p: Property, agencyName: string) {
  const lines: [string, string | number | null][] = [
    ["Agence", agencyName],
    ["Titre", p.title],
    ["Type de bien", kindLabel(p.kind)],
    ["Ville", [p.postalCode, p.city].filter(Boolean).join(" ")],
    ["Prix de vente", p.price ? formatEuros(p.price) : null],
    ["Surface habitable", p.surface ? `${p.surface} m²` : null],
    ["Nombre de pièces", p.rooms],
    ["Nombre de chambres", p.bedrooms],
    ["Étage", p.floor],
    ["DPE", p.dpe],
    ["GES", p.ges],
    ["Charges annuelles", p.annualCharges ? formatEuros(p.annualCharges) : null],
    ["Mandat", p.mandateType ? mandateLabel(p.mandateType) : null],
    ["Notes et description de l'agent", p.description],
  ];
  return lines
    .filter(([, v]) => v !== null && v !== "" && v !== undefined)
    .map(([k, v]) => `${k} : ${v}`)
    .join("\n");
}

/** Nombre maximum de photos envoyées à l'IA (la photo principale d'abord). */
export const MAX_AI_PHOTOS = 4;

export type GenerationResult =
  | { ok: true; text: string; model: string; inputTokens: number; outputTokens: number; usedPhotos: number }
  | { ok: false; error: string };

export async function generatePropertyContent(
  property: Property,
  agencyName: string,
  kind: ContentKind,
  tone: Tone,
  photoUrls: string[] = [],
): Promise<GenerationResult> {
  if (!isAiConfigured()) {
    return { ok: false, error: "Le Studio IA n'est pas encore activé : la clé ANTHROPIC_API_KEY est manquante." };
  }

  const photos = photoUrls.slice(0, MAX_AI_PHOTOS);
  const instructions = `Informations sur le bien :\n<bien>\n${describeProperty(property, agencyName)}\n</bien>\n\nConsigne : ${KIND_INSTRUCTIONS[kind]}\n${TONE_INSTRUCTIONS[tone]}`;

  const call = (withPhotos: string[]) => {
    const content: Anthropic.Beta.BetaContentBlockParam[] = [
      ...withPhotos.map((url): Anthropic.Beta.BetaImageBlockParam => ({ type: "image", source: { type: "url", url } })),
      {
        type: "text",
        text: withPhotos.length > 0 ? `Les ${withPhotos.length} photo(s) ci-dessus montrent le bien.\n\n${instructions}` : instructions,
      },
    ];
    return getClient().beta.messages.create({
      model: AI_MODEL,
      max_tokens: 8000,
      output_config: { effort: "low" },
      // En cas de refus du modèle principal, l'API relance automatiquement sur un modèle de repli.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });
  };

  try {
    let used = photos;
    let response;
    try {
      response = await call(photos);
    } catch (error) {
      // Une photo illisible ou inaccessible ne doit pas bloquer la rédaction : on réessaie sans photos.
      if (photos.length > 0 && error instanceof Anthropic.BadRequestError) {
        console.error("Studio IA : photos refusées, nouvelle tentative sans photos", error.message);
        used = [];
        response = await call([]);
      } else {
        throw error;
      }
    }

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "Le contenu n'a pas pu être généré pour ce bien. Modifiez la description et réessayez." };
    }

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!text) return { ok: false, error: "La génération n'a rien renvoyé, merci de réessayer." };

    return {
      ok: true,
      text,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      usedPhotos: used.length,
    };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Studio IA : clé API invalide");
      return { ok: false, error: "La clé du Studio IA est invalide. Vérifiez ANTHROPIC_API_KEY dans Vercel." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Le Studio IA est très sollicité, merci de réessayer dans une minute." };
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Studio IA : erreur API ${error.status}`, error.message);
      return { ok: false, error: "Le Studio IA est momentanément indisponible, merci de réessayer." };
    }
    console.error("Studio IA : erreur inattendue", error);
    return { ok: false, error: "Le Studio IA est momentanément indisponible, merci de réessayer." };
  }
}
