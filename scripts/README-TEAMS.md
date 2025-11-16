# Gestion des logos d'équipes

## Source unique de vérité : `TEAMS_BY_SEASON.txt`

Tous les logos d'équipes sont définis dans le fichier racine **`TEAMS_BY_SEASON.txt`**.

### Format

```
Saison 2024-2025
----------------------------------------
'Nom Équipe': 'https://upload.wikimedia.org/...',
```

### Workflow

1. **Modifier les logos** : Éditer directement `TEAMS_BY_SEASON.txt`
2. **Générer les métadonnées** : Exécuter `npm run process-teams`
3. **Résultat** : Le fichier `data/metadata/teams.json` est mis à jour

### Fichier généré : `data/metadata/teams.json`

Structure :
```json
{
  "generated": "2025-11-05T20:59:19.634Z",
  "totalTeams": 288,
  "teamsWithLogo": 184,
  "teamsWithoutLogo": 104,
  "coverage": 63.9,
  "teams": [
    {
      "id": 4,
      "name": "Bordeaux",
      "logo": "https://upload.wikimedia.org/..."
    }
  ]
}
```

### Utilisation dans le frontend

Le fichier `public/js/season.js` charge automatiquement `metadata/teams.json` :

```javascript
// Chargement
await loadTeamLogos(); // Charge metadata/teams.json

// Utilisation
const logoUrl = getTeamLogo('Bordeaux'); // Retourne l'URL du logo
```

### Commandes NPM

```bash
# Générer metadata/teams.json depuis TEAMS_BY_SEASON.txt
npm run process-teams
```

### Notes importantes

- ✅ **Une seule source** : `TEAMS_BY_SEASON.txt` → `metadata/teams.json`
- ❌ **Pas de duplication** : Les anciens fichiers `team-logos.json` ont été supprimés
- 🔄 **Cache navigateur** : 24h pour `metadata/teams.json`
- 📊 **Coverage actuel** : 184/288 équipes avec logo (63.9%)

### Équipes sans logo

Les équipes sans logo (104) sont principalement :
- Pays pour compétitions internationales (France, Italie, etc.)
- Équipes de rugby européennes (Munster, Leinster, etc.)
- Quelques anciennes équipes disparues

Ces équipes affichent un placeholder dans l'interface.
