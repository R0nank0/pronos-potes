# Générateur de données mockées

Ce script Node.js génère une structure complète de données JSON d'exemple pour tester le frontend sans avoir besoin d'une base MySQL.

## 🎯 Utilisation

```bash
# Depuis la racine du projet
node scripts/generate-mock-data.js
```

## 📦 Ce qui est généré

Le script crée automatiquement :

### 1. Métadonnées globales (`data/metadata/`)

- **`users.json`** : 50 utilisateurs fictifs avec statistiques carrière
- **`competitions.json`** : 4 compétitions (Ligue 1, LdC, TOP 14, International)
- **`teams.json`** : 18 équipes de Ligue 1

### 2. Index (`data/`)

- **`index.json`** : Index global du site avec statistiques

### 3. Ligue 1 2024-2025 (`data/ligue-1/2024-2025/`)

- **`seasons-index.json`** : Index de toutes les saisons
- **`season-meta.json`** : Métadonnées de la saison 2024-2025
- **`standings-general.json`** : Classement général de 50 utilisateurs
- **`matches-all.json`** : 90 matchs (10 journées × 9 matchs)
- **`journees/01.json`** à **`journees/10.json`** : Détails de chaque journée avec pronostics

## 📊 Données générées

| Type | Quantité | Taille estimée |
|------|----------|----------------|
| Utilisateurs | 50 | ~15 KB |
| Équipes | 18 | ~2 KB |
| Matchs | 90 | ~10 KB |
| Journées | 10 | ~150 KB |
| Pronostics | ~45 000 | - |
| **Total** | - | **~200 KB** |

## 🎲 Caractéristiques des données

### Utilisateurs
- Noms réalistes français
- Dates d'inscription entre 2005 et 2020
- Statistiques carrière cohérentes
- Taux de réussite entre 25% et 40%

### Matchs
- 9 matchs par journée
- Scores réalistes (0-4 buts)
- Dates hebdomadaires (samedi)
- Statut : "finished"

### Pronostics
- Chaque utilisateur a pronostiqué tous les matchs
- Répartition aléatoire : 1, X, 2
- Points : 3 points si correct, 0 sinon
- Compression des clés (u, p, c, pts)

### Classements
- Classement général trié par points
- Classement par journée
- Statistiques : points, taux de réussite, meilleure/pire journée

## 🔧 Personnalisation

Modifier les constantes dans le script :

```javascript
const NUM_USERS = 50;        // Nombre d'utilisateurs (max: 50)
const NUM_JOURNEES = 10;     // Nombre de journées (1-38)
const CURRENT_SEASON = '2024-2025';
```

Puis relancer :

```bash
node scripts/generate-mock-data.js
```

## ✅ Validation

### Vérifier les fichiers générés

```bash
# Voir l'arborescence
tree -L 3 data/

# Ou sans tree :
find data/ -type f -name "*.json"
```

### Valider le JSON

```bash
# Index global
cat data/index.json | jq '.'

# Compter les utilisateurs
cat data/metadata/users.json | jq '.users | length'

# Voir le classement
cat data/ligue-1/2024-2025/standings-general.json | jq '.ranking[:5]'

# Détail d'une journée
cat data/ligue-1/2024-2025/journees/01.json | jq '{journee: .j, matches: .tm, pronostics: .tp}'
```

### Vérifier la taille

```bash
du -sh data/
du -h data/ | sort -h
```

## 🚀 Utilisation avec le frontend

Une fois les données générées, vous pouvez :

1. **Démarrer un serveur local** :
   ```bash
   # Serveur HTTP simple (Python)
   python3 -m http.server 8000

   # Ou avec Node.js
   npx http-server -p 8000
   ```

2. **Accéder aux données via fetch** :
   ```javascript
   // Charger l'index
   const index = await fetch('/data/index.json').then(r => r.json());

   // Charger le classement
   const standings = await fetch('/data/ligue-1/2024-2025/standings-general.json')
     .then(r => r.json());

   // Charger une journée
   const journee1 = await fetch('/data/ligue-1/2024-2025/journees/01.json')
     .then(r => r.json());
   ```

## 🔄 Régénération

Pour régénérer les données :

```bash
# Supprimer les anciennes données
rm -rf data/

# Régénérer
node scripts/generate-mock-data.js
```

## 📋 Structure exacte générée

```
data/
├── index.json                          # Index global (5 KB)
├── metadata/
│   ├── users.json                      # 50 utilisateurs (15 KB)
│   ├── competitions.json               # 4 compétitions (2 KB)
│   └── teams.json                      # 18 équipes (2 KB)
├── ligue-1/
│   ├── seasons-index.json              # Index saisons (2 KB)
│   └── 2024-2025/
│       ├── season-meta.json            # Métadonnées (2 KB)
│       ├── standings-general.json      # Classement (20 KB)
│       ├── matches-all.json            # 90 matchs (10 KB)
│       └── journees/
│           ├── 01.json                 # Journée 1 (15 KB)
│           ├── 02.json
│           └── ...
│           └── 10.json                 # Journée 10
├── ligue-champions/                    # (vide pour l'instant)
├── top-14/                             # (vide pour l'instant)
└── international/                      # (vide pour l'instant)
```

## 🎨 Prochaines étapes

Après avoir généré les données :

1. ✅ Données mockées disponibles
2. ⏭️ Développer le frontend HTML/CSS/JS
3. ⏭️ Créer la page d'accueil
4. ⏭️ Créer la page classement
5. ⏭️ Créer la page journées

---

**Note** : Ce script génère des données **fictives** pour tester le frontend. Pour les vraies données, utiliser les scripts SQL dans `scripts/export-sql/`.
