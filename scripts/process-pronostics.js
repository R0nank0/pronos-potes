#!/usr/bin/env node

/**
 * Traitement des fichiers de pronostics pour générer les fichiers journées/XX.json
 * Combine matchs + pronostics + calcul de points
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');
const DATASOURCES_DIR = path.join(__dirname, 'datasources');
const PRONOSTICS_DIR = path.join(DATASOURCES_DIR, 'pronostics');

// Fonction pour vérifier si un fichier doit être retraité
function needsProcessing(sourceFile, outputFile) {
  if (!fs.existsSync(outputFile)) {
    return { needed: true, reason: '🆕 nouveau' };
  }
  const sourceStats = fs.statSync(sourceFile);
  const outputStats = fs.statSync(outputFile);
  if (sourceStats.mtime > outputStats.mtime) {
    return { needed: true, reason: '🔄 modifié' };
  }
  return { needed: false, reason: '✅ déjà traité' };
}

console.log('📖 Recherche des fichiers de pronostics...\n');

// Vérifier que le dossier pronostics existe
if (!fs.existsSync(PRONOSTICS_DIR)) {
  console.error(`❌ Le dossier ${PRONOSTICS_DIR} n'existe pas`);
  process.exit(1);
}

// Trouver tous les fichiers de pronostics
const pronosFiles = fs.readdirSync(PRONOSTICS_DIR)
  .filter(f => f.startsWith('pronos-') && f.endsWith('.json'));

console.log(`✅ ${pronosFiles.length} fichier(s) trouvé(s) dans ${PRONOSTICS_DIR}`);
if (pronosFiles.length <= 10) {
  pronosFiles.forEach(f => console.log(`  - ${f}`));
} else {
  console.log(`  (Trop de fichiers pour tous les afficher - ${pronosFiles.length} fichiers)`);
  console.log(`  Premiers fichiers:`);
  pronosFiles.slice(0, 5).forEach(f => console.log(`  - ${f}`));
  console.log(`  ...`);
  console.log(`  Derniers fichiers:`);
  pronosFiles.slice(-5).forEach(f => console.log(`  - ${f}`));
}
console.log('');

// Charger les fichiers de référence
const saisonsData = JSON.parse(fs.readFileSync(path.join(DATASOURCES_DIR, 'saisons.json'), 'utf8'));
const seasons = saisonsData.find(item => item.type === 'table' && item.name === 'xfxg_multileague_season').data;

const usersData = JSON.parse(fs.readFileSync(path.join(DATASOURCES_DIR, 'users.json'), 'utf8'));
const users = usersData.find(item => item.type === 'table' && item.name === 'xfxg_users').data;

// Charger les tables de points
const scoresData = JSON.parse(fs.readFileSync(path.join(DATASOURCES_DIR, 'scores.json'), 'utf8'));
const scoresTable = scoresData.find(item => item.type === 'table' && item.name === 'xfxg_pronostik_scores').data;

const points1n2Data = JSON.parse(fs.readFileSync(path.join(DATASOURCES_DIR, 'points-1n2.json'), 'utf8'));
const points1n2Table = points1n2Data.find(item => item.type === 'table' && item.name === 'xfxg_pronostik_1n2').data;

// Créer le mapping users
const userMap = {};
users.forEach(user => {
  userMap[user.id] = user.username;
});

console.log(`✅ ${Object.keys(userMap).length} utilisateurs chargés`);

// Créer les tables de lookup pour les points
const scoresMap = {}; // { seasonId: { totalGoals: points } }
scoresTable.forEach(row => {
  const seasonId = row.projet_id;
  const totalGoals = parseInt(row.nbbuts);
  const points = parseInt(row.nbpoints);

  if (!scoresMap[seasonId]) {
    scoresMap[seasonId] = {};
  }
  scoresMap[seasonId][totalGoals] = points;
});

const bonus1n2Map = {}; // { seasonId: { correctCount: points } }
points1n2Table.forEach(row => {
  const seasonId = row.projet_id;
  const correctCount = parseInt(row.nbmatchs);
  const points = parseInt(row.nbpoints);

  if (!bonus1n2Map[seasonId]) {
    bonus1n2Map[seasonId] = {};
  }
  bonus1n2Map[seasonId][correctCount] = points;
});

console.log(`✅ ${Object.keys(scoresMap).length} saisons avec barème de points chargées`);
console.log(`✅ ${Object.keys(bonus1n2Map).length} saisons avec bonus 1N2 chargées\n`);

// Fonction pour parser le nom du fichier
function parsePronosFilename(filename) {
  // Format: pronos-{competition}-{year}-j{journee}.json
  // year peut être YYYY ou YYYY-YYYY
  const match = filename.match(/pronos-(\w+)-(\d{4}(?:-\d{4})?)-j(\d+)\.json/);
  if (!match) return null;

  return {
    competition: match[1],
    year: match[2],
    journee: parseInt(match[3])
  };
}

// Fonction pour extraire l'année
function extractYear(name) {
  const match = name.match(/(\d{4})\s*\/\s*(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  const singleYear = name.match(/(\d{4})/);
  if (singleYear) {
    return singleYear[1];
  }
  return name.replace(/[^\d-]/g, '').substring(0, 9);
}

// Mapping des compétitions
const compMapping = {
  'ligue1': 'ligue-1',
  'ldc': 'ligue-champions',
  'ligaeuropa': 'liga-europa',
  'top14': 'top-14',
  'international': 'international'
};

// Fonction pour calculer le résultat d'un match
function getMatchResult(homeScore, awayScore) {
  if (homeScore > awayScore) return '1';
  if (homeScore < awayScore) return '2';
  return 'X';
}

// Fonction pour calculer les points d'un pronostic
function calculatePoints(prediction, actualResult, seasonId, competition) {
  const predHome = parseInt(prediction.home_score_prediction);
  const predAway = parseInt(prediction.away_score_prediction);
  const actualHome = actualResult.homeScore;
  const actualAway = actualResult.awayScore;

  // Vérifier le résultat (1, X, 2)
  const predResult = getMatchResult(predHome, predAway);
  const actualResultStr = getMatchResult(actualHome, actualAway);
  const correct1n2 = predResult === actualResultStr ? 1 : 0;

  // ============================================================
  // RÈGLES SPÉCIALES TOP 14 ET RUGBY
  // ============================================================

  // Méthode 1 : Saisons 13, 19, 24, 30 (TOP 14 2011-2014 + CDM Rugby 2015)
  // Tranches d'écart : 0-7, 8-14, 15-21, >21
  if (["13", "19", "24", "30"].includes(seasonId)) {
    // Si score exact → 10 points
    if (predHome === actualHome && predAway === actualAway) {
      return { points: 10, correct: correct1n2, exactScore: true };
    }

    // Si mauvais 1N2 → 0 point
    if (!correct1n2) {
      return { points: 0, correct: 0, exactScore: false };
    }

    // Calculer l'écart entre domicile et extérieur
    const actualDiff = Math.abs(actualHome - actualAway);
    const predDiff = Math.abs(predHome - predAway);

    // Vérifier si les deux écarts sont dans la même tranche
    let pointsAwarded = 0;

    if (actualDiff < 8) {
      // Écart match 0-7 : prono doit être 0-7
      if (predDiff < 8) pointsAwarded = 5;
    } else if (actualDiff >= 8 && actualDiff < 15) {
      // Écart match 8-14 : prono doit être 8-14
      if (predDiff >= 8 && predDiff < 15) pointsAwarded = 5;
    } else if (actualDiff >= 15 && actualDiff < 22) {
      // Écart match 15-21 : prono doit être 15-21
      if (predDiff >= 15 && predDiff < 22) pointsAwarded = 5;
    } else {
      // Écart match >21 : prono doit être >21
      if (predDiff > 21) pointsAwarded = 5;
    }

    return { points: pointsAwarded, correct: 1, exactScore: false };
  }

  // Méthode 2 : Saisons 29, 33 (TOP 14 2014-2016)
  // Tranches d'écart : 0, 1-5, 6-10, 11-15, 16-20, >20
  if (["29", "33"].includes(seasonId)) {
    // Si score exact → 10 points
    if (predHome === actualHome && predAway === actualAway) {
      return { points: 10, correct: correct1n2, exactScore: true };
    }

    // Si mauvais 1N2 → 0 point
    if (!correct1n2) {
      return { points: 0, correct: 0, exactScore: false };
    }

    // Calculer l'écart entre domicile et extérieur
    const actualDiff = Math.abs(actualHome - actualAway);
    const predDiff = Math.abs(predHome - predAway);

    // Vérifier si les deux écarts sont dans la même tranche
    let pointsAwarded = 0;

    if (actualDiff === 0) {
      // Écart match 0 (match nul) : prono doit être 0
      if (predDiff === 0) pointsAwarded = 5;
    } else if (actualDiff >= 1 && actualDiff < 6) {
      // Écart match 1-5 : prono doit être 1-5
      if (predDiff >= 1 && predDiff < 6) pointsAwarded = 5;
    } else if (actualDiff >= 6 && actualDiff < 11) {
      // Écart match 6-10 : prono doit être 6-10
      if (predDiff >= 6 && predDiff < 11) pointsAwarded = 5;
    } else if (actualDiff >= 11 && actualDiff < 16) {
      // Écart match 11-15 : prono doit être 11-15
      if (predDiff >= 11 && predDiff < 16) pointsAwarded = 5;
    } else if (actualDiff >= 16 && actualDiff < 21) {
      // Écart match 16-20 : prono doit être 16-20
      if (predDiff >= 16 && predDiff < 21) pointsAwarded = 5;
    } else {
      // Écart match >20 : prono doit être >20
      if (predDiff > 20) pointsAwarded = 5;
    }

    return { points: pointsAwarded, correct: 1, exactScore: false };
  }

  // ============================================================
  // RÈGLE STANDARD (toutes les autres saisons, y compris TOP 14 depuis 2016-2017)
  // ============================================================

  // Score exact - utiliser la table de points
  if (predHome === actualHome && predAway === actualAway) {
    const totalGoals = actualHome + actualAway;
    const basePoints = scoresMap[seasonId]?.[totalGoals] || 0;
    return { points: basePoints, correct: correct1n2, exactScore: true };
  }

  // Bon résultat (1, X, 2) uniquement - pas de points directs, juste compté pour le bonus
  if (correct1n2) {
    return { points: 0, correct: 1, exactScore: false };
  }

  // Aucun point
  return { points: 0, correct: 0, exactScore: false };
}

// Charger les matchs pour une saison
function loadMatches(competition, year) {
  const compDir = compMapping[competition];
  if (!compDir) return null;

  const matchesFile = path.join(BASE_DIR, compDir, year, 'matches-all.json');
  if (!fs.existsSync(matchesFile)) {
    console.warn(`  ⚠️  Fichier matches non trouvé: ${matchesFile}`);
    return null;
  }

  const matchesData = JSON.parse(fs.readFileSync(matchesFile, 'utf8'));
  return matchesData.matches;
}

// Traiter chaque fichier de pronostics
let totalProcessed = 0;
let totalSkipped = 0;

pronosFiles.forEach(filename => {
  console.log(`\n🔄 Traitement de ${filename}...`);

  const parsedName = parsePronosFilename(filename);
  if (!parsedName) {
    console.warn(`  ⚠️  Impossible de parser le nom du fichier`);
    return;
  }

  // Déterminer le chemin de sortie dès maintenant pour le cache check
  const compDir = compMapping[parsedName.competition];
  if (!compDir) {
    console.warn(`  ⚠️  Compétition inconnue: ${parsedName.competition}`);
    return;
  }

  const journeesDir = path.join(BASE_DIR, compDir, parsedName.year, 'journees');
  const outputPath = path.join(journeesDir, `${String(parsedName.journee).padStart(2, '0')}.json`);
  const sourceFile = path.join(PRONOSTICS_DIR, filename);

  // Vérifier si le fichier doit être retraité
  const check = needsProcessing(sourceFile, outputPath);

  if (!check.needed) {
    console.log(`  ${check.reason}`);
    totalSkipped++;
    return;
  }

  // Charger les pronostics
  const pronosFilePath = path.join(PRONOSTICS_DIR, filename);
  const pronosData = JSON.parse(fs.readFileSync(pronosFilePath, 'utf8'));
  const pronostics = pronosData.find(item => item.type === 'table' && item.name === 'xfxg_multileague_player_prediction').data;

  console.log(`  ✅ ${pronostics.length} pronostics chargés`);

  // Charger les matchs
  const matches = loadMatches(parsedName.competition, parsedName.year);
  if (!matches) return;

  // Trouver le seasonId correspondant
  const seasonKey = `${parsedName.competition}-${parsedName.year}`;
  const season = seasons.find(s =>
    s.competition === parsedName.competition &&
    extractYear(s.name) === parsedName.year
  );

  if (!season) {
    console.warn(`  ⚠️  Saison non trouvée pour ${seasonKey}`);
    return;
  }

  const seasonId = season.id;
  console.log(`  ✅ Saison ID: ${seasonId}`);

  // Filtrer les matchs de cette journée
  const journeeMatches = matches.filter(m => m.journee === parsedName.journee);
  console.log(`  ✅ ${journeeMatches.length} matchs pour la journée ${parsedName.journee}`);

  // Grouper les pronostics par match
  const pronosByMatch = {};
  pronostics.forEach(prono => {
    const gameId = prono.game_id;
    if (!pronosByMatch[gameId]) {
      pronosByMatch[gameId] = [];
    }
    pronosByMatch[gameId].push(prono);
  });

  // Construire les données de la journée
  const journeeData = {
    s: `${parsedName.competition}-${parsedName.year}`,
    j: parsedName.journee,
    d: journeeMatches[0]?.date.split(' ')[0] || null,
    tm: journeeMatches.length,
    tp: pronostics.length,
    m: []
  };

  // Traiter chaque match
  journeeMatches.forEach(match => {
    const matchPronostics = pronosByMatch[match.id] || [];

    const matchData = {
      id: match.id,
      t1: match.homeTeam,
      t2: match.awayTeam,
      sc1: match.homeScore,
      sc2: match.awayScore,
      pr: []
    };

    // Traiter chaque pronostic
    matchPronostics.forEach(prono => {
      const result = calculatePoints(prono, match, seasonId, parsedName.competition);
      const username = userMap[prono.user_id] || `User${prono.user_id}`;

      matchData.pr.push({
        u: parseInt(prono.user_id),
        un: username,
        p1: parseInt(prono.home_score_prediction),
        p2: parseInt(prono.away_score_prediction),
        pts: result.points,
        c: result.correct,      // Bon 1N2 (0 ou 1)
        se: result.exactScore ? 1 : 0  // Score exact (0 ou 1)
      });
    });

    journeeData.m.push(matchData);
  });

  // Calculer le classement de la journée
  const userPoints = {};
  journeeData.m.forEach(match => {
    match.pr.forEach(prono => {
      if (!userPoints[prono.u]) {
        userPoints[prono.u] = {
          u: prono.u,
          un: prono.un,
          pj: 0,        // Points de la journée
          c: 0,         // Nombre de bons 1N2
          se: 0,        // Nombre de scores exacts
          bonus: 0      // Bonus 1N2
        };
      }
      userPoints[prono.u].pj += prono.pts;
      userPoints[prono.u].c += prono.c;        // Bons 1N2
      userPoints[prono.u].se += prono.se;      // Scores exacts
    });
  });

  // Ajouter le bonus 1N2 pour chaque utilisateur
  Object.values(userPoints).forEach(user => {
    const correctCount = user.c;
    const bonus = bonus1n2Map[seasonId]?.[correctCount] || 0;
    user.bonus = bonus;
    user.pj += bonus; // Ajouter le bonus au total de la journée
  });

  // Trier par points puis par corrects
  const ranking = Object.values(userPoints).sort((a, b) => {
    if (b.pj !== a.pj) return b.pj - a.pj;
    return b.c - a.c;
  });

  journeeData.cj = ranking;

  // Créer le dossier si nécessaire
  if (!fs.existsSync(journeesDir)) {
    fs.mkdirSync(journeesDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(journeeData, null, 2));

  console.log(`  ${check.reason} Fichier créé: ${outputPath}`);
  console.log(`  📊 ${journeeData.tp} pronostics, ${ranking.length} participants`);
  console.log(`  🏆 Meilleur: ${ranking[0]?.un} avec ${ranking[0]?.pj} points`);
  totalProcessed++;
});

console.log('');
console.log('========================================');
console.log('✅ Traitement terminé !');
console.log('========================================');
console.log('');
console.log(`Traités: ${totalProcessed} fichier(s)`);
console.log(`Ignorés: ${totalSkipped} fichier(s) (déjà à jour)`);
console.log(`Total: ${totalProcessed + totalSkipped} fichier(s) journée`);
console.log('');
