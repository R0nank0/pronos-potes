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

Site statique utilisant uniquement HTML, CSS et JavaScript vanilla.

### Structure des données

```
data/
├── index.json                          # Index global
├── metadata/
│   └── users.json                      # Utilisateurs
├── ligue-1/
│   ├── seasons-index.json
│   └── 2024-2025/
│       ├── season-meta.json
│       ├── standings-general.json      # Classement général
│       ├── standings-history.json      # Évolution par journée
│       ├── matches-all.json            # Tous les matchs
│       └── journees/
│           ├── 01.json                 # Détails journée 1
│           └── ...
├── ligue-champions/
├── liga-europa/
├── top-14/
└── international/
```

### Pages disponibles

```
public/
├── index.html           # Page d'accueil
├── season.html          # Détails d'une saison
├── competition.html     # Vue par compétition
├── user-stats.html      # Statistiques utilisateur
└── css/
    └── js/
```

## 📐 Format des données JSON

Les données sont fragmentées en petits fichiers JSON pour optimiser le chargement :

- **Index global** : ~5 KB
- **Classement par saison** : ~30 KB
- **Journée individuelle** : ~15-20 KB
- **Historique du classement** : ~350 KB

### Exemple de structure (journée)

```json
{
  "s": "ligue1-2024-2025",
  "j": 1,
  "d": "2024-08-16",
  "tm": 10,
  "tp": 340,
  "m": [
    {
      "id": 1001,
      "t1": "Paris SG",
      "t2": "Monaco",
      "sc1": 4,
      "sc2": 2,
      "pr": [...]
    }
  ],
  "cj": [...]
}
```

## 📊 Volumétrie

| Type | Taille |
|------|--------|
| Total données (non compressé) | ~106 MB |
| Avec compression GZIP | ~25-30 MB |
| Nombre de fichiers JSON | 1,576 |

## 🛠️ Stack technologique

- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Hébergement** : GitHub Pages
- **CDN** : GitHub CDN avec compression GZIP
- **SSL** : Let's Encrypt (automatique)

## 🎯 Fonctionnalités

- ✅ Classement général par saison
- ✅ Classements par journée
- ✅ Historique et évolution des classements
- ✅ Statistiques utilisateurs
- ✅ Responsive design (mobile-first)
- ✅ Cache navigateur intelligent
- ✅ Lazy loading des données

## 🤝 Contribution

Ce projet est une archive statique personnelle. Les contributions ne sont pas acceptées.

## 📄 Licence

Données privées - Tous droits réservés

---

**Version** : 2.0
**Dernière mise à jour** : 23 novembre 2025
**Statut** : 🌐 Site en production sur https://pronos-potes.fr
