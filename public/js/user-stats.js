/**
 * User Statistics Page - Pronos Potes
 * Display detailed statistics for each user across all seasons
 */

// State
let allUsers = [];
let palmares = null;
let journeeStats = null;
let selectedUserId = null;
let selectedUser = null;
let userSeasons = []; // All seasons where user participated
let filteredSeasons = []; // Filtered seasons

/**
 * Initialize the page
 */
async function init() {
    try {
        // Load users, palmares and journee stats
        await Promise.all([
            loadUsers(),
            loadPalmares(),
            loadJourneeStats()
        ]);

        // Setup event listeners
        setupEventListeners();

        // Render users grid
        renderUsersGrid();

    } catch (error) {
        console.error('Error initializing page:', error);
        showError('users-grid', 'Impossible de charger les données.');
    }
}

/**
 * Load users data
 */
async function loadUsers() {
    const url = `${DATA_BASE_PATH}/metadata/users.json`;
    const data = await fetchWithCache(url, 1440);

    if (!data || !data.users) {
        throw new Error('Invalid users data');
    }

    allUsers = data.users;
    console.log(`✅ Loaded ${allUsers.length} users from users.json`);
    console.log('First user sample:', allUsers[0]);
}

/**
 * Load palmares data
 */
async function loadPalmares() {
    const url = `${DATA_BASE_PATH}/metadata/palmares.json`;
    try {
        palmares = await fetchWithCache(url, 1440);
    } catch (error) {
        console.warn('Palmares not found, continuing without victory data');
        palmares = { palmares: [] };
    }
}

/**
 * Load journee stats data
 */
async function loadJourneeStats() {
    const url = `${DATA_BASE_PATH}/metadata/journee-stats.json`;
    try {
        journeeStats = await fetchWithCache(url, 1440);
    } catch (error) {
        console.warn('Journee stats not found, continuing without journee data');
        journeeStats = { stats: [] };
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-user');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            filterUsers(e.target.value);
        }, 300));
    }

    // Sort
    const sortSelect = document.getElementById('sort-users');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortUsers(e.target.value);
        });
    }

    // Back button
    const backBtn = document.getElementById('back-to-selection');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showUserSelection();
        });
    }

    // Competition filter
    const compFilter = document.getElementById('filter-competition');
    if (compFilter) {
        compFilter.addEventListener('change', () => {
            applyFilters();
        });
    }

    // Season filter
    const seasonFilter = document.getElementById('filter-season');
    if (seasonFilter) {
        seasonFilter.addEventListener('change', () => {
            applyFilters();
        });
    }
}

/**
 * Render users grid
 */
function renderUsersGrid() {
    const container = document.getElementById('users-grid');
    if (!container) return;

    container.classList.remove('loading');

    // Sort by name by default
    const sortedUsers = [...allUsers].sort((a, b) =>
        a.username.localeCompare(b.username)
    );

    container.innerHTML = sortedUsers.map(user => {
        const userPalmares = palmares.palmares.find(p => p.userId === user.id);
        const victories = userPalmares ? userPalmares.totalVictories : 0;
        const stars = '⭐'.repeat(victories);

        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-card-header">
                    <div class="user-card-name">${user.username}</div>
                    ${victories > 0 ? `<div class="user-card-stars">${stars}</div>` : ''}
                </div>
                <div class="user-card-stats">
                    ${victories > 0 ? `<div class="user-card-stat">🏆 ${victories}</div>` : ''}
                    <div class="user-card-stat">📊 ${formatNumber(user.careerStats.totalPoints)} pts</div>
                    <div class="user-card-stat">🎯 ${user.totalParticipations} saisons</div>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners
    container.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.dataset.userId);
            selectUser(userId);
        });
    });
}

/**
 * Filter users by search term
 */
function filterUsers(searchTerm) {
    const container = document.getElementById('users-grid');
    if (!container) return;

    const cards = container.querySelectorAll('.user-card');

    cards.forEach(card => {
        const name = card.querySelector('.user-card-name').textContent.toLowerCase();
        const matches = name.includes(searchTerm.toLowerCase());
        card.style.display = matches ? 'block' : 'none';
    });
}

/**
 * Sort users
 */
