#!/usr/bin/env node

/**
 * Calcul des statistiques de carrière pour chaque utilisateur
 * Parcourt tous les standings-general.json pour calculer:
 * - totalPoints
 * - totalPronostics
 * - totalCorrects (bons 1N2)
 * - globalSuccessRate (pourcentage de bons 1N2)
 * - totalParticipations (nombre de saisons jouées)
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

console.log('📊 Calcul des statistiques de carrière des utilisateurs...\n');

// Charger le fichier users.json
const usersFile = path.join(BASE_DIR, 'metadata', 'users.json');
const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
const users = usersData.users;

console.log(`✅ ${users.length} utilisateurs chargés\n`);

// Initialiser les stats pour chaque utilisateur
const userStats = {};
users.forEach(user => {
  userStats[user.id] = {
    id: user.id,
    username: user.username,
    totalPoints: 0,
    totalPronostics: 0,
    totalCorrects: 0,
    totalParticipations: 0,
    seasons: []
  };
});

// Parcourir toutes les compétitions et saisons
let totalSeasonsProcessed = 0;

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

    totalSeasonsProcessed++;

    // Pour chaque joueur dans le classement
    standingsData.ranking.forEach(player => {
      const userId = player.userId;

      if (userStats[userId]) {
        // Ajouter les stats de cette saison
        userStats[userId].totalPoints += player.points || 0;
        userStats[userId].totalPronostics += player.pronostics || 0;
        userStats[userId].totalCorrects += player.bons1N2 || player.corrects || 0;
        userStats[userId].totalParticipations++;
        userStats[userId].seasons.push({
          competition: compCode,
          season: seasonYear,
          points: player.points,
          pronostics: player.pronostics,
          corrects: player.bons1N2 || player.corrects || 0
        });
      }
    });
  });

  console.log(`  ✅ ${compDir}: ${seasons.length} saisons traitées`);
});

console.log(`\n📊 Total: ${totalSeasonsProcessed} saisons analysées\n`);

// Calculer le taux de réussite pour chaque utilisateur
users.forEach(user => {
  const stats = userStats[user.id];

  if (stats.totalPronostics > 0) {
    stats.globalSuccessRate = parseFloat(
      ((stats.totalCorrects / stats.totalPronostics) * 100).toFixed(1)
    );
  } else {
    stats.globalSuccessRate = 0;
  }

  // Mettre à jour l'objet user
  user.totalParticipations = stats.totalParticipations;
  user.careerStats = {
    totalPoints: stats.totalPoints,
    totalPronostics: stats.totalPronostics,
    totalCorrects: stats.totalCorrects,
    globalSuccessRate: stats.globalSuccessRate
  };
});

// Sauvegarder le fichier users.json mis à jour
const updatedUsersData = {
  generated: new Date().toISOString(),
  totalUsers: users.length,
  note: 'Statistiques de carrière calculées à partir de tous les standings-general.json',
  schema: 'v2',
  users: users
};

fs.writeFileSync(usersFile, JSON.stringify(updatedUsersData, null, 2));

console.log('========================================');
console.log('✅ Statistiques calculées !');
console.log('========================================');
console.log('');
console.log(`Fichier mis à jour: ${usersFile}`);
console.log('');
console.log('Top 10 par taux de réussite (min 100 pronostics):');

const topBySuccessRate = users
  .filter(u => u.careerStats.totalPronostics >= 100)
  .sort((a, b) => b.careerStats.globalSuccessRate - a.careerStats.globalSuccessRate)
  .slice(0, 10);

topBySuccessRate.forEach((user, index) => {
  console.log(`  ${index + 1}. ${user.username}: ${user.careerStats.globalSuccessRate}% (${user.careerStats.totalCorrects}/${user.careerStats.totalPronostics})`);
});

console.log('');
console.log('Top 10 par nombre de bons 1N2:');

const topByCorrects = users
  .sort((a, b) => b.careerStats.totalCorrects - a.careerStats.totalCorrects)
  .slice(0, 10);

topByCorrects.forEach((user, index) => {
  console.log(`  ${index + 1}. ${user.username}: ${user.careerStats.totalCorrects} bons 1N2 (${user.careerStats.globalSuccessRate}%)`);
});

console.log('');
