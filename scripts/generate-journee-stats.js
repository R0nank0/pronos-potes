const fs = require('fs');
const path = require('path');

console.log('📊 Génération des statistiques de journées...\n');

// Charger tous les utilisateurs
const usersFile = path.join(__dirname, 'datasources', 'users.json');
const usersRaw = fs.readFileSync(usersFile, 'utf8');
const usersData = JSON.parse(usersRaw);
const usersArray = usersData.find(item => item.type === 'table' && item.name === 'xfxg_users');
const users = usersArray ? usersArray.data : [];

console.log(`✅ ${users.length} utilisateurs chargés`);

// Structure pour stocker les stats de journées par joueur
const journeeStats = {};

// Initialiser les stats pour tous les joueurs
users.forEach(user => {
  journeeStats[user.id] = {
    userId: parseInt(user.id),
    username: user.username,
    byCompetition: {
      ligue1: { victoires: 0, podiums: 0 },
      ldc: { victoires: 0, podiums: 0 },
      ligaeuropa: { victoires: 0, podiums: 0 },
      top14: { victoires: 0, podiums: 0 },
      international: { victoires: 0, podiums: 0 }
    },
    totalVictoires: 0,
    totalPodiums: 0
  };
});

// Parcourir toutes les journées
const competitions = {
  'ligue1': 'ligue-1',
  'ldc': 'ligue-champions',
  'ligaeuropa': 'liga-europa',
  'top14': 'top-14',
  'international': 'international'
};

const dataDir = path.join(__dirname, '..', 'data');
let totalJournees = 0;

Object.entries(competitions).forEach(([compId, compPath]) => {
  const compDir = path.join(dataDir, compPath);

  if (!fs.existsSync(compDir)) {
    return;
  }

  // Lister tous les dossiers de saisons
  const seasons = fs.readdirSync(compDir)
    .filter(item => {
      const itemPath = path.join(compDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

  seasons.forEach(season => {
    const journeesDir = path.join(compDir, season, 'journees');

    if (!fs.existsSync(journeesDir)) {
      return;
    }

    // Lister tous les fichiers de journées
    const journeeFiles = fs.readdirSync(journeesDir)
      .filter(file => file.endsWith('.json'))
      .sort();

    journeeFiles.forEach(file => {
      const journeePath = path.join(journeesDir, file);
      const journeeData = JSON.parse(fs.readFileSync(journeePath, 'utf8'));

      if (!journeeData.cj || journeeData.cj.length === 0) {
        return;
      }

      totalJournees++;

      // Trouver les vainqueurs et podiums de la journée
      const classement = journeeData.cj;

      // Vainqueur(s) - rank 1
      const winners = classement.filter(p => {
        const rank = classement.findIndex(c => c.u === p.u) + 1;
        return rank === 1;
      });

      // Podiums - rank 1, 2, 3
      const podiums = classement.filter(p => {
        const rank = classement.findIndex(c => c.u === p.u) + 1;
        return rank <= 3;
      });

      // Compter pour chaque joueur
      winners.forEach(winner => {
        if (journeeStats[winner.u]) {
          journeeStats[winner.u].byCompetition[compId].victoires++;
          journeeStats[winner.u].totalVictoires++;
        }
      });

      podiums.forEach(podium => {
        if (journeeStats[podium.u]) {
          journeeStats[podium.u].byCompetition[compId].podiums++;
          journeeStats[podium.u].totalPodiums++;
        }
      });
    });

    console.log(`  ✅ ${compPath}/${season}: ${journeeFiles.length} journées`);
  });
});

console.log(`\n📊 Total: ${totalJournees} journées analysées`);

// Filtrer les joueurs avec au moins une victoire ou un podium
const statsArray = Object.values(journeeStats)
  .filter(s => s.totalVictoires > 0 || s.totalPodiums > 0)
  .sort((a, b) => b.totalVictoires - a.totalVictoires);

// Sauvegarder les stats
const output = {
  generatedAt: new Date().toISOString(),
  totalJournees: totalJournees,
  totalPlayers: statsArray.length,
  stats: statsArray
};

const outputFile = path.join(dataDir, 'metadata', 'journee-stats.json');
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

console.log(`\n✅ Stats de journées générées: ${outputFile}`);
console.log(`\n🏆 Top 10 vainqueurs de journées:`);

statsArray.slice(0, 10).forEach((player, index) => {
  console.log(`   ${index + 1}. ${player.username} - ${player.totalVictoires} victoires / ${player.totalPodiums} podiums`);
});

console.log('\n✅ Génération terminée !');
