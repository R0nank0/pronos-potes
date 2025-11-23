# Guide de démarrage rapide - Pronos-Potes

Ce guide vous permet de démarrer rapidement l'export des données depuis votre base MySQL.

## 🎯 Objectif

Extraire 19 années d'historique de pronostics depuis MySQL vers des fichiers JSON optimisés pour un site statique.

## 📋 Prérequis

- Accès à la base MySQL `pronos_potes` (ou équivalent)
- Mysql client installé (`mysql -V`)
- Bash (Linux/Mac) ou Git Bash (Windows)
- *(Optionnel)* `jq` pour valider les JSON

## 🚀 Démarrage en 3 étapes

### Étape 1 : Créer la structure de dossiers

```bash
cd scripts/export-sql
bash create-structure.sh
```

### Étape 2 : Tester la connexion

```bash
bash test-quick-export.sh
```

Cela va exporter uniquement les métadonnées (users, competitions, teams, index) pour vérifier que tout fonctionne.

**Vérifier les résultats :**

```bash
ls -lh test-output/

# Afficher le contenu (si jq est installé)
cat test-output/users.json | jq '.'
cat test-output/index.json | jq '.stats'

# Compter les utilisateurs
cat test-output/users.json | jq '.users | length'
```

### Étape 3 : Export complet

#### 3A. Export des métadonnées globales

```bash
bash export-all.sh
```

Cela va exporter :
- ✅ Utilisateurs (`data/metadata/users.json`)
- ✅ Compétitions (`data/metadata/competitions.json`)
- ✅ Équipes (`data/metadata/teams.json`)
- ✅ Index global (`data/index.json`)
- ✅ Index des saisons par compétition

#### 3B. Export d'une saison complète

```bash
# Ligue 1 2024-2025 (exemple)
bash export-season.sh ligue1 2024-2025

# Ligue 1 2023-2024
bash export-season.sh ligue1 2023-2024

# Ligue des Champions 2024-2025
bash export-season.sh ldc 2024-2025

# TOP 14 2024-2025
bash export-season.sh top14 2024-2025
```

**Cela va créer :**
- Métadonnées de la saison
- Classement général
- Tous les matchs
- Toutes les journées (1 fichier par journée)

## 📊 Vérification des résultats

### Voir l'arborescence créée

```bash
cd ../..  # Retour à la racine
tree -L 3 data/

# Sans tree :
find data/ -type f -name "*.json" | head -20
```

### Vérifier la taille totale

```bash
du -sh data/
du -h data/ | tail -20
```

### Valider un fichier JSON

```bash
# Classement général
cat data/ligue-1/2024-2025/standings-general.json | jq '.ranking | length'

# Détail d'une journée
cat data/ligue-1/2024-2025/journees/01.json | jq '.m | length'
```

## 🔧 Personnalisation

### Adapter les noms de tables

Si vos tables ne commencent pas par `jos_`, modifier les scripts SQL :

```bash
# Exemple : remplacer jos_ par myprefix_
cd scripts/export-sql
sed -i 's/jos_/myprefix_/g' *.sql
```

### Adapter les noms de colonnes

Vérifier le schéma de votre base :

```bash
mysql -u root -p pronos_potes -e "DESCRIBE jos_matches;"
mysql -u root -p pronos_potes -e "DESCRIBE jos_pronostics;"
```

Puis modifier les scripts SQL en conséquence.

Voir [database-schema-example.sql](scripts/export-sql/database-schema-example.sql) pour le schéma attendu.

## 📐 Exporter toutes les saisons automatiquement

Pour exporter toutes les saisons d'une compétition :

```bash
# Ligue 1 : 2005-2006 à 2024-2025 (19 saisons)
for year in {2005..2024}; do
  season="$year-$((year+1))"
  echo "Export de la saison $season..."
  bash export-season.sh ligue1 $season
done
```

## ⚠️ Problèmes courants

### "Access denied"

```bash
# Vérifier les droits
mysql -u root -p -e "SHOW GRANTS;"
```

### "Unknown database"

```bash
# Lister les bases disponibles
mysql -u root -p -e "SHOW DATABASES;"

# Modifier DB_NAME dans les scripts si nécessaire
```

### "Table doesn't exist"

```bash
# Lister les tables
mysql -u root -p pronos_potes -e "SHOW TABLES;"

# Adapter les noms dans les scripts SQL
```

### Export vide

```sql
-- Vérifier qu'il y a des données
SELECT COUNT(*) FROM jos_matches WHERE season = '2024-2025';
SELECT COUNT(*) FROM jos_pronostics;
```

## 📚 Documentation complète

- [README.md](README.md) : Vue d'ensemble du projet
- [scripts/export-sql/README.md](scripts/export-sql/README.md) : Documentation des scripts SQL

## 🎯 Prochaines étapes

Après avoir exporté vos données :

1. ✅ Valider l'intégrité des JSON
2. ⏭️ Développer le frontend HTML/CSS/JS
3. ⏭️ Déployer sur GitHub Pages

---

**Besoin d'aide ?**
- Consulter [scripts/export-sql/README.md](scripts/export-sql/README.md)
- Vérifier [database-schema-example.sql](scripts/export-sql/database-schema-example.sql)
