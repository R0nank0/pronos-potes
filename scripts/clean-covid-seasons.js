const fs = require('fs');
const path = require('path');

// Journées à supprimer par compétition
const journeesToDelete = {
  'ligue-1/2019-2020': [30, 31, 32, 33, 34, 35, 36, 37, 38],
  'top-14/2019-2020': [19, 20, 21, 22, 23, 24, 25, 26],
  'ligue-champions/2019-2020': [16]
};

console.log('🧹 Nettoyage des saisons COVID-19 2019-2020\n');

Object.entries(journeesToDelete).forEach(([season, journees]) => {
  console.log(`📂 ${season}`);

  const seasonPath = path.join('data', season);
  const matchesFile = path.join(seasonPath, 'matches-all.json');

  // 1. Supprimer les fichiers de journées
  journees.forEach(j => {
    const journeeFile = path.join(seasonPath, 'journees', `${String(j).padStart(2, '0')}.json`);
    if (fs.existsSync(journeeFile)) {
      fs.unlinkSync(journeeFile);
      console.log(`   ✅ Supprimé: journees/${String(j).padStart(2, '0')}.json`);
    }
  });

  // 2. Supprimer les matchs de ces journées dans matches-all.json
  if (fs.existsSync(matchesFile)) {
    const matchesData = JSON.parse(fs.readFileSync(matchesFile, 'utf8'));
    const originalCount = matchesData.matches.length;

    matchesData.matches = matchesData.matches.filter(match => {
      return !journees.includes(match.journee);
    });

    const deletedCount = originalCount - matchesData.matches.length;
    fs.writeFileSync(matchesFile, JSON.stringify(matchesData, null, 2));
    console.log(`   ✅ Supprimé ${deletedCount} matchs de matches-all.json`);
    console.log(`   📊 Matchs restants: ${matchesData.matches.length}`);
  }

  console.log('');
});

console.log('✅ Nettoyage terminé !');
console.log('\n📝 Prochaine étape : Régénérer les classements avec:');
console.log('   node scripts/generate-standings.js');
console.log('   node scripts/generate-standings-history.js');
