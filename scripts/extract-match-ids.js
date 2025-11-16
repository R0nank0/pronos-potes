#!/usr/bin/env node

/**
 * Extraction des IDs de matchs par journée et par compétition
 * Génère un fichier texte lisible avec les IDs séparés par des virgules
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(__dirname, 'datasources', 'match-ids-by-journee.txt');

// Mapping des compétitions
const competitions = {
  'ligue-1': 'Ligue 1',
  'ligue-champions': 'Ligue des Champions',
  'liga-europa': 'Liga Europa',
  'top-14': 'TOP 14',
  'international': 'International'
};

console.log('📖 Extraction des IDs de matchs par journée...\n');

let output = [];
output.push('IDs des matchs par journée et par compétition');
output.push('=============================================');
output.push('');

let totalSeasons = 0;
let totalJournees = 0;
let totalMatches = 0;

// Parcourir chaque compétition
Object.keys(competitions).forEach(compDir => {
  const compPath = path.join(BASE_DIR, compDir);

  if (!fs.existsSync(compPath)) {
    return;
  }

  const compName = competitions[compDir];
  output.push('');
  output.push(`${'='.repeat(compName.length + 4)}`);
  output.push(`  ${compName}`);
  output.push(`${'='.repeat(compName.length + 4)}`);
  output.push('');

  // Parcourir chaque saison
  const seasons = fs.readdirSync(compPath)
    .filter(f => fs.statSync(path.join(compPath, f)).isDirectory())
    .sort();

  seasons.forEach(seasonYear => {
    const matchesFile = path.join(compPath, seasonYear, 'matches-all.json');

    if (!fs.existsSync(matchesFile)) {
      return;
    }

    try {
      const matchesData = JSON.parse(fs.readFileSync(matchesFile, 'utf8'));
      const matches = matchesData.matches || [];

      if (matches.length === 0) {
        return;
      }

      totalSeasons++;
      output.push(`${compName} ${seasonYear}`);
      output.push('-'.repeat(`${compName} ${seasonYear}`.length));

      // Grouper les matchs par journée
      const matchesByJournee = {};
      matches.forEach(match => {
        const journee = match.journee;
        if (!matchesByJournee[journee]) {
          matchesByJournee[journee] = [];
        }
        matchesByJournee[journee].push(match.id);
      });

      // Trier par numéro de journée
      const journees = Object.keys(matchesByJournee)
        .map(j => parseInt(j))
        .sort((a, b) => a - b);

      journees.forEach(journee => {
        const matchIds = matchesByJournee[journee];
        const idsStr = matchIds.join(', ');
        output.push(`Journée ${String(journee).padStart(2, ' ')} : ${idsStr}`);
        totalJournees++;
        totalMatches += matchIds.length;
      });

      output.push('');

    } catch (err) {
      console.error(`❌ Erreur lors de la lecture de ${matchesFile}:`, err.message);
    }
  });
});

// Ajouter les statistiques à la fin
output.push('');
output.push('=============================================');
output.push('Statistiques');
output.push('=============================================');
output.push(`Saisons traitées : ${totalSeasons}`);
output.push(`Journées traitées : ${totalJournees}`);
output.push(`Matchs indexés : ${totalMatches}`);
output.push('');

// Écrire le fichier
fs.writeFileSync(OUTPUT_FILE, output.join('\n'));

console.log('✅ Extraction terminée !');
console.log('');
console.log(`📄 Fichier généré : ${OUTPUT_FILE}`);
console.log(`📊 ${totalSeasons} saisons, ${totalJournees} journées, ${totalMatches} matchs`);
console.log('');
