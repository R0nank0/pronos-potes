/**
 * Landing Page - Pronos Potes
 * Displays all competitions with their seasons
 */

// State
let indexData = null;

/**
 * Initialize the page
 */
async function init() {
    try {
        // Load index data
        indexData = await fetchWithCache(`${DATA_BASE_PATH}/index.json`, 1440); // Cache 24h

        // Update generated date
        updateGeneratedDate();

        // Render competitions
        await renderCompetitions();

    } catch (error) {
        console.error('Error initializing page:', error);
        showError('competitions-grid', 'Impossible de charger les données. Veuillez réessayer.');
    }
}

/**
 * Update generated date in footer
 */
function updateGeneratedDate() {
    const dateElement = document.getElementById('generated-date');
    if (dateElement && indexData) {
        dateElement.textContent = formatDate(indexData.generated);
    }
}

/**
 * Render all competitions
 */
async function renderCompetitions() {
    const container = document.getElementById('competitions-grid');
    if (!container || !indexData) return;

    container.classList.remove('loading');
    container.innerHTML = '';

    // Load seasons index for each competition
    const competitionsWithSeasons = await Promise.all(
        indexData.competitions.map(async (comp) => {
            try {
                const seasonsIndex = await fetchWithCache(
                    `${DATA_BASE_PATH}/${getCompetitionPath(comp.id)}/seasons-index.json`,
                    1440
                );
                return {
                    ...comp,
                    seasonsData: seasonsIndex
                };
            } catch (error) {
                console.error(`Error loading seasons for ${comp.id}:`, error);
                return {
                    ...comp,
                    seasonsData: null
                };
            }
        })
    );

    // Render each competition card
    competitionsWithSeasons.forEach(comp => {
        const card = createCompetitionCard(comp);
        container.appendChild(card);

        // Add user stats card after Liga Europa
        if (comp.id === 'ligaeuropa') {
            const userStatsCard = createUserStatsCard();
            container.appendChild(userStatsCard);
        }
    });
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
 * Create user stats card element
 */
function createUserStatsCard() {
    const card = document.createElement('a');
    card.className = 'competition-card user-stats-card';
    card.href = 'user-stats.html';
    card.style.borderLeftColor = '#6366f1'; // Indigo color for differentiation
    card.style.borderLeftWidth = '4px';

    card.innerHTML = `
        <div class="competition-icon">📊</div>
        <h3 class="competition-name">Statistiques Joueurs</h3>
        <div class="competition-type">Performances - Tous les joueurs</div>

        <div class="competition-stats">
            <div class="competition-stat">
                <span class="competition-stat-value">260</span>
                <span class="competition-stat-label">joueurs</span>
            </div>
        </div>
    `;

    return card;
}

/**
 * Create competition card element
 */
function createCompetitionCard(comp) {
    const card = document.createElement('a');
    card.className = 'competition-card';
    card.href = `competition.html?competition=${comp.id}`;
    card.style.borderLeftColor = getCompetitionColor(comp.id);
    card.style.borderLeftWidth = '4px';

    const totalSeasons = comp.seasonsData?.seasons?.length || comp.seasons?.length || 0;

    card.innerHTML = `
        <div class="competition-icon">${getCompetitionIcon(comp.id)}</div>
        <h3 class="competition-name">${comp.name}</h3>
        <div class="competition-type">${getCompetitionType(comp.type)} - ${comp.country}</div>

        <div class="competition-stats">
            <div class="competition-stat">
                <span class="competition-stat-value">${totalSeasons}</span>
                <span class="competition-stat-label">saison${totalSeasons > 1 ? 's' : ''}</span>
            </div>
        </div>
    `;

    return card;
}

/**
 * Create seasons list HTML
 */
function createSeasonsList(comp) {
    if (!comp.seasonsData || !comp.seasonsData.seasons) return '';

    const seasons = comp.seasonsData.seasons;
    const competitionPath = getCompetitionPath(comp.id);

    const seasonsHTML = seasons
        .sort((a, b) => {
            // Sort by year descending (most recent first)
            const yearA = a.year.split('-')[0];
            const yearB = b.year.split('-')[0];
            return yearB.localeCompare(yearA);
        })
        .map(season => {
            const statusClass = getStatusClass(season.status);
            const statusEmoji = season.status === 'ongoing' ? '🔴' :
                               season.status === 'finished' ? '✅' : '⏳';

            return `
                <a href="season.html?competition=${comp.id}&season=${season.year}"
                   class="season-link ${statusClass}"
                   title="${season.name} - ${getStatusLabel(season.status)}">
                    ${statusEmoji} ${season.year}
                </a>
            `;
        })
        .join('');

    return `
        <div class="seasons-list">
            <h4>Saisons disponibles</h4>
            <div class="seasons-grid">
                ${seasonsHTML}
            </div>
        </div>
    `;
}

/**
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', init);
