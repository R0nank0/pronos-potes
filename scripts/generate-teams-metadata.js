#!/usr/bin/env node

/**
 * Génération du fichier metadata/teams.json avec les logos
 * À partir de datasources/teams.json et TEAMS_BY_SEASON.txt
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'data');
const TEAMS_SOURCE = path.join(__dirname, 'datasources', 'teams.json');
const LOGOS_SOURCE = path.join(__dirname, '..', 'TEAMS_BY_SEASON.txt');

console.log('🏆 Génération du fichier teams.json avec logos...\n');

// Parse le fichier TEAMS_BY_SEASON.txt pour extraire les logos
function parseLogosFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const logos = {};

  // Regex pour matcher les lignes : 'Nom Équipe': 'URL',
  const regex = /'([^']+)':\s*'([^']+)'/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const teamName = match[1];
    const logoUrl = match[2];

    // Ne garder que les URLs valides (pas les '' vides)
    if (logoUrl && logoUrl.trim() !== '') {
      logos[teamName] = logoUrl;
    }
  }

  return logos;
}

// Charger les logos depuis TEAMS_BY_SEASON.txt
const logos = parseLogosFile(LOGOS_SOURCE);
console.log(`📸 ${Object.keys(logos).length} logos trouvés dans TEAMS_BY_SEASON.txt\n`);

// Charger les équipes depuis datasources/teams.json
const teamsSourceRaw = JSON.parse(fs.readFileSync(TEAMS_SOURCE, 'utf8'));
const tableData = teamsSourceRaw.find(item => item.type === 'table' && item.name === 'xfxg_multileague_team');

if (!tableData || !tableData.data) {
  console.error('❌ Structure teams.json non reconnue');
  process.exit(1);
}

const teams = tableData.data.map(team => ({
  id: parseInt(team.id),
  name: team.team_name,
  logo: logos[team.team_name] || null
}));

console.log(`✅ ${teams.length} équipes chargées depuis teams.json\n`);

// Statistiques
const teamsWithLogo = teams.filter(t => t.logo !== null).length;
const teamsWithoutLogo = teams.filter(t => t.logo === null).length;

console.log('📊 Statistiques:');
console.log(`  Équipes avec logo: ${teamsWithLogo}`);
console.log(`  Équipes sans logo: ${teamsWithoutLogo}`);
console.log(`  Coverage: ${((teamsWithLogo / teams.length) * 100).toFixed(1)}%\n`);

// Liste des équipes sans logo
if (teamsWithoutLogo > 0) {
  console.log('⚠️  Équipes sans logo:');
  teams
    .filter(t => t.logo === null)
    .slice(0, 20) // Limiter à 20 pour l'affichage
    .forEach(team => {
      console.log(`  - ${team.name}`);
    });

  if (teamsWithoutLogo > 20) {
    console.log(`  ... et ${teamsWithoutLogo - 20} autres\n`);
  } else {
    console.log('');
  }
}

// Créer le fichier metadata/teams.json
const outputData = {
  generated: new Date().toISOString(),
  totalTeams: teams.length,
  teamsWithLogo,
  teamsWithoutLogo,
  coverage: parseFloat(((teamsWithLogo / teams.length) * 100).toFixed(1)),
  teams: teams
};

const metadataDir = path.join(BASE_DIR, 'metadata');
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

const outputPath = path.join(metadataDir, 'teams.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

console.log('========================================');
console.log('✅ Fichier teams.json généré !');
console.log('========================================\n');
console.log(`Fichier: ${outputPath}`);
console.log(`Total équipes: ${teams.length}`);
console.log(`Avec logo: ${teamsWithLogo} (${((teamsWithLogo / teams.length) * 100).toFixed(1)}%)`);
console.log(`Sans logo: ${teamsWithoutLogo}\n`);
