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
| Base de données Supabase (agences, utilisateurs, biens, visites, acquéreurs) | 🟡 schéma prêt, à exécuter dans Supabase |
| Comptes : inscription, connexion, déconnexion (Supabase Auth) | 🟡 codé, à activer avec les clés |
| Mot de passe oublié | ⬜ |
| Brancher le tableau de bord et les biens sur la base (fin des données d'exemple) | ⬜ |
| Abonnements Stripe (essai 14 jours, mensuel / annuel, portail client) | ⬜ |
| Accès aux modules selon l'offre souscrite | ⬜ |
| Prise en main guidée (premier bien, logo, couleurs) | ⬜ |

## Étape 2 — MVP « Essentiel »

| Page | État | Maquette |
|---|---|---|
| Site vitrine + tarifs + FAQ | ✅ | 🎨 |
| Tableau de bord de l'agent | 🟡 | 🎨 |
| Liste des biens | 🟡 | |
| Fiche d'un bien | 🟡 | 🎨 |
| Ajouter un bien (3 étapes, mobile) | ⬜ | 🎨 étape 2 |
| Page publique du bien + QR code | ⬜ | |
| Studio IA : texte d'annonce, posts réseaux sociaux, plaquette PDF | ⬜ | 🎨 |
| Visites : agenda, réservation en ligne, rappels SMS | ⬜ | |
| Bon de visite signé électroniquement | ⬜ | |
| Paramètres : profil, marque, abonnement, factures | ⬜ | |

## Étape 3 — Offre « Pro »

| Page | État | Maquette |
|---|---|---|
| Rapport vendeur hebdomadaire (email automatique) | ⬜ | 🎨 |
| Acquéreurs : liste, fiches, score de qualification | ⬜ | |
| Assistant IA acquéreurs (site et WhatsApp) | ⬜ | |
| Widget d'estimation en marque blanche + rapport PDF | ⬜ | |
| Vidéos courtes automatiques | ⬜ | 🎨 |
| Retouche photo et home staging virtuel | ⬜ | |

## Étape 4 — Offre « Agence »

| Page | État |
|---|---|
| Détection d'opportunités de mandats | ⬜ |
| Registre des mandats et alertes d'échéance | ⬜ |
| Dossier de vente : pièces, relances, résumé des PV d'AG | ⬜ |
| Conformité anti-blanchiment (LCB-FT) | ⬜ |
| Équipe, rôles et tableau de bord manager | ⬜ |

## Avant le lancement commercial

- Mentions légales, politique de confidentialité, CGV (à faire valider par un juriste)
- Hébergement des données en France et conformité RGPD (annoncés sur le site)
- Liste des portails de diffusion (FAQ marquée [À DÉFINIR])
- Hébergement de production : l'offre gratuite de Vercel (Hobby) est réservée à un usage non commercial,
  prévoir l'offre payante ou un autre hébergeur au lancement
