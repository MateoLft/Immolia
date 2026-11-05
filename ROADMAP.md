# Feuille de route Immolia

Liste complète des pages du logiciel. Chaque page existe déjà dans l'application :
celles qui ne sont pas encore développées affichent un écran « Module en préparation ».

Légende : ✅ fait · 🟡 interface prête (données d'exemple) · ⬜ à faire · 🎨 maquette disponible

## Étape 1 — Socle

| Élément | État |
|---|---|
| Projet Next.js + Tailwind, design « Pro » (couleurs, police Inter) | ✅ |
| Composants communs : bouton, badge, carte | ✅ |
| Mise en page de l'espace agent (menu latéral, menu mobile) | ✅ |
| Offres et tarifs centralisés (`src/lib/plans.ts`) | ✅ |
| Liste des modules centralisée (`src/lib/modules.ts`) | ✅ |
| Base de données Supabase (agences, utilisateurs, biens, visites, acquéreurs) | ✅ |
| Comptes : inscription, connexion, déconnexion (Supabase Auth) | ✅ |
| Mot de passe oublié | ✅ |
| Brancher le tableau de bord et les biens sur la base (fin des données d'exemple) | ✅ |
| Mise en ligne sur Vercel (immolia.vercel.app) | ✅ |
| Abonnements Stripe (essai 14 jours, mensuel / annuel, portail client) | ⬜ |
| Accès aux modules selon l'offre souscrite | ⬜ |
| Prise en main guidée (premier bien, logo, couleurs) | ⬜ |

## Étape 2 — MVP « Essentiel »

| Page | État | Maquette |
|---|---|---|
| Site vitrine + tarifs + FAQ | ✅ | 🎨 |
| Tableau de bord de l'agent | ✅ | 🎨 |
| Liste des biens | ✅ | |
| Fiche d'un bien | ✅ (sans photos) | 🎨 |
| Modifier / archiver un bien | ✅ (archiver = statut « Archivé ») | |
| Photos des biens (stockage Supabase privé, compression, photo principale) | ✅ | |
| Ajouter un bien (formulaire) | ✅ | 🎨 étape 2 |
| Page publique du bien + QR code + demande de visite | ✅ | |
| Diffusion assistée (Leboncoin, SeLoger, Bien'ici, Facebook) : textes prêts, ZIP photos, suivi | ✅ | |
| Multidiffusion automatique (multidiffuseur ou passerelles portails) | ⬜ (après accords partenaires) | |
| Studio IA : annonce portails, annonce courte, posts Instagram / Facebook | ✅ | 🎨 |
| Studio IA : analyse des photos (ambiance, style, état) | ✅ | |
| Studio IA : plaquette PDF | ✅ | |
| Studio IA : vidéo courte verticale (Reels, TikTok), créée dans le navigateur | ✅ | |
| Studio IA : quota 15 biens / mois pour l'offre Essentiel | ⬜ (avec Stripe) | |
| Visites : agenda, demandes en ligne, comptes rendus | ✅ | |
| Visites : rappel en un clic (email, WhatsApp, SMS) | ✅ | |
| Visites : rappels SMS / email automatiques | ⬜ (service d'envoi) | |
| Visites : créneaux réservables directement par l'acquéreur | ⬜ | |
| Bon de visite : suivi « signé » | ✅ | |
| Bon de visite signé sur écran + PDF | ✅ | |
| Signature électronique certifiée (prestataire agréé) | ⬜ | |
| Paramètres : profil, téléphone, agence, carte pro, mention honoraires | ✅ | |
| Paramètres : logo, couleurs, factures | ⬜ | |

## Étape 3 — Offre « Pro »

| Page | État | Maquette |
|---|---|---|
| Vendeurs : fiches, prospects, relances, rapport hebdomadaire prêt à envoyer | ✅ | 🎨 |
| Rapport vendeur envoyé automatiquement chaque lundi | ⬜ (service email + domaine) | |
| Acquéreurs : liste, fiches, critères, score, rapprochement automatique avec les biens, envoi email/WhatsApp/SMS | ✅ | |
| Assistant IA sur les pages publiques (200 messages / jour / bien) | ✅ | |
| Assistant IA sur WhatsApp | ⬜ | |
| Page « Estimez votre bien » + avis de valeur PDF + commentaire rédigé par l'IA | ✅ | |
| Estimation automatique à partir des ventes réelles (DVF) | ⬜ | |
| Vidéos courtes automatiques | ⬜ | 🎨 |
| Retouche photo et home staging virtuel | ⬜ | |

## Étape 4 — Offre « Agence »

| Page | État |
|---|---|
| Détection d'opportunités de mandats | ❌ remplacée par le suivi des prospects vendeurs (collecte d'annonces de particuliers non autorisée) |
| Registre des mandats numéroté (non supprimable), alertes d'échéance, export CSV, impression | ✅ |
| Dossier de vente : pièces, relance du vendeur, synthèse des PV d'AG et diagnostics par l'IA | ✅ |
| Conformité anti-blanchiment (LCB-FT) | ⬜ |
| Équipe, rôles et tableau de bord manager | ⬜ |

## Avant le lancement commercial

- Mentions légales, politique de confidentialité, CGV (à faire valider par un juriste)
- Hébergement des données en France et conformité RGPD (annoncés sur le site)
- Liste des portails de diffusion (FAQ marquée [À DÉFINIR])
- Hébergement de production : l'offre gratuite de Vercel (Hobby) est réservée à un usage non commercial,
  prévoir l'offre payante ou un autre hébergeur au lancement
