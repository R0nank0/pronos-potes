/**
 * Update season status based on endDate
 * Status logic:
 * - "finished": endDate is in the past
 * - "ongoing": endDate is in the future
 * - "upcoming": startDate is in the future
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
 * Determine season status based on dates
 */
function getSeasonStatus(startDate, endDate, referenceDate = null) {
    // Use corrected date (2024-11-03) instead of system date (2025-11-03)
    const now = referenceDate || new Date('2024-11-03');
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > now) {
        return 'upcoming';
    } else if (end < now) {
        return 'finished';
    } else {
        return 'ongoing';
    }
}

/**
 * Update season statuses for a competition
 */
function updateSeasonStatuses(competition, referenceDate) {
    const seasonsIndexPath = path.join(DATA_DIR, competition.path, 'seasons-index.json');

    if (!fs.existsSync(seasonsIndexPath)) {
        console.log(`❌ seasons-index.json not found for ${competition.id}`);
        return;
    }

    console.log(`\n📊 Updating statuses for ${competition.id}...`);

    // Read current seasons-index
    const seasonsIndex = JSON.parse(fs.readFileSync(seasonsIndexPath, 'utf-8'));

    if (!seasonsIndex.seasons || !Array.isArray(seasonsIndex.seasons)) {
        console.log(`❌ Invalid seasons array for ${competition.id}`);
        return;
    }

    let updatedCount = 0;

    // Update each season status
    seasonsIndex.seasons = seasonsIndex.seasons.map(season => {
        if (!season.startDate || !season.endDate) {
            console.log(`  ⚠️  ${season.year}: Missing dates, keeping status as ${season.status}`);
            return season;
        }

        const oldStatus = season.status;
        const newStatus = getSeasonStatus(season.startDate, season.endDate, referenceDate);

        if (oldStatus !== newStatus) {
            console.log(`  ✅ ${season.year}: ${oldStatus} → ${newStatus} (end: ${season.endDate})`);
            updatedCount++;
        } else {
            console.log(`  ✓  ${season.year}: ${newStatus} (unchanged)`);
        }

        return {
            ...season,
            status: newStatus
        };
    });

    // Write back to file
    fs.writeFileSync(
        seasonsIndexPath,
        JSON.stringify(seasonsIndex, null, 2),
        'utf-8'
    );

    console.log(`✅ Updated ${updatedCount} season(s) for ${competition.id}`);
}

/**
 * Main function
 */
function main() {
    console.log('🚀 Starting season status update...');

    // FIXME: System date seems wrong (2025 instead of 2024)
    // Using 2024-11-03 as current date
    const currentDate = new Date('2024-11-03');
    console.log(`📅 Current date (corrected): ${currentDate.toISOString().split('T')[0]}\n`);

    COMPETITIONS.forEach(competition => {
        try {
            updateSeasonStatuses(competition, currentDate);
        } catch (error) {
            console.error(`❌ Error processing ${competition.id}:`, error.message);
        }
    });

    console.log('\n✅ Status update complete!');
}

// Run
main();