function sortUsers(sortBy) {
    let sorted = [...allUsers];

    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => a.username.localeCompare(b.username));
            break;
        case 'victories':
            sorted.sort((a, b) => {
                const aV = palmares.palmares.find(p => p.userId === a.id)?.totalVictories || 0;
                const bV = palmares.palmares.find(p => p.userId === b.id)?.totalVictories || 0;
                return bV - aV;
            });
            break;
        case 'totalPoints':
            sorted.sort((a, b) => b.careerStats.totalPoints - a.careerStats.totalPoints);
            break;
        case 'participations':
            sorted.sort((a, b) => b.careerStats.totalParticipations - a.careerStats.totalParticipations);
            break;
    }

    allUsers = sorted;
    renderUsersGrid();
}

/**
 * Select a user and show their stats
 */
async function selectUser(userId) {
    selectedUserId = userId;
    selectedUser = allUsers.find(u => u.id === userId);

    if (!selectedUser) return;

    // Show stats section, hide selection
    document.getElementById('user-stats-section').style.display = 'block';
    document.querySelector('.user-selection-section').style.display = 'none';

    // Load user's seasons data
    await loadUserSeasons();

    // Render user stats
    renderUserHeader();
    renderGlobalStats();
    populateSeasonFilter();
    applyFilters();
}

/**
 * Show user selection
 */
function showUserSelection() {
    document.getElementById('user-stats-section').style.display = 'none';
    document.querySelector('.user-selection-section').style.display = 'block';
    selectedUserId = null;
    selectedUser = null;
    userSeasons = [];
}

/**
 * Load all seasons where user participated
 */
async function loadUserSeasons() {
    userSeasons = [];

    const competitions = {
        'ligue1': 'ligue-1',
        'ldc': 'ligue-champions',
        'ligaeuropa': 'liga-europa',
        'top14': 'top-14',
        'international': 'international'
    };

    for (const [compId, compPath] of Object.entries(competitions)) {
        try {
            // Load seasons index
            const seasonsIndex = await fetchWithCache(
                `${DATA_BASE_PATH}/${compPath}/seasons-index.json`,
                1440
            );

            if (!seasonsIndex || !seasonsIndex.seasons) continue;

            // Load standings for each season
            for (const season of seasonsIndex.seasons) {
                try {
                    const standings = await fetchWithCache(
                        `${DATA_BASE_PATH}/${compPath}/${season.year}/standings-general.json`,
                        60
                    );

                    if (!standings || !standings.ranking) continue;

                    // Find user in rankings
                    const userRank = standings.ranking.find(r => r.userId === selectedUserId);

                    if (userRank) {
                        userSeasons.push({
                            competition: compId,
                            competitionName: getCompetitionName(compId),
                            season: season.year,
                            ...userRank
                        });
                    }
                } catch (error) {
                    console.warn(`Could not load season ${season.year} for ${compPath}`);
                }
            }
        } catch (error) {
            console.warn(`Could not load seasons for ${compPath}`);
        }
    }

    // Sort by season year descending
    userSeasons.sort((a, b) => {
        const yearA = a.season.split('-')[0];
        const yearB = b.season.split('-')[0];
        return yearB.localeCompare(yearA);
    });
}

/**
 * Render user header
 */
function renderUserHeader() {
    const nameEl = document.getElementById('user-name');
    const starsEl = document.getElementById('user-stars');

    if (nameEl) {
        nameEl.textContent = selectedUser.username;
    }

    if (starsEl) {
        const userPalmares = palmares.palmares.find(p => p.userId === selectedUserId);
        if (userPalmares && userPalmares.totalVictories > 0) {
            const stars = '⭐'.repeat(userPalmares.totalVictories);
            starsEl.innerHTML = `${stars} <span class="victories-count">${userPalmares.totalVictories} victoire${userPalmares.totalVictories > 1 ? 's' : ''}</span>`;
        } else {
            starsEl.innerHTML = '';
        }
    }
}

/**
 * Render global stats
 */
function renderGlobalStats() {
    const userPalmares = palmares.palmares.find(p => p.userId === selectedUserId);
    const victories = userPalmares ? userPalmares.totalVictories : 0;

    document.getElementById('total-victories').textContent = victories;
    document.getElementById('total-points').textContent = formatNumber(selectedUser.careerStats.totalPoints);
    document.getElementById('total-participations').textContent = selectedUser.totalParticipations;
    document.getElementById('success-rate').textContent = selectedUser.careerStats.globalSuccessRate + '%';

    // Render competition stats
    renderCompetitionStats();
}

/**
 * Render competition statistics
 */
