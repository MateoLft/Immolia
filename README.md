# Immolia

Le logiciel tout-en-un des agents immobiliers : biens, visites, acquéreurs, vendeurs et mandats,
avec une IA qui automatise les tâches répétitives.

## Démarrer en local

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000 (site vitrine) et http://localhost:3000/app (espace agent, données d'exemple).

## Mode démo et Supabase

Sans configuration, l'application tourne en **mode démo** : l'espace agent est ouvert avec des données d'exemple.

Pour activer les comptes :

1. Dans le projet Supabase **immolia** (vérifier le nom en haut à gauche), ouvrir **SQL Editor** et exécuter
   `supabase/migrations/0001_schema_initial.sql`.
2. Copier `.env.example` en `.env.local` et y mettre la Project URL et la clé `anon` (Project Settings > API).
3. Relancer `npm run dev`. L'espace `/app` demande alors une connexion.

## Organisation du code

| Dossier | Contenu |
|---|---|
| `src/app/(marketing)` | Site vitrine, tarifs, pages légales |
| `src/app/(auth)` | Inscription et connexion |
| `src/app/app` | Espace agent (tableau de bord, biens, modules) |
| `src/components/ui` | Composants communs : bouton, badge, carte |
| `src/lib/plans.ts` | Les 3 offres, prix et tableau comparatif (source unique) |
| `src/lib/modules.ts` | Tous les modules du logiciel, leur offre et leur état |
| `src/lib/mock-data.ts` | Données d'exemple, en attendant la base de données |
| `src/lib/supabase` | Connexion à Supabase |
| `src/proxy.ts` | Protection de l'espace agent (connexion obligatoire) |
| `supabase/migrations` | Schéma de la base de données et règles de sécurité |
| `src/app/globals.css` | Couleurs et styles du design (tokens) |

## Feuille de route

Voir [ROADMAP.md](./ROADMAP.md).
