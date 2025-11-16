/**
 * Smart team name mapping
 * Maps our team names to official Wikipedia names
 */

const fs = require('fs');
const path = require('path');

// Load used teams
const usedTeamsPath = path.join(__dirname, 'datasources', 'used-teams.json');
const usedTeams = JSON.parse(fs.readFileSync(usedTeamsPath, 'utf8'));

// Smart mapping rules
const SMART_MAPPINGS = {
  // Ligue 1 - Pattern: City name → Official club name
  'Paris-SG': 'Paris Saint-Germain Football Club',
  'Marseille': 'Olympique de Marseille',
  'Lyon': 'Olympique lyonnais',
  'Monaco': 'AS Monaco',
  'Lille': 'LOSC Lille',
  'Rennes': 'Stade rennais football club',
  'Nice': 'OGC Nice',
  'St Etienne': 'AS Saint-Étienne',
  'Saint-Etienne': 'AS Saint-Étienne',
  'Nantes': 'FC Nantes',
  'Montpellier': 'Montpellier HSC',
  'Toulouse': 'Toulouse FC',
  'Bordeaux': 'FC Girondins de Bordeaux',
  'Lens': 'RC Lens',
  'Strasbourg': 'RC Strasbourg Alsace',
  'Reims': 'Stade de Reims',
  'Le Havre': 'Le Havre AC',
  'Auxerre': 'AJ Auxerre',
  'Lorient': 'FC Lorient',
  'Angers': 'Angers SCO',
  'Brest': 'Stade brestois 29',
  'Stade Brestois': 'Stade brestois 29',
  'Caen': 'SM Caen',
  'Sochaux': 'FC Sochaux-Montbéliard',
  'Nancy': 'AS Nancy-Lorraine',
  'Metz': 'FC Metz',
  'Valenciennes': 'Valenciennes FC',
  'Bastia': 'SC Bastia',
  'Guingamp': 'En Avant Guingamp',
  'Troyes': 'ES Troyes AC',
  'Ajaccio': 'AC Ajaccio',
  'Ajaccio GFC': 'Gazélec FC Ajaccio',
  'Dijon': 'Dijon FCO',
  'Le Mans': 'Le Mans FC',
  'Grenoble': 'Grenoble Foot 38',
  'Amiens': 'Amiens SC',
  'Nîmes': 'Nîmes Olympique',
  'Clermont-Ferrand': 'Clermont Foot 63',
  'Sedan': 'CS Sedan Ardennes',
  'Evian': 'Évian Thonon Gaillard FC',
  'Boulogne-sur-Mer': 'US Boulogne',
  'Arles Avignon': 'AC Arles-Avignon',

  // TOP 14 Rugby
  'Stade Toulousain': 'Stade toulousain',
  'Racing 92': 'Racing 92',
  'Clermont': 'ASM Clermont Auvergne',
  'Toulon': 'RC Toulon',
  'Castres': 'Castres olympique',
  'Stade Français': 'Stade français Paris',
  'Bordeaux-Bègles': 'Union Bordeaux Bègles',
  'Lyon Rugby': 'Lyon OU',
  'Stade Rochelais': 'Stade rochelais',
  'Montpellier Rugby': 'Montpellier HR',
  'Perpignan': 'USA Perpignan',
  'Bayonne': 'Aviron bayonnais',
  'Pau': 'Section paloise',
  'Agen': 'SU Agen',
  'Brive': 'CA Brive',
  'Biarritz': 'Biarritz olympique',
  'Mont de Marsan': 'Stade montois',
  'Grenoble Rugby': 'FC Grenoble',
  'Oyonnax': 'Oyonnax rugby',
  'Vannes': 'RC Vannes',

  // Ligue des Champions
  'Real Madrid': 'Real Madrid CF',
  'FC Barcelone': 'FC Barcelone',
  'Bayern Munich': 'Bayern Munich',
  'Manchester United': 'Manchester United FC',
  'Liverpool': 'Liverpool FC',
  'Chelsea': 'Chelsea FC',
  'Arsenal': 'Arsenal FC',
  'Manchester City FC': 'Manchester City FC',
  'Juventus Turin': 'Juventus FC',
  'Inter Milan': 'Inter Milan',
  'Milan AC': 'AC Milan',
  'Atletico de Madrid': 'Atlético de Madrid',
  'Borussia Dortmund': 'Borussia Dortmund',
  'Benfica': 'SL Benfica',
  'FC Porto': 'FC Porto',
  'Ajax Amsterdam': 'Ajax Amsterdam',
  'PSV Eindhoven': 'PSV Eindhoven',
  'AS Roma': 'AS Rome',
  'Naples': 'SSC Naples',
  'Tottenham': 'Tottenham Hotspur',
  'Leverkusen': 'Bayer Leverkusen',
  'Schalke 04': 'FC Schalke 04',
  'Seville FC': 'Séville FC',
  'Valence FC': 'Valence CF',
  'Olympiakos': 'Olympiakos Le Pirée',
  'Galatasaray': 'Galatasaray SK',
  'Shakhtar Donetsk': 'Chakhtar Donetsk',
  'Shakhtior Donetsk': 'Chakhtar Donetsk',
  'CSKA Moscou': 'CSKA Moscou',
  'Dynamo Kiev': 'Dynamo Kiev',
  'Celtic Glasgow': 'Celtic FC',
  'Glasgow Rangers': 'Rangers FC',
  'Zénith St Petersbourg': 'Zénith Saint-Pétersbourg',
  'Sporting Portugal': 'Sporting Portugal',
  'Anderlecht': 'RSC Anderlecht',
  'Club Bruges': 'Club Bruges KV',
  'Fiorentina': 'ACF Fiorentina',
  'Atalanta Bergame': 'Atalanta Bergame',
  'Lazio Rome': 'SS Lazio',
  'Villarreal CF': 'Villarreal CF',
  'Betis Seville': 'Real Betis',
  'Bilbao': 'Athletic Bilbao',
  'Malaga': 'Malaga CF',
  'Eintracht Francfort': 'Eintracht Francfort',
  'Hoffenheim': 'TSG 1899 Hoffenheim',
  'Borussia Mönchengladbach': 'Borussia Mönchengladbach',
  'RB Leipzig': 'RB Leipzig',
  'Wolfsburg': 'VfL Wolfsburg',
  'Stuttgart': 'VfB Stuttgart',
  'Werder Brême': 'Werder Brême',
  'Leicester City': 'Leicester City FC',
  'Aston Villa FC': 'Aston Villa FC',
  'West Ham': 'West Ham United',
  'Newcastle': 'Newcastle United FC',
  'Brighton': 'Brighton & Hove Albion FC',
  'Feyenoord Rotterdam': 'Feyenoord Rotterdam',
  'AZ Alkmaar': 'AZ Alkmaar',
  'FC Twente': 'FC Twente',
  'Besiktas': 'Beşiktaş JK',
  'Fenerbace': 'Fenerbahçe SK',
  'Trabzonspor': 'Trabzonspor',
  'Istanbul Basaksehir': 'İstanbul Başakşehir FK',
  'Bursaspor': 'Bursaspor',
  'Lokomotiv Moscou': 'Lokomotiv Moscou',
  'Spartak Moscou': 'Spartak Moscou',
  'FK Rostov': 'FK Rostov',
  'Zénith St Petersbourg': 'Zénith Saint-Pétersbourg',
  'FC Krasnodar': 'FK Krasnodar',
  'Dinamo Zagreb': 'Dinamo Zagreb',
  'Etoile Rouge Belgrade': 'Étoile rouge de Belgrade',
  'Partizan Belgrade': 'Partizan Belgrade',
  'FC Copenhague': 'FC Copenhague',
  'FC Midtjylland': 'FC Midtjylland',
  'Nordsjälland FC': 'FC Nordsjælland',
  'FC Bâle': 'FC Bâle',
  'Berne': 'BSC Young Boys',
  'Zurich': 'FC Zurich',
  'Steaua Bucarest': 'Steaua Bucarest',
  'CFR 1907 Cluj': 'CFR Cluj',
  'FC Oţelul Galaţi': 'Oțelul Galați',
  'Borisov BATE': 'FC BATE Borisov',
  'Slavia Prague': 'SK Slavia Prague',
  'Sparta Prague': 'AC Sparta Prague',
  'Viktoria Plzen': 'Viktoria Plzeň',
  'Legia Varsovie': 'Legia Varsovie',
  'Lask': 'LASK Linz',
  'Austria Vienne': 'FK Austria Vienne',
  'RB Salzbourg': 'FC Red Bull Salzbourg',
  'Stum Graz': 'SK Sturm Graz',
  'Sheriff Tiraspol': 'FC Sheriff Tiraspol',
  'Ludogorets Razgrad': 'Ludogorets Razgrad',
  'PAOK Salonique': 'PAOK Salonique',
  'AEK Athenes': 'AEK Athènes',
  'Panathinaïkos': 'Panathinaïkos',
  'Maccabi Haïfa': 'Maccabi Haïfa',
  'Maccabi Tel Aviv': 'Maccabi Tel-Aviv',
  'Tel Aviv': 'Maccabi Tel-Aviv',
  'Chakhtior Karaganda': 'Shakhter Karagandy',
  'Astana': 'FC Astana',
  'Qarabag': 'Qarabağ FK',
  'KRC Genk': 'KRC Genk',
  'La Gantoise': 'KAA La Gantoise',
  'Union St Gilloise': 'Royale Union saint-gilloise',
  'Antwerp': 'Royal Antwerp FC',
  'Sporting Braga': 'SC Braga',
  'Braga': 'SC Braga',
  'Pacos de Ferriera': 'FC Paços de Ferreira',
  'Maribor': 'NK Maribor',
  'Debrecen': 'Debreceni VSC',
  'Ferencvaros': 'Ferencváros TC',
  'Malmö': 'Malmö FF',
  'BK Hacken': 'BK Häcken',
  'Molde': 'Molde FK',
  'Réal Sociedad': 'Real Sociedad',
  'Real Sociedad': 'Real Sociedad',
  'Girona FC': 'Girona FC',
  'Bologne': 'Bologne FC 1909',
  'Fribourg': 'SC Fribourg',
  'Servette Geneve': 'Servette FC',
  'RKS Rakow': 'Raków Częstochowa',
  'TSC Backa Topola': 'TSC Bačka Topola',
  'SK Slovan Bratislava': 'ŠK Slovan Bratislava',
  'Aris Limassol FC': 'Aris Limassol',
  'Nicosie APOEL': 'APOEL Nicosie'
};