function renderCompetitionStats() {
    const container = document.getElementById('competition-stats-grid');
    if (!container) return;

    const competitions = [
        { id: 'ligue1', name: 'Ligue 1', type: 'Football - France', emoji: '⚽' },
        { id: 'ldc', name: 'Ligue des Champions', type: 'Football - Europe', emoji: '🏆' },
        { id: 'ligaeuropa', name: 'Liga Europa', type: 'Football - Europe', emoji: '🌍' },
        { id: 'top14', name: 'TOP 14', type: 'Rugby - France', emoji: '🏉' },
        { id: 'international', name: 'International', type: 'Multi-Sports', emoji: '🌟' }
    ];

    const userPalmares = palmares.palmares.find(p => p.userId === selectedUserId);
    const victoriesByComp = {};

    if (userPalmares) {
        userPalmares.victories.forEach(victory => {
            const comp = victory.competition === 'ligue-1' ? 'ligue1' :
                        victory.competition === 'ligue-champions' ? 'ldc' :
                        victory.competition === 'liga-europa' ? 'ligaeuropa' :
                        victory.competition === 'top-14' ? 'top14' :
                        victory.competition;
            victoriesByComp[comp] = (victoriesByComp[comp] || 0) + 1;
        });
    }

    // Get journee stats for this user
    const userJourneeStats = journeeStats.stats.find(s => s.userId === selectedUserId);

    // Filter competitions where user has participated
    const activeCompetitions = competitions.filter(comp => {
        const compSeasons = userSeasons.filter(s => s.competition === comp.id);
        return compSeasons.length > 0; // Only show if user has participated at least once
    });

    container.innerHTML = activeCompetitions.map(comp => {
        const compSeasons = userSeasons.filter(s => s.competition === comp.id);
        const victories = victoriesByComp[comp.id] || 0;
        const podiums = compSeasons.filter(s => s.rank <= 3).length;
        const bestRank = compSeasons.length > 0 ? Math.min(...compSeasons.map(s => s.rank)) : '-';
        const participations = compSeasons.length;

        // Journee stats
        const journeeVictoires = userJourneeStats ? userJourneeStats.byCompetition[comp.id].victoires : 0;
        const journeePodiums = userJourneeStats ? userJourneeStats.byCompetition[comp.id].podiums : 0;

        return `
            <div class="competition-stat-card ${comp.id}" data-competition="${comp.id}">
                <div class="competition-stat-header">
                    <div class="competition-stat-emoji" style="font-size: 2.5rem;">${comp.emoji}</div>
                    <div class="competition-stat-name">
                        <div class="competition-stat-title">${comp.name}</div>
                        <div class="competition-stat-type">${comp.type}</div>
                    </div>
                </div>
                <div class="competition-stat-metrics">
                    <div class="competition-metric">
                        <div class="competition-metric-value">${victories > 0 ? '🏆 ' + victories : '-'}</div>
                        <div class="competition-metric-label">Victoires</div>
                    </div>
                    <div class="competition-metric">
                        <div class="competition-metric-value">${podiums > 0 ? '🥇 ' + podiums : '-'}</div>
                        <div class="competition-metric-label">Podiums</div>
                    </div>
                    <div class="competition-metric">
                        <div class="competition-metric-value">${bestRank !== '-' ? bestRank + (bestRank === 1 ? 'er' : 'ème') : '-'}</div>
                        <div class="competition-metric-label">Meilleur rang</div>
                    </div>
                    <div class="competition-metric">
                        <div class="competition-metric-value">${participations}</div>
                        <div class="competition-metric-label">Participations</div>
                    </div>
                    <div class="competition-metric">
                        <div class="competition-metric-value">${journeeVictoires > 0 ? '⭐ ' + journeeVictoires : '-'}</div>
                        <div class="competition-metric-label">Victoires journées</div>
                    </div>
                    <div class="competition-metric">
                        <div class="competition-metric-value">${journeePodiums > 0 ? '🎯 ' + journeePodiums : '-'}</div>
                        <div class="competition-metric-label">Podiums journées</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners to filter by competition
    container.querySelectorAll('.competition-stat-card').forEach(card => {
        card.addEventListener('click', () => {
            const compId = card.dataset.competition;
            document.getElementById('filter-competition').value = compId;
            applyFilters();
            // Scroll to table
            document.querySelector('.seasons-table-section').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

/**
 * Populate season filter based on user's seasons
 */
function populateSeasonFilter() {
    const seasonFilter = document.getElementById('filter-season');
    if (!seasonFilter) return;

    // Get unique seasons
    const seasons = [...new Set(userSeasons.map(s => s.season))].sort().reverse();

    seasonFilter.innerHTML = '<option value="all">Toutes les saisons</option>' +
        seasons.map(season => `<option value="${season}">${season}</option>`).join('');
}

/**
 * Apply filters
 */
function applyFilters() {
    const compFilter = document.getElementById('filter-competition').value;
    const seasonFilter = document.getElementById('filter-season').value;

    filteredSeasons = userSeasons.filter(s => {
        if (compFilter !== 'all' && s.competition !== compFilter) return false;
        if (seasonFilter !== 'all' && s.season !== seasonFilter) return false;
        return true;
    });

    renderSeasonsTable();
    // renderBestPerformances(); // Disabled - HTML elements not present in the page
}

/**
 * Render seasons table
 */
function renderSeasonsTable() {
    const container = document.getElementById('seasons-table-container');
    if (!container) return;

    container.classList.remove('loading');

    if (filteredSeasons.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune participation trouvée avec ces filtres.</p>';
        return;
    }

    const tableHTML = `
        <table class="seasons-table">
            <thead>
                <tr>
                    <th>Compétition</th>
                    <th>Saison</th>
                    <th class="text-center">Classement</th>
                    <th class="text-center">Points</th>
                    <th class="text-center">Pronos</th>
                    <th class="text-center">Corrects</th>
                    <th class="text-center">Taux</th>
                </tr>
            </thead>
            <tbody>
                ${filteredSeasons.map(s => `
                    <tr class="${s.rank === 1 ? 'victory-row' : ''}">
                        <td>
                            <span class="competition-badge" style="background: ${getCompetitionColor(s.competition)}20; color: ${getCompetitionColor(s.competition)};">
                                ${s.competitionName}
                            </span>
                        </td>
                        <td>
                            <a href="season.html?competition=${s.competition}&season=${s.season}" class="season-link">
                                ${s.season}
                            </a>
                        </td>
                        <td class="text-center">
                            ${s.rank === 1 ? '🏆' : ''}
                            ${s.rank}${s.rank === 1 ? 'er' : 'e'}
                        </td>
                        <td class="text-center bold">${formatNumber(s.points)}</td>
                        <td class="text-center">${formatNumber(s.pronostics)}</td>
                        <td class="text-center">${formatNumber(s.bons1N2 || s.corrects || 0)}</td>
                        <td class="text-center">${(s.tauxExactScores || s.successRate || 0)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

/**
 * Render best performances
 */
function renderBestPerformances() {
    if (filteredSeasons.length === 0) {
        document.getElementById('best-season').textContent = '-';
        document.getElementById('most-points').textContent = '-';
        document.getElementById('best-rate').textContent = '-';
        return;
    }

    // Best season (rank 1)
    const victories = filteredSeasons.filter(s => s.rank === 1);
    if (victories.length > 0) {
        const bestVictory = victories.sort((a, b) => b.points - a.points)[0];
        document.getElementById('best-season').innerHTML = `
            ${bestVictory.competitionName} ${bestVictory.season}<br>
            <small>${formatNumber(bestVictory.points)} points</small>
        `;
    } else {
        const bestRank = [...filteredSeasons].sort((a, b) => a.rank - b.rank)[0];
        document.getElementById('best-season').innerHTML = `
            ${bestRank.rank}${bestRank.rank === 1 ? 'er' : 'e'} - ${bestRank.competitionName} ${bestRank.season}<br>
            <small>${formatNumber(bestRank.points)} points</small>
        `;
    }

    // Most points
    const mostPoints = [...filteredSeasons].sort((a, b) => b.points - a.points)[0];
    document.getElementById('most-points').innerHTML = `
        ${formatNumber(mostPoints.points)} points<br>
        <small>${mostPoints.competitionName} ${mostPoints.season}</small>
    `;

    // Best rate
    const bestRate = [...filteredSeasons]
        .filter(s => s.pronostics > 10) // Min 10 pronostics
        .sort((a, b) => {
            const rateA = parseFloat(a.tauxExactScores || a.successRate || 0);
            const rateB = parseFloat(b.tauxExactScores || b.successRate || 0);
            return rateB - rateA;
        })[0];

    if (bestRate) {
        document.getElementById('best-rate').innerHTML = `
            ${bestRate.tauxExactScores || bestRate.successRate}%<br>
            <small>${bestRate.competitionName} ${bestRate.season}</small>
        `;
    } else {
        document.getElementById('best-rate').textContent = '-';
    }
}

/**
 * Get competition name
 */
function getCompetitionName(compId) {
    const names = {
        'ligue1': 'Ligue 1',
        'ldc': 'Ligue des Champions',
        'ligaeuropa': 'Liga Europa',
        'top14': 'TOP 14',
        'international': 'International'
    };
    return names[compId] || compId;
}

/**
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', init);
