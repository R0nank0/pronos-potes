#!/usr/bin/env node

/**
 * Générateur d'index à partir des vraies données de saisons
 * Utilise le fichier xfxg_multileague_season.json exporté de la base
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');
const SOURCE_FILE = path.join(__dirname, 'datasources', 'saisons.json');

const formatDateTime = (date) => date.toISOString();

// Lire le fichier source
console.log('📖 Lecture du fichier des saisons...');
const rawData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

// Extraire les données (le format PHPMyAdmin inclut des métadonnées)
const seasonsData = rawData.find(item => item.type === 'table' && item.name === 'xfxg_multileague_season');
if (!seasonsData || !seasonsData.data) {
  console.error('❌ Erreur: Format de fichier invalide');
  process.exit(1);
}

const seasons = seasonsData.data;
console.log(`✅ ${seasons.length} saisons trouvées\n`);

// Grouper par compétition
const competitionGroups = {
  ligue1: [],
  ldc: [],
  ligaeuropa: [],
  top14: [],
  international: []
};

seasons.forEach(season => {
  const comp = season.competition;
  if (competitionGroups[comp]) {
    competitionGroups[comp].push(season);
  }
});

// Statistiques
console.log('📊 Statistiques par compétition:');
Object.entries(competitionGroups).forEach(([comp, seasons]) => {
  console.log(`  ${comp}: ${seasons.length} saisons`);
});
console.log('');

// Fonction pour extraire l'année d'une saison
const extractYear = (name) => {
  // Chercher un pattern comme "2024 / 2025" ou "2024/2025"
  const match = name.match(/(\d{4})\s*\/\s*(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }

  // Chercher un pattern comme "2024"
  const singleYear = name.match(/(\d{4})/);
  if (singleYear) {
    return singleYear[1];
  }

  return name;
};

// Générer l'index global
console.log('📑 Génération de l\'index global...');

const index = {
  version: '2.0',
  generated: formatDateTime(new Date()),
  compressionMethod: 'none-for-index',
  stats: {
    totalCompetitions: 5,
    totalSeasons: seasons.length,
    totalJournees: 0, // À calculer plus tard avec les vraies données
    totalUsers: 0, // À calculer plus tard
    totalMatches: 0, // À calculer plus tard
    totalPronostics: 0, // À calculer plus tard
    estimatedSize: '15MB gzip'
  },
  competitions: [
    {
      id: 'ligue1',
      name: 'Ligue 1',
      type: 'football',
      country: 'France',
      seasons: competitionGroups.ligue1
        .map(s => extractYear(s.name))
        .filter((year, index, self) => self.indexOf(year) === index)
        .sort((a, b) => {
          // Tri par année décroissante
          const yearA = parseInt(a.split('-')[0]);
          const yearB = parseInt(b.split('-')[0]);
          return yearB - yearA;
        })
    },
    {
      id: 'ldc',
      name: 'Ligue des Champions',
      type: 'football',
      country: 'Europe',
      seasons: competitionGroups.ldc
        .map(s => extractYear(s.name))
        .filter((year, index, self) => self.indexOf(year) === index)
        .sort((a, b) => {
          const yearA = parseInt(a.split('-')[0]);
          const yearB = parseInt(b.split('-')[0]);
          return yearB - yearA;
        })
    },
    {
      id: 'ligaeuropa',
      name: 'Liga Europa',
      type: 'football',
      country: 'Europe',
      seasons: competitionGroups.ligaeuropa
        .map(s => extractYear(s.name))
        .filter((year, index, self) => self.indexOf(year) === index)
        .sort((a, b) => {
          const yearA = parseInt(a.split('-')[0]);
          const yearB = parseInt(b.split('-')[0]);
          return yearB - yearA;
        })
    },
    {
      id: 'top14',
      name: 'TOP 14',
      type: 'rugby',
      country: 'France',
      seasons: competitionGroups.top14
        .map(s => extractYear(s.name))
        .filter((year, index, self) => self.indexOf(year) === index)
        .sort((a, b) => {
          const yearA = parseInt(a.split('-')[0]);
          const yearB = parseInt(b.split('-')[0]);
          return yearB - yearA;
        })
    },
    {
      id: 'international',
      name: 'International',
      type: 'multi',
      country: 'Multi',
      seasons: competitionGroups.international
        .map(s => s.name) // Garder le nom complet pour les événements internationaux
        .sort((a, b) => {
          // Trier par année décroissante
          const yearA = parseInt(a.match(/(\d{4})/)?.[1] || '0');
          const yearB = parseInt(b.match(/(\d{4})/)?.[1] || '0');
          return yearB - yearA;
        })
    }
  ]
};

// Créer le dossier si nécessaire
if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

const indexPath = path.join(BASE_DIR, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
console.log(`✅ Index global créé: ${indexPath}\n`);

// Générer les index de saisons par compétition
console.log('📊 Génération des index par compétition...\n');

const competitionMappings = {
  ligue1: { slug: 'ligue1', dir: 'ligue-1', name: 'Ligue 1' },
  ldc: { slug: 'ldc', dir: 'ligue-champions', name: 'Ligue des Champions' },
  ligaeuropa: { slug: 'ligaeuropa', dir: 'liga-europa', name: 'Liga Europa' },
  top14: { slug: 'top14', dir: 'top-14', name: 'TOP 14' },
  international: { slug: 'international', dir: 'international', name: 'International' }
};

Object.entries(competitionGroups).forEach(([compKey, seasons]) => {
  const mapping = competitionMappings[compKey];
  const compDir = path.join(BASE_DIR, mapping.dir);

  if (!fs.existsSync(compDir)) {
    fs.mkdirSync(compDir, { recursive: true });
  }

  // Créer l'index des saisons
  const seasonsIndex = {
    competition: mapping.slug,
    name: mapping.name,
    totalSeasons: seasons.length,
    seasons: seasons.map(season => {
      const year = extractYear(season.name);

      return {
        id: season.id,
        year: year,
        name: season.name,
        status: 'archived', // Toutes les saisons sont archivées
        competition: mapping.slug,
        dataPath: `./${year}/`
      };
    }).sort((a, b) => {
      // Tri par année décroissante
      const yearA = parseInt(a.year.match(/(\d{4})/)?.[1] || '0');
      const yearB = parseInt(b.year.match(/(\d{4})/)?.[1] || '0');
      return yearB - yearA;
    })
  };

  const seasonIndexPath = path.join(compDir, 'seasons-index.json');
  fs.writeFileSync(seasonIndexPath, JSON.stringify(seasonsIndex, null, 2));
  console.log(`  ✅ ${mapping.name}: ${seasons.length} saisons`);
});

console.log('');
console.log('========================================');
console.log('✅ Génération terminée !');
console.log('========================================');
console.log('');
console.log('Fichiers créés :');
console.log(`  📄 ${BASE_DIR}/index.json`);
console.log(`  📄 ${BASE_DIR}/ligue-1/seasons-index.json`);
console.log(`  📄 ${BASE_DIR}/ligue-champions/seasons-index.json`);
console.log(`  📄 ${BASE_DIR}/top-14/seasons-index.json`);
console.log(`  📄 ${BASE_DIR}/international/seasons-index.json`);
console.log('');
console.log('Résumé des saisons :');
console.log(`  Ligue 1: ${competitionGroups.ligue1.length} saisons (${competitionGroups.ligue1[0]?.name} → ${competitionGroups.ligue1[competitionGroups.ligue1.length-1]?.name})`);
console.log(`  Ligue des Champions: ${competitionGroups.ldc.length} saisons`);
console.log(`  TOP 14: ${competitionGroups.top14.length} saisons`);
console.log(`  International: ${competitionGroups.international.length} événements`);
console.log(`  TOTAL: ${seasons.length} saisons`);
console.log('');
