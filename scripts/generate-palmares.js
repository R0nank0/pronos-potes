#!/usr/bin/env node

/**
 * Génération du palmarès global
 * Liste les victoires de chaque joueur sur toutes les saisons
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');

const compMapping = {
  ligue1: 'ligue-1',
  ldc: 'ligue-champions',
  ligaeuropa: 'liga-europa',
  top14: 'top-14',
  international: 'international'
};

console.log('🏆 Génération du palmarès...\n');

const palmares = {}; // { userId: { username, victories: [{ competition, season, points }] } }

// Parcourir toutes les compétitions et saisons
Object.keys(compMapping).forEach(compCode => {
  const compDir = compMapping[compCode];
  const compPath = path.join(BASE_DIR, compDir);

  if (!fs.existsSync(compPath)) {
    return;
  }

  // Parcourir toutes les saisons
  const seasons = fs.readdirSync(compPath)
    .filter(f => fs.statSync(path.join(compPath, f)).isDirectory())
    .sort();

  seasons.forEach(seasonYear => {
    const standingsFile = path.join(compPath, seasonYear, 'standings-general.json');

    if (!fs.existsSync(standingsFile)) {
      return;
    }

    const standingsData = JSON.parse(fs.readFileSync(standingsFile, 'utf8'));

    if (!standingsData.ranking || standingsData.ranking.length === 0) {
      return;
    }

    // Trouver le(s) vainqueur(s) - rang 1
    const topPoints = standingsData.ranking[0].points;
    const winners = standingsData.ranking.filter(user => user.rank === 1 && user.points === topPoints);

    winners.forEach(winner => {
      if (!palmares[winner.userId]) {
        palmares[winner.userId] = {
          userId: winner.userId,
          username: winner.username,
          victories: []
        };
      }

      palmares[winner.userId].victories.push({
        competition: compCode,
        season: seasonYear,
        points: winner.points,
        pronostics: winner.pronostics
      });

      console.log(`  🏆 ${winner.username} - ${compCode} ${seasonYear} (${winner.points} pts)`);
    });
  });
});

// Trier par nombre de victoires
const palmaresArray = Object.values(palmares)
  .map(player => ({
    ...player,
    totalVictories: player.victories.length
  }))
  .sort((a, b) => b.totalVictories - a.totalVictories);

// Créer le fichier palmares.json
const palmaresData = {
  generated: new Date().toISOString(),
  totalWinners: palmaresArray.length,
  palmares: palmaresArray
};

const outputPath = path.join(BASE_DIR, 'metadata', 'palmares.json');
fs.writeFileSync(outputPath, JSON.stringify(palmaresData, null, 2));

console.log('\n========================================');
console.log('✅ Palmarès généré !');
console.log('========================================');
console.log('');
console.log(`Total vainqueurs: ${palmaresArray.length}`);
console.log('');
console.log('Top 10:');
palmaresArray.slice(0, 10).forEach((player, index) => {
  const stars = '⭐'.repeat(player.totalVictories);
  console.log(`  ${index + 1}. ${player.username} ${stars} (${player.totalVictories} victoire${player.totalVictories > 1 ? 's' : ''})`);
});
console.log('');
console.log(`Fichier créé: ${outputPath}`);
console.log('');
