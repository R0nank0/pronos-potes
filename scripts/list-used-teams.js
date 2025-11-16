/**
 * Script pour lister toutes les équipes réellement utilisées dans les matchs
 *
 * Usage: node scripts/list-used-teams.js
 */

const fs = require('fs');
const path = require('path');

// Mapping des compétitions vers leurs répertoires
const COMPETITION_PATHS = {
  'ligue1': 'ligue-1',
  'ldc': 'ligue-champions',
  'ligaeuropa': 'liga-europa',
  'top14': 'top-14',
  'international': 'international'
};

/**
 * Récupérer toutes les saisons pour une compétition
 */
function getSeasons(competitionPath) {
  const fullPath = path.join(__dirname, '..', 'data', competitionPath);

  if (!fs.existsSync(fullPath)) {
    return [];
  }

  return fs.readdirSync(fullPath)
    .filter(item => {
      const itemPath = path.join(fullPath, item);
      return fs.statSync(itemPath).isDirectory() && item.match(/^\d{4}-\d{4}$/);
    });
}

/**
 * Extraire les équipes d'une journée
 */
function extractTeamsFromJournee(journeePath) {
  const teams = new Set();

  try {
    const data = JSON.parse(fs.readFileSync(journeePath, 'utf8'));

    if (data.m && Array.isArray(data.m)) {
      data.m.forEach(match => {
        if (match.t1) teams.add(match.t1);
        if (match.t2) teams.add(match.t2);
      });
    }
  } catch (error) {
    console.error(`Erreur lecture ${journeePath}:`, error.message);
  }

  return teams;
}

/**
 * Analyser toutes les compétitions et saisons
 */
function analyzeAllMatches() {
  const allTeams = new Set();
  const teamsByCompetition = {};
  const teamStats = {};

  console.log('🔍 Analyse des matchs en cours...\n');

  Object.entries(COMPETITION_PATHS).forEach(([compId, compPath]) => {
    console.log(`📂 ${compId.toUpperCase()}`);
    teamsByCompetition[compId] = new Set();

    const seasons = getSeasons(compPath);

    seasons.forEach(season => {
      const journeesDir = path.join(__dirname, '..', 'data', compPath, season, 'journees');

      if (!fs.existsSync(journeesDir)) {
        return;
      }

      const journeeFiles = fs.readdirSync(journeesDir)
        .filter(f => f.endsWith('.json'))
        .sort();

      journeeFiles.forEach(journeeFile => {
        const journeePath = path.join(journeesDir, journeeFile);
        const teams = extractTeamsFromJournee(journeePath);

        teams.forEach(team => {
          allTeams.add(team);
          teamsByCompetition[compId].add(team);

          if (!teamStats[team]) {
            teamStats[team] = {
              name: team,
              competitions: new Set(),
              matchCount: 0
            };
          }

          teamStats[team].competitions.add(compId);
          teamStats[team].matchCount++;
        });
      });
    });

    console.log(`   → ${teamsByCompetition[compId].size} équipes trouvées`);
  });

  // Convertir les Sets en Arrays pour le JSON
  Object.keys(teamStats).forEach(team => {
    teamStats[team].competitions = Array.from(teamStats[team].competitions);
  });

  return {
    allTeams: Array.from(allTeams).sort(),
    teamsByCompetition: Object.fromEntries(
      Object.entries(teamsByCompetition).map(([k, v]) => [k, Array.from(v).sort()])
    ),
    teamStats
  };
}

/**
 * Générer le rapport
 */
function generateReport() {
  const analysis = analyzeAllMatches();

  console.log('\n========================================');
  console.log('📊 RÉSULTATS');
  console.log('========================================\n');

  console.log(`Total équipes uniques: ${analysis.allTeams.length}\n`);

  // Afficher par compétition
  console.log('Par compétition:');
  Object.entries(analysis.teamsByCompetition).forEach(([comp, teams]) => {
    console.log(`  ${comp.padEnd(15)} → ${teams.length} équipes`);
  });

  console.log('\n========================================');
  console.log('🏆 TOP 20 ÉQUIPES LES PLUS UTILISÉES');
  console.log('========================================\n');

  // Trier par nombre de matchs
  const topTeams = Object.values(analysis.teamStats)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 20);

  topTeams.forEach((team, index) => {
    const compsStr = team.competitions.join(', ');
    console.log(`${(index + 1).toString().padStart(2)}. ${team.name.padEnd(25)} → ${team.matchCount.toString().padStart(4)} matchs (${compsStr})`);
  });

  // Sauvegarder les résultats
  const outputPath = path.join(__dirname, 'datasources', 'used-teams.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalTeams: analysis.allTeams.length,
    allTeams: analysis.allTeams,
    teamsByCompetition: analysis.teamsByCompetition,
    teamStats: analysis.teamStats
  }, null, 2));

  console.log(`\n✅ Rapport sauvegardé: ${outputPath}`);

  // Générer la liste pour copier-coller
  console.log('\n========================================');
  console.log('📋 LISTE COMPLÈTE (triée alphabétiquement)');
  console.log('========================================\n');

  analysis.allTeams.forEach(team => {
    const stats = analysis.teamStats[team];
    console.log(`${team.padEnd(30)} (${stats.matchCount} matchs)`);
  });
}

// Exécution
try {
  generateReport();
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