// Generate report
console.log('🔍 Analyse du mapping intelligent...\n');

const teamsWithMapping = [];
const teamsWithoutMapping = [];

usedTeams.allTeams.forEach(team => {
  if (SMART_MAPPINGS[team]) {
    teamsWithMapping.push({
      myName: team,
      officialName: SMART_MAPPINGS[team],
      matchCount: usedTeams.teamStats[team]?.matchCount || 0
    });
  } else {
    teamsWithoutMapping.push({
      myName: team,
      matchCount: usedTeams.teamStats[team]?.matchCount || 0
    });
  }
});

console.log(`✅ ${teamsWithMapping.length} équipes avec mapping`);
console.log(`❌ ${teamsWithoutMapping.length} équipes sans mapping\n`);

// Show teams without mapping sorted by usage
console.log('========================================');
console.log('❌ ÉQUIPES SANS MAPPING (par utilisation)');
console.log('========================================\n');

teamsWithoutMapping
  .sort((a, b) => b.matchCount - a.matchCount)
  .forEach((team, idx) => {
    console.log(`${(idx + 1).toString().padStart(3)}. ${team.myName.padEnd(30)} → ${team.matchCount} matchs`);
  });

// Save mapping to file
const outputPath = path.join(__dirname, 'datasources', 'team-name-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalMappings: teamsWithMapping.length,
  mappings: SMART_MAPPINGS
}, null, 2));

console.log(`\n✅ Mapping sauvegardé: ${outputPath}`);
