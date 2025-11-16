#!/usr/bin/env node

/**
 * Calcul des statistiques de carrière pour tous les utilisateurs
 * Parcourt tous les standings-general.json de toutes les saisons
 * et agrège les stats par utilisateur
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'data');

const competitions = {
  'ligue-1': 'Ligue 1',
  'ligue-champions': 'Ligue des Champions',
  'liga-europa': 'Liga Europa',
  'top-14': 'TOP 14',
  'international': 'International'
};

console.log('📊 Calcul des statistiques de carrière des utilisateurs...\n');

// Structure pour stocker les stats par userId
const userStats = {};

let totalSeasonsProcessed = 0;
let totalParticipationsFound = 0;

// Parcourir toutes les compétitions
for (const [compPath, compName] of Object.entries(competitions)) {
  const compDir = path.join(BASE_DIR, compPath);

  if (!fs.existsSync(compDir)) {
    console.log(`⚠️  Compétition non trouvée: ${compPath}`);
    continue;
  }

  // Parcourir toutes les saisons
  const seasons = fs.readdirSync(compDir)
    .filter(f => fs.statSync(path.join(compDir, f)).isDirectory())
    .sort();

  for (const season of seasons) {
    const standingsFile = path.join(compDir, season, 'standings-general.json');

    if (!fs.existsSync(standingsFile)) {
      continue;
    }

    try {
      const standingsData = JSON.parse(fs.readFileSync(standingsFile, 'utf8'));

      if (!standingsData.ranking || standingsData.ranking.length === 0) {
        continue;
      }

      totalSeasonsProcessed++;

      // Traiter chaque joueur du classement
      standingsData.ranking.forEach(user => {
        if (!userStats[user.userId]) {
          userStats[user.userId] = {
            userId: user.userId,
            username: user.username,
            totalParticipations: 0,
            totalPoints: 0,
            totalPronostics: 0,
            totalCorrects: 0,
            totalJourneesPlayed: 0,
            bestSeasonPoints: 0,
            bestSeasonCompetition: '',
            bestSeasonYear: ''
          };
        }

        const stats = userStats[user.userId];

        // Agrégation
        stats.totalParticipations++;
        stats.totalPoints += user.points || 0;
        stats.totalPronostics += user.pronostics || 0;
        // Support de plusieurs formats : corrects, bons1N2
        stats.totalCorrects += user.corrects || user.bons1N2 || 0;
        stats.totalJourneesPlayed += user.journeesParticipees || 0;

        // Meilleure saison
        if ((user.points || 0) > stats.bestSeasonPoints) {
          stats.bestSeasonPoints = user.points || 0;
          stats.bestSeasonCompetition = compName;
          stats.bestSeasonYear = season;
        }

        totalParticipationsFound++;
      });

      console.log(`  ✅ ${compName} ${season} - ${standingsData.ranking.length} joueurs`);

    } catch (error) {
      console.error(`  ❌ Erreur ${compPath}/${season}:`, error.message);
    }
  }
}

console.log('\n========================================');
console.log('📊 Agrégation terminée');
console.log('========================================\n');
console.log(`Saisons traitées: ${totalSeasonsProcessed}`);
console.log(`Participations trouvées: ${totalParticipationsFound}`);
console.log(`Utilisateurs uniques: ${Object.keys(userStats).length}`);

// Charger le fichier users source pour récupérer tous les users (même ceux sans participation)
const usersSourcePath = path.join(__dirname, 'datasources', 'users.json');
let allUsersList = [];

if (fs.existsSync(usersSourcePath)) {
  try {
    const usersSourceRaw = JSON.parse(fs.readFileSync(usersSourcePath, 'utf8'));

    // Format export PHPMyAdmin : chercher l'objet avec type="table"
    const tableData = usersSourceRaw.find(item => item.type === 'table' && item.name === 'xfxg_users');

    if (tableData && tableData.data) {
      allUsersList = tableData.data.map(user => ({
        id: parseInt(user.id),
        username: user.username,
        joinDate: user.registerDate || null,
        lastActive: user.lastvisitDate || null
      }));
      console.log(`\nUtilisateurs dans le fichier source: ${allUsersList.length}`);
    } else {
      console.error('❌ Structure users.json non reconnue');
    }
  } catch (error) {
    console.error('Erreur lecture users source:', error.message);
  }
}

// Créer le fichier final users.json avec toutes les stats
// IMPORTANT : Ne garder QUE les utilisateurs qui ont des participations
const finalUsers = allUsersList
  .filter(user => userStats[user.id]) // Exclure les users sans participation
  .map(user => {
    const stats = userStats[user.id];

    // Utilisateur avec des participations
    const globalSuccessRate = stats.totalPronostics > 0
      ? ((stats.totalCorrects / stats.totalPronostics) * 100).toFixed(1)
      : 0;

    return {
      id: user.id,
      username: user.username,
      joinDate: user.joinDate || null,
      lastActive: user.lastActive || null,
      totalParticipations: stats.totalParticipations,
      careerStats: {
        totalPoints: stats.totalPoints,
        totalPronostics: stats.totalPronostics,
        totalCorrects: stats.totalCorrects,
        globalSuccessRate: parseFloat(globalSuccessRate),
        totalJourneesPlayed: stats.totalJourneesPlayed,
        bestSeason: {
          points: stats.bestSeasonPoints,
          competition: stats.bestSeasonCompetition,
          year: stats.bestSeasonYear
        }
      }
    };
  });

// Créer le fichier metadata/users.json
const usersExcluded = allUsersList.length - finalUsers.length;

const outputData = {
  generated: new Date().toISOString(),
  totalUsers: finalUsers.length,
  note: `${usersExcluded} utilisateurs sans participation ont été exclus`,
  schema: 'v2',
  users: finalUsers
};

const outputPath = path.join(BASE_DIR, 'metadata', 'users.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

console.log('\n========================================');
console.log('✅ Statistiques calculées et sauvegardées !');
console.log('========================================\n');
console.log(`Fichier: ${outputPath}`);
console.log(`Total utilisateurs actifs: ${finalUsers.length}`);
console.log(`Utilisateurs exclus (sans participation): ${usersExcluded}`);

// Top 10 des joueurs par points
console.log('\n🏆 Top 10 des joueurs (points totaux):');
const top10 = finalUsers
  .filter(u => u.totalParticipations > 0)
  .sort((a, b) => b.careerStats.totalPoints - a.careerStats.totalPoints)
  .slice(0, 10);

top10.forEach((user, index) => {
  console.log(`  ${index + 1}. ${user.username}`);
  console.log(`     Points: ${user.careerStats.totalPoints.toLocaleString()}`);
  console.log(`     Participations: ${user.totalParticipations}`);
  console.log(`     Taux réussite: ${user.careerStats.globalSuccessRate}%`);
  console.log(`     Meilleure saison: ${user.careerStats.bestSeason.points} pts (${user.careerStats.bestSeason.competition} ${user.careerStats.bestSeason.year})`);
  console.log('');
});

console.log('✅ Terminé !\n');
