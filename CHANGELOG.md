# Changelog - Pronos-Potes Archive

Historique des modifications du projet.

---

## [1.2.1] - 2025-11-02

### 🐛 Corrigé

- **Erreur de classification** : Coupe du Monde 2010 déplacée de `ligue1` vers `international`
- **Statistiques mises à jour** :
  - Ligue 1 : 19 saisons (au lieu de 20), 704 journées
  - International : 14 événements (au lieu de 13), 84 journées

---

## [1.2.0] - 2025-11-02

### ✅ Ajouté

- **Enrichissement avec les journées réelles**
  - Fichier source : `scripts/datasources/journees.json`
  - 1 428 journées parsées depuis MySQL
  - Script : `scripts/enrich-seasons-data.js`

- **Génération automatique des métadonnées de saisons**
  - 65 fichiers `season-meta.json` créés
  - Nombre réel de journées par saison
  - Statut de chaque saison (ongoing/finished/archived)
  - Journée active pour les saisons en cours

- **Structure complète pour les 65 saisons**
  - Dossiers créés pour chaque saison
  - Sous-dossier `journees/` prêt à recevoir les données
  - 83 fichiers JSON générés (~1.4 MB)

- **Statistiques enrichies** :
  - Ligue 1 : 712 journées (36/saison en moyenne)
  - Ligue des Champions : 272 journées (16/saison)
  - TOP 14 : 368 journées (25/saison)
  - International : 76 journées (6/événement)

- **Nouvelles commandes npm** :
  - `npm run enrich-seasons` - Enrichir avec les journées
  - `npm run generate-all` - Générer tout (index + enrichissement)

### 🔧 Modifié

- **Index global** mis à jour avec `totalJournees: 1428`
- **Index de saisons** enrichis avec le nombre de journées
- **package.json** mis à jour avec nouvelles commandes

---

## [1.1.0] - 2025-11-02

### ✅ Ajouté

- **Intégration des vraies saisons** depuis la base MySQL
  - Fichier source : `scripts/datasources/saisons.json`
  - 65 saisons réelles (2006-2025)
  - 4 compétitions : Ligue 1, LdC, TOP 14, International

- **Générateur d'index réel** (`scripts/generate-real-index.js`)
  - Parse le fichier des saisons MySQL
  - Génère les index par compétition
  - Crée l'index global avec les vraies données

- **Index générés** :
  - `data/index.json` - 65 saisons, 4 compétitions
  - `data/ligue-1/seasons-index.json` - 20 saisons Ligue 1
  - `data/ligue-champions/seasons-index.json` - 17 saisons LdC
  - `data/top-14/seasons-index.json` - 15 saisons TOP 14
  - `data/international/seasons-index.json` - 13 événements

- **Documentation** :
  - `scripts/datasources/README.md` - Guide des sources de données

- **Commandes npm** :
  - `npm run generate-index` - Générer les index réels
  - `npm run regenerate-real` - Nettoyer et régénérer

### 📊 Détails des saisons

#### Ligue 1 (20 saisons)
2024-2025, 2023-2024, 2022-2023, 2021-2022, 2020-2021,
2019-2020, 2018-2019, 2017-2018, 2016-2017, 2015-2016,
2014-2015, 2013-2014, 2012-2013, 2011-2012, 2010-2011,
2009-2010, 2008-2009, 2007-2008, 2006-2007

#### Ligue des Champions (17 saisons)
2024-2025, 2023-2024, 2022-2023, 2021-2022, 2020-2021,
2019-2020, 2018-2019, 2017-2018, 2016-2017, 2015-2016,
2014-2015, 2013-2014, 2012-2013, 2011-2012, 2010-2011,
2009-2010

#### TOP 14 (15 saisons)
2024-2025, 2023-2024, 2022-2023, 2021-2022, 2020-2021,
2019-2020, 2018-2019, 2017-2018, 2016-2017, 2015-2016,
2014-2015, 2013-2014, 2012-2013, 2011-2012

#### International (13 événements)
- Euro 2024, 2021, 2016, 2012, 2008
- Coupe du Monde 2022, 2018, 2014, 2010
- Coupe du Monde Rugby 2023, 2019, 2015
- Copa America 2011

---

## [1.0.0] - 2025-11-02

### ✅ Initial Release

- **Scripts SQL d'export** (9 fichiers)
  - Export utilisateurs, compétitions, équipes
  - Export saisons, matchs, pronostics
  - Export journées détaillées

- **Scripts bash automatisés** (4 fichiers)
  - `export-all.sh` - Export métadonnées globales
  - `export-season.sh` - Export saison complète
  - `test-quick-export.sh` - Test connexion MySQL
  - `create-structure.sh` - Créer arborescence

