# Pronos-Potes - Archive Statique

Archive statique du site de pronostics sportifs **pronos-potes.fr** (19 années d'historique, ~500 000 pronostics).

🌐 **Site en ligne** : [https://pronos-potes.fr](https://pronos-potes.fr)

## 📊 Données

- **5 compétitions** : Ligue 1, Ligue des Champions, Liga Europa, TOP 14, International
- **64 saisons** : 19 années d'historique (2006-2025)
- **1,448 journées** complètes
- **293 pronostiqueurs** actifs
- **12,533 matchs**
- **~500,000 pronostics** archivés

## 🏗️ Architecture

### Structure des données

```
data/
├── index.json                          # Index global
├── metadata/
│   ├── users.json                      # 260 utilisateurs
│   ├── teams.json                      # Équipes
│   └── competitions.json               # 4 compétitions
├── ligue-1/
│   ├── seasons-index.json
│   └── 2024-2025/
│       ├── season-meta.json
│       ├── standings-general.json
│       ├── matches-all.json
│       └── journees/
│           ├── 01.json
│           └── ...
├── ligue-champions/
├── top-14/
└── international/
```

## 🚀 Démarrage rapide

### 1. Export depuis MySQL

```bash
cd scripts/export-sql

# Test rapide (métadonnées uniquement)
bash test-quick-export.sh

# Export complet des métadonnées
bash export-all.sh

# Export d'une saison complète
bash export-season.sh ligue1 2024-2025
```

### 2. Validation des données

```bash
# Vérifier un fichier JSON
cat data/index.json | jq '.'

# Compter les utilisateurs
cat data/metadata/users.json | jq '.users | length'

# Vérifier la taille totale
du -sh data/
```

### 3. Développement du frontend

*(À venir - Phase 3)*

```bash
# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build
```

## 📋 Scripts SQL disponibles

| Script | Description | Sortie |
|--------|-------------|--------|
| `01-export-users.sql` | Utilisateurs + stats carrière | `data/metadata/users.json` |
| `02-export-competitions.sql` | Métadonnées compétitions | `data/metadata/competitions.json` |
| `03-export-teams.sql` | Liste des équipes | `data/metadata/teams.json` |
| `04-export-index-global.sql` | Index global du site | `data/index.json` |
| `05-export-seasons-index.sql` | Index des saisons | `data/{comp}/seasons-index.json` |
| `06-export-season-meta.sql` | Métadonnées d'une saison | `data/{comp}/{year}/season-meta.json` |
| `07-export-standings-general.sql` | Classement général | `data/{comp}/{year}/standings-general.json` |
| `08-export-matches-all.sql` | Tous les matchs | `data/{comp}/{year}/matches-all.json` |
| `09-export-journee.sql` | Détail d'une journée | `data/{comp}/{year}/journees/{XX}.json` |

Voir [scripts/export-sql/README.md](scripts/export-sql/README.md) pour plus de détails.

## 🗂️ Structure de base de données attendue

Les scripts s'attendent à ces tables MySQL :

- `jos_users` : Utilisateurs Joomla
- `jos_competitions` : Compétitions
- `jos_teams` : Équipes
- `jos_matches` : Matchs
- `jos_pronostics` : Pronostics

Voir [database-schema-example.sql](scripts/export-sql/database-schema-example.sql) pour le schéma complet.

## 📐 Format des données JSON

### Structure compressée des journées

```json
{
  "s": "ligue1-2024-2025",
  "j": 1,
  "d": "2024-08-16",
  "tm": 10,
  "tp": 3400,
  "m": [
    {
      "id": 1001,
      "t1": "Paris SG",
      "t2": "Monaco",
      "sc1": 4,
      "sc2": 2,
      "pr": [
        { "u": 1, "p": "1", "c": 1, "pts": 3 },
        { "u": 2, "p": "X", "c": 0, "pts": 0 }
      ]
    }
  ],
  "cj": [
    { "u": 1, "un": "Jean_Doe", "pj": 12, "pt": 245 }
  ]
}
```

**Mapping des clés** :
- `s` = season, `j` = journee, `d` = date
- `tm` = totalMatches, `tp` = totalPronostics
- `m` = matches, `t1/t2` = team1/team2
- `sc1/sc2` = score1/score2, `pr` = pronostics
- `u` = userId, `p` = pronostic, `c` = correct
- `pts` = points, `cj` = classement journée

## 📊 Volumétrie

| Type | Taille estimée |
|------|----------------|
| Métadonnées globales | ~40 KB |
| Index par compétition | ~2 KB |
| Classement par saison | ~30 KB |
| Matchs par saison | ~50 KB |
| Journée | ~15-20 KB |
| **Total (60 saisons)** | **~25-30 MB** |

Avec GZIP : **~5-7 MB**

## 🛠️ Stack technologique

- **Frontend** : HTML5, CSS3, JavaScript vanilla (ES6+)
- **Données** : JSON statique
- **Export** : MySQL + Scripts SQL
- **Build** : Node.js
- **Déploiement** : GitHub Pages

## 📝 Roadmap

### ✅ Phase 1 : Extraction MySQL - TERMINÉE
- [x] Scripts PHP d'export
- [x] Export matchs (64 saisons)
- [x] Export pronostics (1,448 journées)
- [x] Validation des données

### ✅ Phase 2 : Traitement des données - TERMINÉE
- [x] Fragmentation par journée
- [x] Calcul des classements généraux
- [x] Génération de l'historique journée par journée
- [x] Génération des index
- [x] Validation finale (64 saisons, 1,448 journées)

### ✅ Phase 3 : Frontend - TERMINÉE
- [x] Landing page avec 5 compétitions
- [x] Page classement général par saison
- [x] Page classements par journée
- [x] Page historique du classement
- [x] Responsive design mobile-first
- [x] Serveur de développement local

### ✅ Phase 4 : Déploiement - TERMINÉE
- [x] Repository GitHub créé et configuré
- [x] GitHub Pages activé
- [x] Configuration DNS pronos-potes.fr (Infomaniak)
- [x] Certificat HTTPS activé (Let's Encrypt)
- [x] Site en production : https://pronos-potes.fr

## 📖 Documentation

- [Scripts SQL README](scripts/export-sql/README.md) : Documentation des exports
- [Database Schema](scripts/export-sql/database-schema-example.sql) : Structure attendue

## 🤝 Contribution

Ce projet est une archive statique personnelle. Les contributions ne sont pas acceptées.

## 📄 Licence

Données privées - Tous droits réservés

---

**Version** : 2.0
**Dernière mise à jour** : 23 novembre 2025
**Statut** : ✅ Toutes phases terminées - 🌐 Site en production sur https://pronos-potes.fr
