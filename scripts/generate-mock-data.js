#!/usr/bin/env node

/**
 * Générateur de données JSON mockées pour Pronos-Potes
 * Crée une structure complète de données d'exemple pour tester le frontend
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');
const NUM_USERS = 50; // Nombre d'utilisateurs à générer
const NUM_JOURNEES = 10; // Nombre de journées à générer
const CURRENT_SEASON = '2024-2025';

// Noms d'utilisateurs fictifs
const USERNAMES = [
  'Jean_Dupont', 'Marie_Martin', 'Pierre_Bernard', 'Sophie_Dubois', 'Luc_Thomas',
  'Emma_Robert', 'Lucas_Petit', 'Chloe_Durand', 'Hugo_Leroy', 'Lea_Moreau',
  'Antoine_Simon', 'Julie_Laurent', 'Maxime_Lefebvre', 'Sarah_Michel', 'Tom_Garcia',
  'Camille_Roux', 'Alexandre_David', 'Laura_Bertrand', 'Nathan_Fontaine', 'Manon_Rousseau',
  'Theo_Vincent', 'Clara_Muller', 'Louis_Lefevre', 'Oceane_Garnier', 'Paul_Faure',
  'Pauline_Andre', 'Arthur_Mercier', 'Elise_Blanc', 'Romain_Guerin', 'Mathilde_Boyer',
  'Nicolas_Girard', 'Charlotte_Roche', 'Julien_Barbier', 'Amelie_Arnaud', 'Simon_Gauthier',
  'Alice_Chevalier', 'Benjamin_Perrin', 'Lucie_Colin', 'Victor_Vidal', 'Anais_Clement',
  'Gabriel_Robin', 'Justine_Marchand', 'Raphael_Lemoine', 'Margaux_Dumas', 'Adrien_Renard',
  'Melissa_Morel', 'Alexis_Fournier', 'Eva_Giraud', 'Valentin_Bonnet', 'Noemie_Dupuis'
];

// Équipes de Ligue 1
const TEAMS_L1 = [
  'Paris SG', 'Marseille', 'Monaco', 'Lyon', 'Lille',
  'Lens', 'Rennes', 'Nice', 'Toulouse', 'Reims',
  'Strasbourg', 'Montpellier', 'Brest', 'Nantes', 'Le Havre',
  'Lorient', 'Metz', 'Clermont'
];

// Utilitaires
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (date) => date.toISOString().split('T')[0];
const formatDateTime = (date) => date.toISOString();

// Créer la structure de dossiers
const createDirectoryStructure = () => {
  console.log('📁 Création de la structure de dossiers...');

  const dirs = [
    BASE_DIR,
    path.join(BASE_DIR, 'metadata'),
    path.join(BASE_DIR, 'ligue-1'),
    path.join(BASE_DIR, 'ligue-1', CURRENT_SEASON),
    path.join(BASE_DIR, 'ligue-1', CURRENT_SEASON, 'journees'),
    path.join(BASE_DIR, 'ligue-champions'),
    path.join(BASE_DIR, 'top-14'),
    path.join(BASE_DIR, 'international')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ ${dir}`);
    }
  });
  console.log('');
};

// Générer les utilisateurs
const generateUsers = () => {
  console.log('👥 Génération des utilisateurs...');

  const users = USERNAMES.slice(0, NUM_USERS).map((username, i) => {
    const totalPronostics = randomInt(500, 2000);
    const totalCorrects = Math.floor(totalPronostics * (0.25 + Math.random() * 0.15));

    return {
      id: i + 1,
      username,
      joinDate: formatDate(randomDate(new Date(2005, 0, 1), new Date(2020, 0, 1))),
      lastActive: formatDate(randomDate(new Date(2024, 8, 1), new Date())),
      totalParticipations: randomInt(10, 50),
      careerStats: {
        totalPoints: totalCorrects * 3,
        totalPronostics,
        totalCorrects,
        globalSuccessRate: parseFloat((totalCorrects / totalPronostics * 100).toFixed(2))
      }
    };
  });

  const output = { users };
  const filePath = path.join(BASE_DIR, 'metadata', 'users.json');
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`  ✅ ${NUM_USERS} utilisateurs générés`);
  console.log('');

  return users;
};

// Générer les compétitions
const generateCompetitions = () => {
  console.log('🏆 Génération des compétitions...');

  const competitions = [
    {
      id: 'ligue1',
      name: 'Ligue 1',
      type: 'football',
      country: 'France',
      typicalJourneesPerSeason: 38,
      typicalMatchesPerJournee: 9
    },
    {
      id: 'ldc',
      name: 'Ligue des Champions',
      type: 'football',
      country: 'Europe',
      typicalJourneesPerSeason: 13,
      typicalMatchesPerJournee: 8
    },
    {
      id: 'top14',
      name: 'TOP 14',
      type: 'rugby',
      country: 'France',
      typicalJourneesPerSeason: 26,
      typicalMatchesPerJournee: 7
    },
    {
      id: 'international',
      name: 'International',
      type: 'multi',
      country: 'Multi',
      typicalJourneesPerSeason: 20,
      typicalMatchesPerJournee: 8
    }
  ];

  const output = { competitions };
  const filePath = path.join(BASE_DIR, 'metadata', 'competitions.json');
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`  ✅ ${competitions.length} compétitions générées`);
  console.log('');

  return competitions;
};

// Générer les équipes
const generateTeams = () => {
  console.log('⚽ Génération des équipes...');

  const teams = TEAMS_L1.map((name, i) => ({
    id: i + 1,
    name,
    shortName: name.length > 10 ? name.substring(0, 10) : name,
    country: 'France',
    logo: `https://example.com/logos/${name.toLowerCase().replace(/\s+/g, '-')}.png`
  }));

  const output = { teams };
  const filePath = path.join(BASE_DIR, 'metadata', 'teams.json');
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`  ✅ ${teams.length} équipes générées`);
  console.log('');

  return teams;
};

// Générer l'index global
const generateIndex = () => {
  console.log('📑 Génération de l\'index global...');

  const index = {
    version: '2.0',
    generated: formatDateTime(new Date()),
    compressionMethod: 'none-for-index',
    stats: {
      totalCompetitions: 4,
      totalSeasons: 60,
      totalJournees: 1500,
      totalUsers: NUM_USERS,
      totalMatches: 14000,
      totalPronostics: 500000,
      estimatedSize: '15MB gzip'
    },
    competitions: [
      {
        id: 'ligue1',
        name: 'Ligue 1',
        type: 'football',
        country: 'France',
        seasons: [CURRENT_SEASON, '2023-2024', '2022-2023']
      },
      {
        id: 'ldc',
        name: 'Ligue des Champions',
        type: 'football',
        country: 'Europe',
        seasons: [CURRENT_SEASON, '2023-2024', '2022-2023']
      },
      {
        id: 'top14',
        name: 'TOP 14',
        type: 'rugby',
        country: 'France',
        seasons: [CURRENT_SEASON, '2023-2024', '2022-2023']
      },
      {
        id: 'international',
        name: 'International',
        type: 'multi',
        country: 'Multi',
        seasons: [CURRENT_SEASON, '2023-2024', '2022-2023']
      }
    ]
  };

  const filePath = path.join(BASE_DIR, 'index.json');
  fs.writeFileSync(filePath, JSON.stringify(index, null, 2));
  console.log('  ✅ Index global généré');
  console.log('');

  return index;
};

// Générer l'index des saisons (Ligue 1)
const generateSeasonsIndex = () => {
  console.log('📊 Génération de l\'index des saisons...');

  const seasonsIndex = {
    competition: 'ligue1',
    seasons: [
      {
        year: CURRENT_SEASON,
        status: 'ongoing',
        startDate: '2024-08-16',
        endDate: '2025-05-25',
        journees: NUM_JOURNEES,
        totalMatches: NUM_JOURNEES * 9,
        activeUsers: NUM_USERS,
        totalPronostics: NUM_JOURNEES * 9 * NUM_USERS,
        lastUpdated: formatDateTime(new Date()),
        dataPath: `./${CURRENT_SEASON}/`
      },
      {
        year: '2023-2024',
        status: 'finished',
        startDate: '2023-08-18',
        endDate: '2024-05-25',
        journees: 38,
        totalMatches: 342,
        activeUsers: 45,
        totalPronostics: 15390,
        lastUpdated: '2024-05-25T23:59:59Z',
        dataPath: './2023-2024/'
      }
    ]
  };

  const filePath = path.join(BASE_DIR, 'ligue-1', 'seasons-index.json');
  fs.writeFileSync(filePath, JSON.stringify(seasonsIndex, null, 2));
  console.log('  ✅ Index des saisons généré');
  console.log('');

  return seasonsIndex;
};

// Générer les métadonnées de la saison
const generateSeasonMeta = () => {
  console.log('📝 Génération des métadonnées de la saison...');

  const seasonMeta = {
    competition: 'ligue1',
    year: CURRENT_SEASON,
    name: `Ligue 1 ${CURRENT_SEASON}`,
    startDate: '2024-08-16',
    endDate: '2025-05-25',
    status: 'ongoing',
    journees: NUM_JOURNEES,
    totalMatches: NUM_JOURNEES * 9,
    activeUsers: NUM_USERS,
    totalPronostics: NUM_JOURNEES * 9 * NUM_USERS,
    lastJourneeProcessed: NUM_JOURNEES,
    lastUpdate: formatDateTime(new Date()),
    notes: 'Archive statique - données non mises à jour en temps réel',
    schema: 'v2'
  };

  const filePath = path.join(BASE_DIR, 'ligue-1', CURRENT_SEASON, 'season-meta.json');
  fs.writeFileSync(filePath, JSON.stringify(seasonMeta, null, 2));
  console.log('  ✅ Métadonnées de la saison générées');
  console.log('');

  return seasonMeta;
};

// Générer le classement général
const generateStandingsGeneral = (users) => {
  console.log('🏅 Génération du classement général...');

  const ranking = users
    .map(user => {
      const pronostics = randomInt(NUM_JOURNEES * 7, NUM_JOURNEES * 9);
      const corrects = Math.floor(pronostics * (0.25 + Math.random() * 0.15));

      return {
        userId: user.id,
        username: user.username,
        points: corrects * 3,
        pronostics,
        corrects,
        successRate: parseFloat((corrects / pronostics * 100).toFixed(1)),
        journeesParticipees: NUM_JOURNEES,
        bestJournee: randomInt(1, NUM_JOURNEES),
        worstJournee: randomInt(1, NUM_JOURNEES)
      };
    })
    .sort((a, b) => b.points - a.points)
    .map((user, i) => ({ rank: i + 1, ...user }));

  const standings = {
    season: `ligue1-${CURRENT_SEASON}`,
    generatedAt: formatDateTime(new Date()),
    totalRanked: NUM_USERS,
    ranking
  };

  const filePath = path.join(BASE_DIR, 'ligue-1', CURRENT_SEASON, 'standings-general.json');
  fs.writeFileSync(filePath, JSON.stringify(standings, null, 2));
  console.log(`  ✅ Classement de ${NUM_USERS} utilisateurs généré`);
  console.log('');

  return standings;
};

// Générer tous les matchs de la saison
const generateMatchesAll = (teams) => {
  console.log('⚽ Génération de tous les matchs...');

  let matchId = 1000;
  const matches = [];
  const startDate = new Date(2024, 7, 16); // 16 août 2024

  for (let journee = 1; journee <= NUM_JOURNEES; journee++) {
    const journeeDate = new Date(startDate);
    journeeDate.setDate(startDate.getDate() + (journee - 1) * 7);

    for (let i = 0; i < 9; i++) {
      const team1 = teams[i];
      const team2 = teams[17 - i];

      matches.push({
        id: matchId++,
        journee,
        date: formatDateTime(journeeDate),
        team1: team1.name,
        team2: team2.name,
        score1: randomInt(0, 4),
        score2: randomInt(0, 4),
        status: journee <= NUM_JOURNEES ? 'finished' : 'upcoming'
      });
    }
  }

  const output = {
    season: `ligue1-${CURRENT_SEASON}`,
    totalMatches: matches.length,
    matches
  };

  const filePath = path.join(BASE_DIR, 'ligue-1', CURRENT_SEASON, 'matches-all.json');
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`  ✅ ${matches.length} matchs générés`);
  console.log('');

  return matches;
};

// Générer une journée détaillée
const generateJournee = (journeeNum, matches, users) => {
  const journeeMatches = matches.filter(m => m.journee === journeeNum);

  // Générer d'abord les matchs avec les pronostics
  const matchesWithPronostics = journeeMatches.map(match => ({
    id: match.id,
    t1: match.team1,
    t2: match.team2,
    sc1: match.score1,
    sc2: match.score2,
    pr: users.map(user => {
      const pronostic = ['1', 'X', '2'][randomInt(0, 2)];
      const result = match.score1 > match.score2 ? '1' : match.score1 < match.score2 ? '2' : 'X';
      const correct = pronostic === result ? 1 : 0;

      return {
        u: user.id,
        p: pronostic,
        c: correct,
        pts: correct * 3
      };
    })
  }));

  // Ensuite calculer le classement journée
  const classementJournee = users
    .map(user => {
      const pointsJournee = matchesWithPronostics.reduce((sum, match) => {
        const userProno = match.pr.find(p => p.u === user.id);
        return sum + userProno.pts;
      }, 0);

      return {
        u: user.id,
        un: user.username,
        pj: pointsJournee,
        pt: pointsJournee * journeeNum // Approximation des points totaux
      };
    })
    .sort((a, b) => b.pt - a.pt);

  const journeeData = {
    s: `ligue1-${CURRENT_SEASON}`,
    j: journeeNum,
    d: journeeMatches[0].date.split('T')[0],
    tm: journeeMatches.length,
    tp: journeeMatches.length * users.length,
    m: matchesWithPronostics,
    cj: classementJournee
  };

  const journeeStr = String(journeeNum).padStart(2, '0');
  const filePath = path.join(BASE_DIR, 'ligue-1', CURRENT_SEASON, 'journees', `${journeeStr}.json`);
  fs.writeFileSync(filePath, JSON.stringify(journeeData, null, 2));

  return journeeData;
};

// Générer toutes les journées
const generateAllJournees = (matches, users) => {
  console.log(`📅 Génération de ${NUM_JOURNEES} journées...`);

  for (let i = 1; i <= NUM_JOURNEES; i++) {
    generateJournee(i, matches, users);
    process.stdout.write(`  Journée ${i}/${NUM_JOURNEES}\r`);
  }

  console.log(`\n  ✅ ${NUM_JOURNEES} journées générées`);
  console.log('');
};

// Programme principal
const main = () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 Génération des données mockées');
  console.log('========================================');
  console.log('');

  createDirectoryStructure();

  const users = generateUsers();
  const competitions = generateCompetitions();
  const teams = generateTeams();
  const index = generateIndex();
  const seasonsIndex = generateSeasonsIndex();
  const seasonMeta = generateSeasonMeta();
  const standings = generateStandingsGeneral(users);
  const matches = generateMatchesAll(teams);

  generateAllJournees(matches, users);

  console.log('========================================');
  console.log('✅ Génération terminée !');
  console.log('========================================');
  console.log('');
  console.log('Fichiers créés :');
  console.log(`  📂 data/`);
  console.log(`  ├── 📄 index.json`);
  console.log(`  ├── 📂 metadata/`);
  console.log(`  │   ├── 📄 users.json (${NUM_USERS} utilisateurs)`);
  console.log(`  │   ├── 📄 competitions.json (4 compétitions)`);
  console.log(`  │   └── 📄 teams.json (${teams.length} équipes)`);
  console.log(`  └── 📂 ligue-1/`);
  console.log(`      ├── 📄 seasons-index.json`);
  console.log(`      └── 📂 ${CURRENT_SEASON}/`);
  console.log(`          ├── 📄 season-meta.json`);
  console.log(`          ├── 📄 standings-general.json`);
  console.log(`          ├── 📄 matches-all.json (${matches.length} matchs)`);
  console.log(`          └── 📂 journees/ (${NUM_JOURNEES} fichiers)`);
  console.log('');
  console.log('Vérification :');
  console.log('  cat data/index.json | jq "."');
  console.log('  cat data/ligue-1/2024-2025/standings-general.json | jq ".ranking | length"');
  console.log('');
  console.log('Taille totale :');
  console.log('  du -sh data/');
  console.log('');
};

// Exécution
if (require.main === module) {
  main();
}

module.exports = { main };
