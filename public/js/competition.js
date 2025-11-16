/**
 * Competition Page - Pronos Potes
 * Displays all seasons for a specific competition
 */

// State
let competitionId = null;
let competitionData = null;
let seasonsData = null;

/**
 * Initialize the page
 */
async function init() {
    try {
        // Get competition ID from URL
        const params = new URLSearchParams(window.location.search);
        competitionId = params.get('competition');

        if (!competitionId) {
            showError('seasons-grid', 'Aucune compétition sélectionnée.');
            return;
        }

        // Load index to get competition info
        const indexData = await fetchWithCache(`${DATA_BASE_PATH}/index.json`, 1440);
        competitionData = indexData.competitions.find(c => c.id === competitionId);

        if (!competitionData) {
            showError('seasons-grid', 'Compétition introuvable.');
            return;
        }

        // Update page header
        updateHeader();

        // Load seasons data
        const competitionPath = getCompetitionPath(competitionId);
        seasonsData = await fetchWithCache(
            `${DATA_BASE_PATH}/${competitionPath}/seasons-index.json`,
            1440
        );

        // Update stats
        updateStats();

        // Render seasons
        await renderSeasons();

    } catch (error) {
        console.error('Error initializing page:', error);
        showError('seasons-grid', 'Impossible de charger les données. Veuillez réessayer.');
    }
}

/**
 * Update page header with competition info
 */
function updateHeader() {
    document.getElementById('competition-icon').innerHTML = getCompetitionIcon(competitionId);
    document.getElementById('competition-name').textContent = competitionData.name;

    const subtitle = `${getCompetitionType(competitionData.type)} - ${competitionData.country}`;
    document.getElementById('competition-subtitle').textContent = subtitle;

    // Update page title
    document.title = `${competitionData.name} - Pronos Potes`;

    // Update hero background color based on competition
    const heroSection = document.getElementById('hero-section');
    const color = getCompetitionColor(competitionId);
    heroSection.style.background = `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%)`;
}

/**
 * Update statistics
 */
function updateStats() {
    if (!seasonsData || !seasonsData.seasons) return;

    const totalSeasons = seasonsData.seasons.length;
    const totalJournees = seasonsData.seasons.reduce((sum, s) => sum + (s.totalJournees || s.journees || 0), 0);
    const totalMatches = seasonsData.seasons.reduce((sum, s) => sum + (s.totalMatches || 0), 0);
    const totalPronostics = seasonsData.seasons.reduce((sum, s) => sum + (s.totalPronostics || 0), 0);

    document.getElementById('total-seasons').textContent = totalSeasons;
    document.getElementById('total-journees').textContent = formatNumber(totalJournees);
    document.getElementById('total-matches').textContent = formatNumber(totalMatches);
    document.getElementById('total-pronostics').textContent = formatNumber(totalPronostics);
}

/**
 * Render all seasons in descending order (newest first)
 */
async function renderSeasons() {
    const container = document.getElementById('seasons-grid');
    if (!container || !seasonsData) return;

    container.classList.remove('loading');
    container.innerHTML = '';

    // Sort seasons descending (most recent first)
    const sortedSeasons = [...seasonsData.seasons].sort((a, b) => {
        const yearA = a.year.split('-')[0];
        const yearB = b.year.split('-')[0];
        return yearB.localeCompare(yearA);
    });

    // Render each season card
    sortedSeasons.forEach(season => {
        const card = createSeasonCard(season);
        container.appendChild(card);
    });
}

/**
 * Create season card element
 */
function createSeasonCard(season) {
    const card = document.createElement('a');
    card.className = 'season-card';
    card.href = `season.html?competition=${competitionId}&season=${season.year}`;

    const statusClass = getStatusClass(season.status);
    const statusLabel = getStatusLabel(season.status);
    const statusEmoji = season.status === 'ongoing' ? '🔴' :
                       season.status === 'finished' ? '✅' : '⏳';

    card.innerHTML = `
        <div class="season-header">
            <h3 class="season-year">${season.year}</h3>
            <span class="season-status ${statusClass}">${statusEmoji} ${statusLabel}</span>
        </div>

        <div class="season-stats">
            <div class="season-stat">
                <span class="season-stat-value">${season.totalJournees || season.journees || 0}</span>
                <span class="season-stat-label">journées</span>
            </div>
            <div class="season-stat">
                <span class="season-stat-value">${formatNumber(season.totalMatches || 0)}</span>
                <span class="season-stat-label">matchs</span>
            </div>
            <div class="season-stat">
                <span class="season-stat-value">${season.activeUsers || 0}</span>
                <span class="season-stat-label">joueurs</span>
            </div>
        </div>

        <div class="season-footer">
            <span class="season-date">${formatSeasonDates(season)}</span>
            <span class="season-arrow">→</span>
        </div>
    `;

    return card;
}

/**
 * Format season dates
 */
function formatSeasonDates(season) {
    if (!season.startDate) return '';

    const start = new Date(season.startDate);
    const end = season.endDate ? new Date(season.endDate) : null;

    const startMonth = start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    const endMonth = end ? end.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '...';

    return `${startMonth} - ${endMonth}`;
}

/**
 * Get competition directory path
 */
function getCompetitionPath(competitionId) {
    const paths = {
        'ligue1': 'ligue-1',
        'ldc': 'ligue-champions',
        'ligaeuropa': 'liga-europa',
        'top14': 'top-14',
        'international': 'international'
    };
    return paths[competitionId] || competitionId;
}

/**
 * Get status class
 */
function getStatusClass(status) {
    const classes = {
        'ongoing': 'status-ongoing',
        'finished': 'status-finished',
        'upcoming': 'status-upcoming'
    };
    return classes[status] || '';
}

/**
 * Get status label
 */
function getStatusLabel(status) {
    const labels = {
        'ongoing': 'En cours',
        'finished': 'Terminée',
        'upcoming': 'À venir'
    };
    return labels[status] || status;
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(hex, percent) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Adjust
    r = Math.max(0, Math.min(255, r + (r * percent / 100)));
    g = Math.max(0, Math.min(255, g + (g * percent / 100)));
    b = Math.max(0, Math.min(255, b + (b * percent / 100)));

    // Convert back to hex
    const rr = Math.round(r).toString(16).padStart(2, '0');
    const gg = Math.round(g).toString(16).padStart(2, '0');
    const bb = Math.round(b).toString(16).padStart(2, '0');

    return `#${rr}${gg}${bb}`;
}

/**
 * Format large numbers
 */
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return num.toString();
}

/**
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', init);
