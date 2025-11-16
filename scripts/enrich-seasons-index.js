/**
 * Enrich seasons-index.json files with missing data
 * Adds: totalMatches, totalPronostics, activeUsers, startDate, endDate
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '../data');
const COMPETITIONS = [
    { id: 'ligue1', path: 'ligue-1' },
    { id: 'ldc', path: 'ligue-champions' },
    { id: 'ligaeuropa', path: 'liga-europa' },
    { id: 'top14', path: 'top-14' },
    { id: 'international', path: 'international' }
];

/**
 * Calculate stats for a season by aggregating journees data
 */
function calculateSeasonStats(competitionPath, seasonYear) {
    const seasonPath = path.join(DATA_DIR, competitionPath, seasonYear);
    const journeesPath = path.join(seasonPath, 'journees');

    let totalMatches = 0;
    let totalPronostics = 0;
    const activeUsersSet = new Set();
    let firstDate = null;
    let lastDate = null;

    // Check if journees directory exists
    if (!fs.existsSync(journeesPath)) {
        console.log(`  ⚠️  No journees directory for ${seasonYear}`);
        return { totalMatches, totalPronostics, activeUsers: 0, startDate: null, endDate: null };
    }

    // Read all journee files
    const journeeFiles = fs.readdirSync(journeesPath)
        .filter(f => f.endsWith('.json'))
        .sort();

    journeeFiles.forEach(file => {
        try {
            const journeePath = path.join(journeesPath, file);
            const journeeData = JSON.parse(fs.readFileSync(journeePath, 'utf-8'));

            // Count matches
            if (journeeData.m && Array.isArray(journeeData.m)) {
                totalMatches += journeeData.m.length;

                // Count pronostics and users
                journeeData.m.forEach(match => {
                    if (match.pr && Array.isArray(match.pr)) {
                        totalPronostics += match.pr.length;
                        match.pr.forEach(prono => {
                            if (prono.u) {
                                activeUsersSet.add(prono.u);
                            }
                        });
                    }
                });
            }

            // Track dates
            if (journeeData.d) {
                const journeeDate = new Date(journeeData.d);
                if (!firstDate || journeeDate < firstDate) {
                    firstDate = journeeDate;
                }
                if (!lastDate || journeeDate > lastDate) {
                    lastDate = journeeDate;
                }
            }
        } catch (error) {
            console.error(`  ❌ Error reading ${file}:`, error.message);
        }
    });

    return {
        totalMatches,
        totalPronostics,
        activeUsers: activeUsersSet.size,
        startDate: firstDate ? firstDate.toISOString().split('T')[0] : null,
        endDate: lastDate ? lastDate.toISOString().split('T')[0] : null
    };
}

/**
 * Enrich a single seasons-index.json file
 */
function enrichSeasonsIndex(competition) {
    const seasonsIndexPath = path.join(DATA_DIR, competition.path, 'seasons-index.json');

    if (!fs.existsSync(seasonsIndexPath)) {
        console.log(`❌ seasons-index.json not found for ${competition.id}`);
        return;
    }

    console.log(`\n📊 Enriching ${competition.id}...`);

    // Read current seasons-index
    const seasonsIndex = JSON.parse(fs.readFileSync(seasonsIndexPath, 'utf-8'));

    if (!seasonsIndex.seasons || !Array.isArray(seasonsIndex.seasons)) {
        console.log(`❌ Invalid seasons array for ${competition.id}`);
        return;
    }

    let enrichedCount = 0;

    // Enrich each season
    seasonsIndex.seasons = seasonsIndex.seasons.map(season => {
        console.log(`  Processing ${season.year}...`);

        // Calculate stats from journees
        const stats = calculateSeasonStats(competition.path, season.year);

        // Add/update properties
        const enrichedSeason = {
            ...season,
            totalMatches: stats.totalMatches,
            totalPronostics: stats.totalPronostics,
            activeUsers: stats.activeUsers
        };

        // Add dates if available
        if (stats.startDate) {
            enrichedSeason.startDate = stats.startDate;
        }
        if (stats.endDate) {
            enrichedSeason.endDate = stats.endDate;
        }

        console.log(`    ✅ Matches: ${stats.totalMatches}, Pronostics: ${stats.totalPronostics}, Users: ${stats.activeUsers}`);
        enrichedCount++;

        return enrichedSeason;
    });

    // Write back to file
    fs.writeFileSync(
        seasonsIndexPath,
        JSON.stringify(seasonsIndex, null, 2),
        'utf-8'
    );

    console.log(`✅ Enriched ${enrichedCount} seasons for ${competition.id}`);
}

/**
 * Main function
 */
function main() {
    console.log('🚀 Starting seasons-index enrichment...\n');

    COMPETITIONS.forEach(competition => {
        try {
            enrichSeasonsIndex(competition);
        } catch (error) {
            console.error(`❌ Error processing ${competition.id}:`, error.message);
        }
    });

    console.log('\n✅ Enrichment complete!');
}

// Run
main();
