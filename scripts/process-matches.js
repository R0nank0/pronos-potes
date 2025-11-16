#!/usr/bin/env node

/**
 * Traitement des fichiers de matchs pour générer matches-all.json par saison
 * Utilise les fichiers matches-{competition}-{year}.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');
const DATASOURCES_DIR = path.join(__dirname, 'datasources');

// Fonction pour vérifier si un fichier doit être retraité
function needsProcessing(sourceFile, outputFile) {
  if (!fs.existsSync(outputFile)) {
    return { needed: true, reason: '🆕 nouveau' };
  }
  const sourceStats = fs.statSync(sourceFile);
  const outputStats = fs.statSync(outputFile);
  if (sourceStats.mtime > outputStats.mtime) {
    return { needed: true, reason: '🔄 modifié' };
  }
  return { needed: false, reason: '✅ déjà traité' };
}

console.log('📖 Recherche des fichiers de matchs...\n');

// Trouver tous les fichiers de matchs
const matchFiles = fs.readdirSync(DATASOURCES_DIR)
  .filter(f => f.startsWith('matches-') && f.endsWith('.json'));

console.log(`✅ ${matchFiles.length} fichier(s) trouvé(s):`);
matchFiles.forEach(f => console.log(`  - ${f}`));
console.log('');

// Parser un fichier de matchs
function parseMatchFile(filename) {
  const filePath = path.join(DATASOURCES_DIR, filename);
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Extraire les données (format PHPMyAdmin)
  const tableData = rawData.find(item => item.type === 'table' && item.name === 'xfxg_multileague_game');

  if (!tableData || !tableData.data) {
    console.error(`❌ Erreur: Format invalide dans ${filename}`);
    return null;
  }

  return tableData.data;
}

// Grouper les matchs par season_id
function groupMatchesBySeason(matches) {
  const grouped = {};

  matches.forEach(match => {
    const seasonId = match.season_id;
    if (!grouped[seasonId]) {
      grouped[seasonId] = [];
    }
    grouped[seasonId].push(match);
  });

  return grouped;
}

// Charger le fichier des équipes
let teamMap = {};
try {
  const teamsFile = path.join(DATASOURCES_DIR, 'teams.json');
  const teamsData = JSON.parse(fs.readFileSync(teamsFile, 'utf8'));
  const teams = teamsData.find(item => item.type === 'table' && item.name === 'xfxg_multileague_team').data;

  teams.forEach(team => {
    teamMap[team.id] = team.team_name;
  });

  console.log(`✅ ${Object.keys(teamMap).length} équipes chargées\n`);
} catch (err) {
  console.warn('⚠️  Fichier teams.json non trouvé, utilisation des IDs\n');
}

// Formater un match pour l'export
function formatMatch(match) {
  return {
    id: parseInt(match.id),
    journee: parseInt(match.week),
    date: match.match_start_time,
    homeTeam: teamMap[match.home_team] || `Team ${match.home_team}`,
    awayTeam: teamMap[match.away_team] || `Team ${match.away_team}`,
    homeScore: parseInt(match.home_team_score) || 0,
    awayScore: parseInt(match.away_team_score) || 0,
    status: match.game_status === '1' ? 'finished' : 'upcoming'
  };
}

// Charger les informations de saisons
const saisonsFile = path.join(DATASOURCES_DIR, 'saisons.json');
const saisonsData = JSON.parse(fs.readFileSync(saisonsFile, 'utf8'));
const seasons = saisonsData.find(item => item.type === 'table' && item.name === 'xfxg_multileague_season').data;

// Créer un mapping season_id -> saison
const seasonMap = {};
seasons.forEach(season => {
  seasonMap[season.id] = {
    id: season.id,
    name: season.name,
    competition: season.competition,
    year: extractYear(season.name)
  };
});

// Fonction pour extraire l'année
function extractYear(name) {
  const match = name.match(/(\d{4})\s*\/\s*(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  const singleYear = name.match(/(\d{4})/);
  if (singleYear) {
    return singleYear[1];
  }
  return name.replace(/[^\d-]/g, '').substring(0, 9);
}

// Traiter chaque fichier de matchs
let totalProcessed = 0;
let totalSkipped = 0;

matchFiles.forEach(filename => {
  console.log(`\n🔄 Traitement de ${filename}...`);

  const matches = parseMatchFile(filename);
  if (!matches) return;

  const grouped = groupMatchesBySeason(matches);

  Object.entries(grouped).forEach(([seasonId, seasonMatches]) => {
    const seasonInfo = seasonMap[seasonId];

    if (!seasonInfo) {
      console.warn(`  ⚠️  Saison ID ${seasonId} non trouvée dans saisons.json`);
      return;
    }

    // Déterminer le chemin de sortie
    const compMapping = {
      'ligue1': 'ligue-1',
      'ldc': 'ligue-champions',
      'ligaeuropa': 'liga-europa',
      'top14': 'top-14',
      'international': 'international'
    };

    const compDir = compMapping[seasonInfo.competition];
    if (!compDir) {
      console.warn(`  ⚠️  Compétition inconnue: ${seasonInfo.competition}`);
      return;
    }

    const outputDir = path.join(BASE_DIR, compDir, seasonInfo.year);

    if (!fs.existsSync(outputDir)) {
      console.warn(`  ⚠️  Dossier non trouvé: ${outputDir}`);
      return;
    }

    const outputPath = path.join(outputDir, 'matches-all.json');
    const sourceFile = path.join(DATASOURCES_DIR, filename);

    // Vérifier si le fichier doit être retraité
    const check = needsProcessing(sourceFile, outputPath);

    if (!check.needed) {
      console.log(`  ${check.reason} ${seasonInfo.name}`);
      totalSkipped++;
      return;
    }

    // Formater les matchs
    const formattedMatches = seasonMatches
      .map(formatMatch)
      .sort((a, b) => a.journee - b.journee || a.id - b.id);

    // Créer le fichier matches-all.json
    const matchesAll = {
      season: `${seasonInfo.competition}-${seasonInfo.year}`,
      seasonId: seasonInfo.id,
      seasonName: seasonInfo.name,
      totalMatches: formattedMatches.length,
      totalJournees: Math.max(...formattedMatches.map(m => m.journee)),
      note: 'Team IDs need to be mapped to team names',
      matches: formattedMatches
    };

    fs.writeFileSync(outputPath, JSON.stringify(matchesAll, null, 2));

    console.log(`  ${check.reason} ${seasonInfo.name}: ${formattedMatches.length} matchs`);
    console.log(`     → ${outputPath}`);
    totalProcessed++;
  });
});

console.log('');
console.log('========================================');
console.log('✅ Traitement terminé !');
console.log('========================================');
console.log('');
console.log(`Traités: ${totalProcessed} fichier(s)`);
console.log(`Ignorés: ${totalSkipped} fichier(s) (déjà à jour)`);
console.log(`Total: ${totalProcessed + totalSkipped} fichier(s) matches-all.json`);
console.log(`Équipes mappées: ${Object.keys(teamMap).length}`);
console.log('');
