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
| `src/app/globals.css` | Couleurs et styles du design (tokens) |

## Feuille de route

Voir [ROADMAP.md](./ROADMAP.md).
