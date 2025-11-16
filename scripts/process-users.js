#!/usr/bin/env node

/**
 * Traitement du fichier users.json pour générer metadata/users.json
 * Crée le catalogue des pronostiqueurs avec structure de base
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'data');
const DATASOURCES_DIR = path.join(__dirname, 'datasources');
const USERS_FILE = path.join(DATASOURCES_DIR, 'users.json');

console.log('📖 Lecture du fichier users.json...\n');

// Lire le fichier users
const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const users = usersData.find(item => item.type === 'table' && item.name === 'xfxg_users').data;

console.log(`✅ ${users.length} utilisateurs trouvés\n`);

// Formater les utilisateurs pour l'export
const formattedUsers = users.map(user => ({
  id: parseInt(user.id),
  username: user.username,
  // Ces champs seront calculés plus tard avec les données de pronostics
  joinDate: null,
  lastActive: null,
  totalParticipations: 0,
  careerStats: {
    totalPoints: 0,
    totalPronostics: 0,
    totalCorrects: 0,
    globalSuccessRate: 0
  }
}));

// Trier par ID
formattedUsers.sort((a, b) => a.id - b.id);

// Créer le dossier metadata si nécessaire
const metadataDir = path.join(BASE_DIR, 'metadata');
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

// Créer le fichier users.json
const usersOutput = {
  generated: new Date().toISOString(),
  totalUsers: formattedUsers.length,
  note: 'Statistiques de carrière à calculer avec les données de pronostics',
  schema: 'v1',
  users: formattedUsers
};

const outputPath = path.join(metadataDir, 'users.json');
fs.writeFileSync(outputPath, JSON.stringify(usersOutput, null, 2));

console.log('========================================');
console.log('✅ Traitement terminé !');
console.log('========================================');
console.log('');
console.log(`Total: ${formattedUsers.length} utilisateurs traités`);
console.log(`Fichier créé: ${outputPath}`);
console.log('');
console.log('Exemples d\'utilisateurs:');
formattedUsers.slice(0, 5).forEach(user => {
  console.log(`  - [${user.id}] ${user.username}`);
});
console.log('  ...');
console.log('');
console.log('Prochaines étapes:');
console.log('  1. Exporter les pronostics depuis MySQL');
console.log('  2. Calculer les statistiques de carrière pour chaque utilisateur');
console.log('  3. Mettre à jour joinDate et lastActive');
console.log('');
