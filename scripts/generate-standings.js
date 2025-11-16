#!/usr/bin/env node

/**
 * Génération du classement général par saison
 * Agrège les points de toutes les journées pour créer standings-general.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');

// Mapping des compétitions
const compMapping = {
  ligue1: 'ligue-1',
  ldc: 'ligue-champions',
  ligaeuropa: 'liga-europa',
  top14: 'top-14',
  international: 'international'
};

console.log('📊 Génération des classements généraux...\n');

let totalSeasons = 0;
let totalGenerated = 0;

// Parcourir toutes les compétitions
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
    const journeesDir = path.join(compPath, seasonYear, 'journees');

    if (!fs.existsSync(journeesDir)) {
      return;
    }

    totalSeasons++;

    console.log(`🔄 Traitement: ${compDir}/${seasonYear}`);

    // Charger toutes les journées
    const journeeFiles = fs.readdirSync(journeesDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    if (journeeFiles.length === 0) {
      console.log(`  ⚠️  Aucune journée trouvée`);
      return;
    }

    // Agréger les points par utilisateur
    const userStats = {}; // { userId: { username, totalPoints, total1N2, totalExactScores, journeesPlayed, bestJournee, worstJournee, totalPronostics } }

    journeeFiles.forEach(journeeFile => {
      const journeePath = path.join(journeesDir, journeeFile);
      const journeeData = JSON.parse(fs.readFileSync(journeePath, 'utf8'));

      const journeeNum = journeeData.j;
      const totalMatchsJournee = journeeData.tm;

      // Parcourir le classement de la journée
      journeeData.cj.forEach(entry => {
        const userId = entry.u;
        const username = entry.un;
        const pointsJournee = entry.pj;
        const bons1N2 = entry.c;        // Nombre de bons 1N2 sur cette journée
        const exactScores = entry.se;   // Nombre de scores exacts sur cette journée

        if (!userStats[userId]) {
          userStats[userId] = {
            userId: userId,
            username: username,
            totalPoints: 0,
            total1N2: 0,
            totalExactScores: 0,
            journeesPlayed: 0,
            bestJournee: { num: journeeNum, points: pointsJournee },
            worstJournee: { num: journeeNum, points: pointsJournee },
            totalPronostics: 0
          };
        }

        userStats[userId].totalPoints += pointsJournee;
        userStats[userId].total1N2 += bons1N2;
        userStats[userId].totalExactScores += exactScores;
        userStats[userId].journeesPlayed++;

        // Mettre à jour meilleure/pire journée
        if (pointsJournee > userStats[userId].bestJournee.points) {
          userStats[userId].bestJournee = { num: journeeNum, points: pointsJournee };
        }
        if (pointsJournee < userStats[userId].worstJournee.points) {
          userStats[userId].worstJournee = { num: journeeNum, points: pointsJournee };
        }
      });

      // Compter le nombre de pronostics par utilisateur sur cette journée
      journeeData.m.forEach(match => {
        match.pr.forEach(prono => {
          const userId = prono.u;
          if (userStats[userId]) {
            userStats[userId].totalPronostics++;
          }
        });
      });
    });

    // Créer le classement général
    const sortedUsers = Object.values(userStats)
      .map((user, index) => ({
        userId: user.userId,
        username: user.username,
        points: user.totalPoints,
        pronostics: user.totalPronostics,
        bons1N2: user.total1N2,
        moyenne1N2: user.journeesPlayed > 0 ? (user.total1N2 / user.journeesPlayed).toFixed(1) : "0.0",
        exactScores: user.totalExactScores,
        tauxExactScores: user.totalPronostics > 0 ? ((user.totalExactScores / user.totalPronostics) * 100).toFixed(1) : "0.0",
        bestJournee: user.bestJournee.num
      }))
      .sort((a, b) => {
        // Tri par points puis par scores exacts
        if (b.points !== a.points) return b.points - a.points;
        return b.exactScores - a.exactScores;
      });

    // Calculer les rangs avec gestion des ex-aequo
    const ranking = [];
    let currentRank = 1;
    for (let i = 0; i < sortedUsers.length; i++) {
      const user = sortedUsers[i];

      // Si ce n'est pas le premier et qu'il a les mêmes points que le précédent, garder le même rang
      if (i > 0) {
        const prevUser = sortedUsers[i - 1];
        if (user.points === prevUser.points) {
          // Ex-aequo : même rang que le précédent (même nombre de points)
          ranking.push({ ...user, rank: ranking[i - 1].rank });
        } else {
          // Nouveau rang = position actuelle (pour sauter les rangs en cas d'ex-aequo)
          ranking.push({ ...user, rank: i + 1 });
          currentRank = i + 1;
        }
      } else {
        // Premier utilisateur
        ranking.push({ ...user, rank: 1 });
      }
    }

    // Créer le fichier standings-general.json
    const standingsData = {
      season: `${compCode}-${seasonYear}`,
      generatedAt: new Date().toISOString(),
      totalRanked: ranking.length,
      ranking: ranking
    };

    const outputPath = path.join(compPath, seasonYear, 'standings-general.json');
    fs.writeFileSync(outputPath, JSON.stringify(standingsData, null, 2));

    console.log(`  ✅ Classement général créé: ${ranking.length} participants`);
    console.log(`  🏆 1er: ${ranking[0].username} avec ${ranking[0].points} points`);
    totalGenerated++;
  });
});

console.log('\n========================================');
console.log('✅ Génération terminée !');
console.log('========================================');
console.log('');
console.log(`Saisons traitées: ${totalSeasons}`);
console.log(`Classements générés: ${totalGenerated}`);
console.log('');
