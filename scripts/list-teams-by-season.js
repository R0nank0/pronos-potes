const fs = require('fs');
const path = require('path');

// Charger le statut des logos depuis metadata/teams.json
const teamLogosPath = path.join(__dirname, '../data/metadata/teams.json');
let teamLogos = { teams: [] };

if (fs.existsSync(teamLogosPath)) {
  teamLogos = JSON.parse(fs.readFileSync(teamLogosPath, 'utf8'));
}

function hasLogo(teamName) {
  const team = teamLogos.teams.find(t => t.name === teamName);
  return team && team.logo;
}

function getSeasons(competition) {
  const competitionPath = path.join(__dirname, `../data/${competition}`);
  if (!fs.existsSync(competitionPath)) return [];

  return fs.readdirSync(competitionPath)
    .filter(item => {
      const itemPath = path.join(competitionPath, item);
      return fs.statSync(itemPath).isDirectory() && /^\d{4}-\d{4}$/.test(item);
    })
    .sort((a, b) => b.localeCompare(a)); // Ordre décroissant
}

function getTeamsFromSeason(competition, season) {
  const matchesPath = path.join(__dirname, `../data/${competition}/${season}/matches-all.json`);
  if (!fs.existsSync(matchesPath)) return [];

  const matchesData = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));
  const teams = new Set();

  if (matchesData.matches) {
    matchesData.matches.forEach(match => {
      if (match.homeTeam) teams.add(match.homeTeam);
      if (match.awayTeam) teams.add(match.awayTeam);
      // Support ancien format aussi
      if (match.team1) teams.add(match.team1);
      if (match.team2) teams.add(match.team2);
    });
  }

  return Array.from(teams).sort();
}

// Mapping des compétitions
const competitions = {
  'ligue-1': 'Ligue 1',
  'ligue-champions': 'Ligue des Champions',
  'liga-europa': 'Liga Europa',
  'top-14': 'TOP 14'
};

// Stocker toutes les équipes déjà affichées
const allTeamsShown = new Set();

let output = '';
output += '// ========================================\n';
output += '// ÉQUIPES PAR COMPÉTITION ET PAR SAISON\n';
output += '// Format: \'Nom Équipe\': \'\', (à compléter)\n';
output += '// ========================================\n\n';

for (const [competitionKey, competitionName] of Object.entries(competitions)) {
  output += `\n${'='.repeat(60)}\n`;
  output += `${competitionName.toUpperCase()}\n`;
  output += `${'='.repeat(60)}\n\n`;

  const seasons = getSeasons(competitionKey);

  if (seasons.length === 0) {
    output += `Aucune saison trouvée\n`;
    continue;
  }

  for (const season of seasons) {
    const teams = getTeamsFromSeason(competitionKey, season);

    if (teams.length === 0) continue;

    // Filtrer les équipes déjà affichées dans cette compétition
    const newTeams = teams.filter(team => !allTeamsShown.has(team));

    if (newTeams.length === 0) continue;

    output += `\nSaison ${season}\n`;
    output += `${'-'.repeat(40)}\n`;

    for (const team of newTeams) {
      output += `'${team}': '',\n`;
      allTeamsShown.add(team);
    }
  }
}

// Statistiques finales
output += `\n\n${'='.repeat(60)}\n`;
output += `STATISTIQUES\n`;
output += `${'='.repeat(60)}\n`;
output += `Total équipes uniques: ${allTeamsShown.size}\n`;

const teamsWithLogos = Array.from(allTeamsShown).filter(team => hasLogo(team)).length;
const teamsMissingLogos = allTeamsShown.size - teamsWithLogos;

output += `✅ Logos configurés: ${teamsWithLogos}\n`;
output += `❌ Logos manquants: ${teamsMissingLogos}\n`;
output += `Coverage: ${((teamsWithLogos / allTeamsShown.size) * 100).toFixed(1)}%\n`;

// Sauvegarder le résultat
const outputPath = path.join(__dirname, '../TEAMS_BY_SEASON.txt');
fs.writeFileSync(outputPath, output, 'utf8');

console.log(`✅ Fichier généré: ${outputPath}`);
console.log(`📊 ${allTeamsShown.size} équipes uniques trouvées`);
console.log(`✅ ${teamsWithLogos} avec logo (${((teamsWithLogos / allTeamsShown.size) * 100).toFixed(1)}%)`);
console.log(`❌ ${teamsMissingLogos} sans logo (${((teamsMissingLogos / allTeamsShown.size) * 100).toFixed(1)}%)`);
