#!/usr/bin/env node

/**
 * Enrichissement des données de saisons avec le nombre réel de journées
 * Utilise saisons.json + journees.json pour créer des métadonnées complètes
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');
const SAISONS_FILE = path.join(__dirname, 'datasources', 'saisons.json');
const JOURNEES_FILE = path.join(__dirname, 'datasources', 'journees.json');

const formatDateTime = (date) => date.toISOString();

// Lire les fichiers sources
console.log('📖 Lecture des fichiers sources...\n');

const saisonsData = JSON.parse(fs.readFileSync(SAISONS_FILE, 'utf8'));
const journeesData = JSON.parse(fs.readFileSync(JOURNEES_FILE, 'utf8'));

// Extraire les données
const seasons = saisonsData.find(item => item.type === 'table' && item.name === 'xfxg_multileague_season').data;
const journees = journeesData.find(item => item.type === 'table' && item.name === 'xfxg_pronostik_rounds').data;

console.log(`✅ ${seasons.length} saisons trouvées`);
console.log(`✅ ${journees.length} journées trouvées\n`);

// Grouper les journées par season_id
const journeesBySeason = {};
journees.forEach(journee => {
  const seasonId = journee.season_id;
  if (!journeesBySeason[seasonId]) {
    journeesBySeason[seasonId] = [];
  }
  journeesBySeason[seasonId].push(journee);
});

// Fonction pour extraire l'année
const extractYear = (name) => {
  const match = name.match(/(\d{4})\s*\/\s*(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  const singleYear = name.match(/(\d{4})/);
  if (singleYear) {
    return singleYear[1];
  }
  return name;
};

// Mapping des compétitions
const competitionMappings = {
  ligue1: { slug: 'ligue1', dir: 'ligue-1', name: 'Ligue 1' },
  ldc: { slug: 'ldc', dir: 'ligue-champions', name: 'Ligue des Champions' },
  ligaeuropa: { slug: 'ligaeuropa', dir: 'liga-europa', name: 'Liga Europa' },
  top14: { slug: 'top14', dir: 'top-14', name: 'TOP 14' },
  international: { slug: 'international', dir: 'international', name: 'International' }
};

// Enrichir chaque saison avec ses journées
console.log('🔄 Enrichissement des données de saisons...\n');

const enrichedSeasons = seasons.map(season => {
  const seasonJournees = journeesBySeason[season.id] || [];
  const year = extractYear(season.name);
  const comp = competitionMappings[season.competition];

  return {
    id: season.id,
    name: season.name,
    year: year,
    competition: season.competition,
    competitionName: comp ? comp.name : season.competition,
    totalJournees: seasonJournees.length,
    publishedJournees: seasonJournees.filter(j => j.published === '1').length,
    activeJournee: seasonJournees.find(j => j.actif === '1')?.round_id || null,
    status: seasonJournees.length > 0 ? (seasonJournees.some(j => j.actif === '1') ? 'ongoing' : 'finished') : 'archived'
  };
});

// Statistiques globales
const totalJournees = enrichedSeasons.reduce((sum, s) => sum + s.totalJournees, 0);

console.log('📊 Statistiques enrichies:\n');
console.log(`  Total journées: ${totalJournees}`);
console.log(`  Moyenne par saison: ${Math.round(totalJournees / seasons.length)}`);
console.log('');

// Grouper par compétition
const byCompetition = enrichedSeasons.reduce((acc, season) => {
  if (!acc[season.competition]) {
    acc[season.competition] = [];
  }
  acc[season.competition].push(season);
  return acc;
}, {});

// Afficher les stats par compétition
Object.entries(byCompetition).forEach(([comp, seasons]) => {
  const totalJourneesComp = seasons.reduce((sum, s) => sum + s.totalJournees, 0);
  const avgJournees = Math.round(totalJourneesComp / seasons.length);
  console.log(`  ${competitionMappings[comp]?.name || comp}:`);
  console.log(`    - ${seasons.length} saisons`);
  console.log(`    - ${totalJourneesComp} journées total`);
  console.log(`    - ${avgJournees} journées/saison en moyenne`);
});

console.log('');

// Générer les métadonnées de saison enrichies
console.log('📝 Génération des métadonnées de saisons...\n');

let createdFiles = 0;

enrichedSeasons.forEach(season => {
  const comp = competitionMappings[season.competition];
  if (!comp) return;

  const seasonDir = path.join(BASE_DIR, comp.dir, season.year);

  // Créer le dossier si nécessaire
  if (!fs.existsSync(seasonDir)) {
    fs.mkdirSync(seasonDir, { recursive: true });
  }

  // Créer le fichier season-meta.json
  const seasonMeta = {
    id: season.id,
    competition: comp.slug,
    year: season.year,
    name: season.name,
    status: season.status,
    journees: season.totalJournees,
    publishedJournees: season.publishedJournees,
    activeJournee: season.activeJournee,
    totalMatches: 0, // À calculer plus tard avec les vraies données
    activeUsers: 0, // À calculer plus tard
    totalPronostics: 0, // À calculer plus tard
    lastUpdate: formatDateTime(new Date()),
    notes: 'Archive statique - données non mises à jour en temps réel',
    schema: 'v2'
  };

  const metaPath = path.join(seasonDir, 'season-meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(seasonMeta, null, 2));
  createdFiles++;

  // Créer le dossier journees
  const journeesDir = path.join(seasonDir, 'journees');
  if (!fs.existsSync(journeesDir)) {
    fs.mkdirSync(journeesDir, { recursive: true });
  }
});

console.log(`  ✅ ${createdFiles} fichiers season-meta.json créés`);
console.log('');

// Mettre à jour l'index global avec les vraies statistiques
console.log('📑 Mise à jour de l\'index global...\n');

const index = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'index.json'), 'utf8'));

index.stats.totalJournees = totalJournees;
index.generated = formatDateTime(new Date());

fs.writeFileSync(path.join(BASE_DIR, 'index.json'), JSON.stringify(index, null, 2));
console.log('  ✅ Index global mis à jour');
console.log('');

// Mettre à jour les index de saisons
console.log('📊 Mise à jour des index de saisons...\n');

Object.entries(byCompetition).forEach(([compKey, seasons]) => {
  const comp = competitionMappings[compKey];
  if (!comp) return;

  const seasonIndexPath = path.join(BASE_DIR, comp.dir, 'seasons-index.json');
  const seasonIndex = JSON.parse(fs.readFileSync(seasonIndexPath, 'utf8'));

  // Enrichir chaque saison dans l'index
  seasonIndex.seasons = seasonIndex.seasons.map(s => {
    const enriched = enrichedSeasons.find(es => es.id === s.id);
    if (!enriched) return s;

    return {
      ...s,
      totalJournees: enriched.totalJournees,
      publishedJournees: enriched.publishedJournees,
      activeJournee: enriched.activeJournee,
      status: enriched.status
    };
  });

  fs.writeFileSync(seasonIndexPath, JSON.stringify(seasonIndex, null, 2));
  console.log(`  ✅ ${comp.name}: ${seasons.length} saisons enrichies`);
});

console.log('');
console.log('========================================');
console.log('✅ Enrichissement terminé !');
console.log('========================================');
console.log('');
console.log('Résumé:');
console.log(`  📊 ${seasons.length} saisons traitées`);
console.log(`  📅 ${totalJournees} journées au total`);
console.log(`  📁 ${createdFiles} fichiers season-meta.json créés`);
console.log('');
console.log('Structure créée:');
enrichedSeasons.slice(0, 3).forEach(season => {
  const comp = competitionMappings[season.competition];
  if (comp) {
    console.log(`  📂 data/${comp.dir}/${season.year}/`);
    console.log(`     ├── season-meta.json (${season.totalJournees} journées)`);
    console.log(`     └── journees/`);
  }
});
console.log('  ...');
console.log('');
console.log('Prochaines étapes:');
console.log('  1. Exporter les matchs depuis MySQL');
console.log('  2. Exporter les pronostics par journée');
console.log('  3. Développer le frontend');
console.log('');
