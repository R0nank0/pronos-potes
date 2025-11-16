#!/usr/bin/env node

/**
 * Génération de l'historique du classement général journée par journée
 * Permet de voir l'évolution du classement au fil de la saison
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

console.log('📈 Génération de l\'historique des classements...\n');

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

    // Stocker l'historique du classement
    const standingsHistory = {
      season: `${compCode}-${seasonYear}`,
      generatedAt: new Date().toISOString(),
      totalJournees: journeeFiles.length,
      history: [] // [ { journee: 1, standings: [...] }, ... ]
    };

    // Agréger les points cumulés journée par journée
    const cumulativePoints = {}; // { userId: { username, points: [...], corrects: [...] } }

    journeeFiles.forEach((journeeFile, index) => {
      const journeePath = path.join(journeesDir, journeeFile);
      const journeeData = JSON.parse(fs.readFileSync(journeePath, 'utf8'));

      const journeeNum = journeeData.j;

      // Mettre à jour les points cumulés
      journeeData.cj.forEach(entry => {
        const userId = entry.u;
        const username = entry.un;
        const pointsJournee = entry.pj;
        const corrects = entry.c;

        if (!cumulativePoints[userId]) {
          cumulativePoints[userId] = {
            userId: userId,
            username: username,
            points: [],
            corrects: [],
            totalPoints: 0,
            totalCorrects: 0
          };
        }

        // Ajouter les points de cette journée au total
        cumulativePoints[userId].totalPoints += pointsJournee;
        cumulativePoints[userId].totalCorrects += corrects;
        cumulativePoints[userId].points.push(pointsJournee);
        cumulativePoints[userId].corrects.push(corrects);
      });

      // Créer le classement cumulé à cette journée avec gestion des ex-aequo
      const sortedUsers = Object.values(cumulativePoints)
        .map(user => ({
          userId: user.userId,
          username: user.username,
          points: user.totalPoints,
          corrects: user.totalCorrects
        }))
        .sort((a, b) => {
          // Tri par points puis par corrects
          if (b.points !== a.points) return b.points - a.points;
          return b.corrects - a.corrects;
        });

      // Calculer les rangs avec gestion des ex-aequo
      const standingsAtThisJournee = [];
      for (let i = 0; i < sortedUsers.length; i++) {
        const user = sortedUsers[i];

        // Si ce n'est pas le premier et qu'il a les mêmes points que le précédent, garder le même rang
        if (i > 0) {
          const prevUser = sortedUsers[i - 1];
          if (user.points === prevUser.points) {
            // Ex-aequo : même rang que le précédent (même nombre de points)
            standingsAtThisJournee.push({
              rank: standingsAtThisJournee[i - 1].rank,
              userId: user.userId,
              username: user.username,
              points: user.points,
              corrects: user.corrects
            });
          } else {
            // Nouveau rang = position actuelle (pour sauter les rangs en cas d'ex-aequo)
            standingsAtThisJournee.push({
              rank: i + 1,
              userId: user.userId,
              username: user.username,
              points: user.points,
              corrects: user.corrects
            });
          }
        } else {
          // Premier utilisateur
          standingsAtThisJournee.push({
            rank: 1,
            userId: user.userId,
            username: user.username,
            points: user.points,
            corrects: user.corrects
          });
        }
      }

      // Ajouter ce classement à l'historique
      standingsHistory.history.push({
        journee: journeeNum,
        standings: standingsAtThisJournee
      });
    });

    // Créer le fichier standings-history.json
    const outputPath = path.join(compPath, seasonYear, 'standings-history.json');
    fs.writeFileSync(outputPath, JSON.stringify(standingsHistory, null, 2));

    console.log(`  ✅ Historique créé: ${journeeFiles.length} journées`);
    console.log(`  📊 ${Object.keys(cumulativePoints).length} participants`);
    totalGenerated++;
  });
});

console.log('\n========================================');
console.log('✅ Génération terminée !');
console.log('========================================');
console.log('');
console.log(`Saisons traitées: ${totalSeasons}`);
console.log(`Historiques générés: ${totalGenerated}`);
console.log('');