- **Générateur de données mockées** (`scripts/generate-mock-data.js`)
  - 50 utilisateurs fictifs
  - 18 équipes Ligue 1
  - 10 journées avec pronostics
  - ~45 000 pronostics générés

- **Documentation complète**
  - `README.md` - Vue d'ensemble
  - `QUICKSTART.md` - Démarrage rapide SQL
  - `GUIDE-COMPLET.md` - Guide détaillé
  - `CLAUDE.md` - Architecture
  - `scripts/MOCK-DATA-README.md`
  - `scripts/export-sql/README.md`

- **Structure du projet**
  - Arborescence optimisée
  - Format JSON fragmenté
  - Compression des clés
  - `.gitignore` configuré

- **Package.json** avec commandes npm
  - `npm run generate-mock`
  - `npm run serve`
  - `npm run stats`
  - `npm run help`

---

## [1.3.0] - 2025-11-02

### ✅ Ajouté

- **Traitement des matchs par saison**
  - Fichier source : `scripts/datasources/matches-ligue1-2009-2010.json`
  - Script : `scripts/process-matches.js`
  - 380 matchs traités pour Ligue 1 2009-2010
  - Mapping automatique des IDs d'équipes vers les noms

- **Intégration du référentiel d'équipes**
  - Fichier source : `scripts/datasources/teams.json`
  - 308 équipes chargées
  - Mapping ID → nom d'équipe (ex: "Bordeaux", "Marseille", "Lyon")

- **Génération de matches-all.json**
  - Format enrichi avec noms d'équipes
  - Tri par journée et ID de match
  - Statut des matchs (finished/upcoming)
  - Scores complets

- **Traitement du catalogue utilisateurs**
  - Fichier source : `scripts/datasources/users.json`
  - Script : `scripts/process-users.js`
  - 293 utilisateurs traités
  - Structure prête pour les statistiques de carrière

- **Génération de metadata/users.json**
  - Catalogue complet des pronostiqueurs
  - Structure avec champs pour statistiques (à calculer avec pronostics)
  - Tri par ID utilisateur

- **Traitement des pronostics par journée**
  - Fichier source : `scripts/datasources/pronos-ligue1-2009-2010-j01.json`
  - Script : `scripts/process-pronostics.js`
  - 581 pronostics traités pour journée 1
  - Calcul automatique des points (5 pts score exact, 3 pts bon résultat)
  - Classement de la journée généré

- **Génération des fichiers journées/XX.json**
  - Format optimisé avec compression de clés (s, j, d, tm, tp, m, pr, cj)
  - Données complètes : matchs + pronostics + classement
  - Taille par journée : ~15-20 KB
  - 59 participants identifiés

- **Nouvelles commandes npm** :
  - `npm run process-matches` - Traiter les fichiers de matchs
  - `npm run process-users` - Traiter le fichier des utilisateurs
  - `npm run process-pronostics` - Traiter les fichiers de pronostics

### 📊 Données générées

- `data/ligue-1/2009-2010/matches-all.json` :
  - 380 matchs sur 38 journées
  - Noms d'équipes résolus (Auxerre, Bordeaux, Marseille, Lyon, etc.)
  - Dates et scores complets
  - Métadonnées de saison

- `data/metadata/users.json` :
  - 293 utilisateurs catalogués
  - Structure prête pour statistiques de carrière
  - Champs: totalPoints, totalPronostics, successRate, etc.

- `data/ligue-1/2009-2010/journees/01.json` :
  - 10 matchs avec scores réels
  - 581 pronostics de 59 participants
  - Points calculés pour chaque pronostic
  - Classement de la journée (meilleur: julien avec 24 points)

---

## 🎯 Prochaines versions

### [1.4.0] - À venir

- [ ] Export des matchs des autres saisons (64 saisons restantes)
- [ ] Export des pronostics par journée
- [ ] Génération des fichiers journées/XX.json

### [1.3.0] - À venir

- [ ] Frontend - Landing page
- [ ] Frontend - Page classement général
- [ ] Frontend - Page journées

### [2.0.0] - À venir

- [ ] Export complet des 65 saisons
- [ ] Tous les pronostics (~500k)
- [ ] Déploiement GitHub Pages
- [ ] Domaine pronos-potes.fr

---

**Légende** :
- ✅ Ajouté : Nouvelle fonctionnalité
- 🔧 Modifié : Changement dans une fonctionnalité existante
- 🐛 Corrigé : Correction de bug
- 🗑️ Supprimé : Fonctionnalité retirée
- 📊 Données : Modification des données
