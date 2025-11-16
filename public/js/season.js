/**
 * Season Page - Pronos Potes
 * Displays season standings, journées, and history
 */

// State
let currentCompetition = null;
let currentSeason = null;
let seasonMeta = null;
let standingsData = null;
let historyData = null;
let journeesData = {};
let allUsers = [];
let seasonWinners = []; // IDs des vainqueurs de la saison
let palmaresData = null; // Palmarès global de tous les joueurs
let teamLogos = null; // Logos des équipes

/**
 * Initialize the page
 */
async function init() {
    // Clean old cache entries on startup to prevent localStorage overflow
    storage.cleanOldCache();

    const params = getUrlParams();

    if (!params.competition || !params.season) {
        window.location.href = 'index.html';
        return;
    }

    currentCompetition = params.competition;
    currentSeason = params.season;

    try {
        // Load team logos
        await loadTeamLogos();

        // Load palmares (global)
        await loadPalmares();

        // Load season meta
        await loadSeasonMeta();

        // Load general standings
        await loadStandings();

        // Setup event listeners
        setupEventListeners();

        // Update page title
        updatePageTitle();

    } catch (error) {
        console.error('Error initializing page:', error);
        showError('season-info', 'Impossible de charger les données de la saison.');
    }
}

/**
 * Load team logos
 */
async function loadTeamLogos() {
    try {
        const url = `${DATA_BASE_PATH}/metadata/teams.json`;
        teamLogos = await fetchWithCache(url, 1440); // Cache 24h
    } catch (error) {
        console.error('Error loading team logos:', error);
        teamLogos = { teams: [] }; // Fallback
    }
}

/**
 * Get team logo URL
 */
function getTeamLogo(teamName) {
    if (!teamLogos || !teamLogos.teams) return null;
    const team = teamLogos.teams.find(t => t.name === teamName);
    return team?.logo || null;
}

/**
 * Load palmares (global victories for all players)
 */
async function loadPalmares() {
    try {
        const url = `${DATA_BASE_PATH}/metadata/palmares.json`;
        palmaresData = await fetchWithCache(url, 1440); // Cache 24h
    } catch (error) {
        console.error('Error loading palmares:', error);
        palmaresData = { palmares: [] }; // Fallback
    }
}

/**
 * Get stars for a user based on their total victories
 */
function getUserStars(userId) {
    if (!palmaresData || !palmaresData.palmares) return '';

    const playerPalmares = palmaresData.palmares.find(p => p.userId === userId);
    if (!playerPalmares || playerPalmares.totalVictories === 0) return '';

    const stars = '⭐'.repeat(playerPalmares.totalVictories);
    return `<span class="palmares-stars">${stars}</span>`;
}

/**
 * Load season metadata
 */
async function loadSeasonMeta() {
    const competitionPath = getCompetitionPath(currentCompetition);

    // Load from seasons-index.json to get accurate stats
    const indexUrl = `${DATA_BASE_PATH}/${competitionPath}/seasons-index.json`;
    const seasonsIndex = await fetchWithCache(indexUrl, 1440);

    // Find current season in index
    const seasonFromIndex = seasonsIndex.seasons.find(s => s.year === currentSeason);

    if (seasonFromIndex) {
        // Use data from index (has accurate match/user counts)
        seasonMeta = {
            name: seasonFromIndex.name,
            year: seasonFromIndex.year,
            status: seasonFromIndex.status,
            journees: seasonFromIndex.totalJournees || seasonFromIndex.journees,
            publishedJournees: seasonFromIndex.publishedJournees,
            activeJournee: seasonFromIndex.activeJournee,
            totalMatches: seasonFromIndex.totalMatches || 0,
            activeUsers: seasonFromIndex.activeUsers || 0,
            totalPronostics: seasonFromIndex.totalPronostics || 0,
            lastUpdate: seasonFromIndex.lastUpdated || new Date().toISOString(),
            startDate: seasonFromIndex.startDate,
            endDate: seasonFromIndex.endDate,
            logo: seasonFromIndex.logo || null
        };
    } else {
        // Fallback to season-meta.json
        const url = `${DATA_BASE_PATH}/${competitionPath}/${currentSeason}/season-meta.json`;
        seasonMeta = await fetchWithCache(url, 1440);
    }

    renderSeasonInfo();
}

/**
 * Load general standings
 */
async function loadStandings() {
    const competitionPath = getCompetitionPath(currentCompetition);
    const url = `${DATA_BASE_PATH}/${competitionPath}/${currentSeason}/standings-general.json`;

    standingsData = await fetchWithCache(url, 60);

    // Identifier le(s) vainqueur(s) de la saison (rang 1)
    if (standingsData && standingsData.ranking && standingsData.ranking.length > 0) {
        const topPoints = standingsData.ranking[0].points;
        seasonWinners = standingsData.ranking
            .filter(user => user.rank === 1 && user.points === topPoints)
            .map(user => user.userId);
    }

    renderStandings();
}

/**
 * Render season info section
 */
function renderSeasonInfo() {
    const container = document.getElementById('season-hero-info');
    if (!container || !seasonMeta) return;

    const icon = getCompetitionIcon(currentCompetition);
    const statusBadge = seasonMeta.status === 'ongoing' ?
        '<span class="status-badge status-ongoing">🔴 En cours</span>' :
        '<span class="status-badge status-finished">✅ Terminée</span>';

    // Use logo if available (for international competitions), otherwise use emoji
    const iconHtml = seasonMeta.logo
        ? `<img src="${seasonMeta.logo}" alt="${seasonMeta.name}" class="hero-logo-img" style="height: 80px; width: auto; object-fit: contain;">`
        : `<span class="hero-emoji">${icon}</span>`;

    container.innerHTML = `
        <h1 class="hero-title">
            ${iconHtml}
            <span>${seasonMeta.name}</span>
        </h1>
        <p class="hero-subtitle">${statusBadge}</p>

        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${seasonMeta.journees}</div>
                <div class="stat-label">Journées</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${formatNumber(seasonMeta.totalMatches || 0)}</div>
                <div class="stat-label">Matchs</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${seasonMeta.activeUsers || 0}</div>
                <div class="stat-label">Participants</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${formatNumber(seasonMeta.totalPronostics || 0)}</div>
                <div class="stat-label">Pronostics</div>
            </div>
        </div>
    `;

    // Update hero background color based on competition
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
        const competitionColor = getCompetitionColor(currentCompetition);
        const darkerColor = adjustColorBrightness(competitionColor, -20);
        heroSection.style.setProperty('--hero-bg-color', competitionColor);
        heroSection.style.setProperty('--hero-bg-dark', darkerColor);
    }

    // Show tabs nav
    document.getElementById('tabs-nav').style.display = 'flex';
}

/**
 * Render general standings table
 */
function renderStandings(filteredData = null) {
    const container = document.getElementById('standings-table');
    if (!container || !standingsData) return;

    container.classList.remove('loading');

    const rankings = filteredData || standingsData.ranking;

    if (rankings.length === 0) {
        container.innerHTML = '<p class="placeholder">Aucun résultat trouvé</p>';
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th class="text-center">Rang</th>
                    <th>Joueur</th>
                    <th class="text-center">Points</th>
                    <th class="text-center">Pronos</th>
                    <th class="text-center">Moy. 1N2/J</th>
                    <th class="text-center">Scores exacts</th>
                    <th class="text-center">Taux</th>
                    <th class="text-center">Meilleure J.</th>
                </tr>
            </thead>
            <tbody>
                ${rankings.map(user => createStandingsRow(user)).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

/**
 * Create a standings table row
 */
function createStandingsRow(user) {
    const rankDisplay = user.rank <= 3 ?
        `<span class="rank-medal">${getRankEmoji(user.rank)}</span>` :
        `<span class="rank-cell">${user.rank}</span>`;

    const moyenne1N2 = user.moyenne1N2 || "0.0";
    const exactScores = user.exactScores || 0;
    const tauxExactScores = user.tauxExactScores || user.successRate || "0.0";
    const successRateClass = parseFloat(tauxExactScores) >= 10 ? 'success-rate' : '';

    // Afficher les étoiles du palmarès global
    const stars = getUserStars(user.userId);
    const usernameDisplay = user.username + stars;

    return `
        <tr data-user-id="${user.userId}">
            <td class="text-center">${rankDisplay}</td>
            <td class="username-cell">${usernameDisplay}</td>
            <td class="text-center points-cell">${formatNumber(user.points)}</td>
            <td class="text-center">${formatNumber(user.pronostics)}</td>
            <td class="text-center">${moyenne1N2}</td>
            <td class="text-center">${formatNumber(exactScores)}</td>
            <td class="text-center ${successRateClass}">${tauxExactScores}%</td>
            <td class="text-center">
                <span class="badge badge-secondary">J${user.bestJournee}</span>
            </td>
        </tr>
    `;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Search filter
    const searchInput = document.getElementById('search-user');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            filterStandings(e.target.value);
        }, 300));
    }

    // Sort select
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortStandings(e.target.value);
        });
    }
}

/**
 * Switch between tabs
 */
async function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });

    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.style.display = 'block';
    }

    // Load data if needed
    if (tabName === 'journees' && Object.keys(journeesData).length === 0) {
        await setupJourneesTab();
    } else if (tabName === 'history' && !historyData) {
        await loadHistoryData();
    }
}

/**
 * Filter standings by username
 */
function filterStandings(searchTerm) {
    if (!standingsData) return;

    const filtered = standingsData.ranking.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    renderStandings(filtered);
}

/**
 * Sort standings
 */
function sortStandings(sortBy) {
    if (!standingsData) return;

    const sorted = [...standingsData.ranking].sort((a, b) => {
        switch (sortBy) {
            case 'successRate':
                return parseFloat(b.successRate) - parseFloat(a.successRate);
            case 'corrects':
                const aExact = a.exactScores !== undefined ? a.exactScores : a.corrects;
                const bExact = b.exactScores !== undefined ? b.exactScores : b.corrects;
                return bExact - aExact;
            case 'points':
            default:
                // Default sort by points (descending)
                return b.points - a.points;
        }
    });

    renderStandings(sorted);
}

/**
 * Setup journées tab
 */
async function setupJourneesTab() {
    if (!seasonMeta) return;

    const nav = document.getElementById('journees-nav');
    if (!nav) return;

    // Create improved navigation with arrows and select
    const selectOptions = [];
    for (let i = 1; i <= seasonMeta.publishedJournees; i++) {
        // Skip excluded journées
        if (seasonMeta.excludedJournees && seasonMeta.excludedJournees.includes(i)) {
            continue;
        }
        selectOptions.push(`<option value="${i}">Journée ${i}</option>`);
    }

    // Calculate actual number of available journées (excluding excluded ones)
    const excludedCount = seasonMeta.excludedJournees ? seasonMeta.excludedJournees.length : 0;
    const availableJournees = seasonMeta.publishedJournees - excludedCount;

    nav.innerHTML = `
        <div class="journee-nav-controls">
            <button class="journee-nav-btn journee-prev" data-action="prev" title="Journée précédente">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                </svg>
            </button>

            <div class="journee-selector-wrapper">
                <select class="journee-select" id="journee-select">
                    ${selectOptions.join('')}
                </select>
                <span class="journee-current-label">sur ${availableJournees}</span>
            </div>

            <button class="journee-nav-btn journee-next" data-action="next" title="Journée suivante">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
                </svg>
            </button>
        </div>

        <div class="journees-grid">
            ${Array.from({ length: seasonMeta.publishedJournees }, (_, i) => i + 1)
                .filter(i => !seasonMeta.excludedJournees || !seasonMeta.excludedJournees.includes(i))
                .map(i => `
                <button class="journee-btn" data-journee="${i}">J${i}</button>
            `).join('')}
        </div>
    `;

    // Event listener for select
    const select = document.getElementById('journee-select');
    select.addEventListener('change', async (e) => {
        const journeeNum = parseInt(e.target.value);
        await loadJourneeStandings(journeeNum);
        updateJourneeNavigation(journeeNum);
    });

    // Event listeners for arrow buttons
    nav.querySelector('.journee-prev').addEventListener('click', async () => {
        const current = parseInt(select.value);
        if (current > 1) {
            // Find previous journée (skipping excluded ones)
            let prev = current - 1;
            while (prev > 0 && seasonMeta.excludedJournees && seasonMeta.excludedJournees.includes(prev)) {
                prev--;
            }
            if (prev > 0) {
                await loadJourneeStandings(prev);
                updateJourneeNavigation(prev);
            }
        }
    });

    nav.querySelector('.journee-next').addEventListener('click', async () => {
        const current = parseInt(select.value);
        if (current < seasonMeta.publishedJournees) {
            // Find next journée (skipping excluded ones)
            let next = current + 1;
            while (next <= seasonMeta.publishedJournees && seasonMeta.excludedJournees && seasonMeta.excludedJournees.includes(next)) {
                next++;
            }
            if (next <= seasonMeta.publishedJournees) {
                await loadJourneeStandings(next);
                updateJourneeNavigation(next);
            }
        }
    });

    // Event listeners for grid buttons
    nav.querySelectorAll('.journee-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const journeeNum = parseInt(e.target.dataset.journee);
            await loadJourneeStandings(journeeNum);
            updateJourneeNavigation(journeeNum);
        });
    });

    // Auto-load the last journée by default (skipping excluded ones)
    let lastJournee = seasonMeta.publishedJournees;
    while (lastJournee > 0 && seasonMeta.excludedJournees && seasonMeta.excludedJournees.includes(lastJournee)) {
        lastJournee--;
    }
    if (lastJournee > 0) {
        await loadJourneeStandings(lastJournee);
        updateJourneeNavigation(lastJournee);
    }
}

/**
 * Update journée navigation state
 */
function updateJourneeNavigation(journeeNum) {
    const nav = document.getElementById('journees-nav');
    if (!nav) return;

    // Update select
    const select = document.getElementById('journee-select');
    if (select) select.value = journeeNum;

    // Update active button in grid
    nav.querySelectorAll('.journee-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.journee) === journeeNum);
    });

    // Update arrow buttons state
    const prevBtn = nav.querySelector('.journee-prev');
    const nextBtn = nav.querySelector('.journee-next');
    if (prevBtn) prevBtn.disabled = journeeNum === 1;
    if (nextBtn) nextBtn.disabled = journeeNum === seasonMeta.publishedJournees;
}

/**
 * Load journée standings
 */
async function loadJourneeStandings(journeeNum) {
    const container = document.getElementById('journee-standings');
    if (!container) return;

    showLoading('journee-standings', 'Chargement de la journée...');

    try {
        // Check in-memory cache first (no localStorage for journées to avoid quota issues)
        if (!journeesData[journeeNum]) {
            const competitionPath = getCompetitionPath(currentCompetition);
            const journeeFile = padJournee(journeeNum) + '.json';
            const url = `${DATA_BASE_PATH}/${competitionPath}/${currentSeason}/journees/${journeeFile}`;

            // Fetch without localStorage cache (use in-memory cache only)
            journeesData[journeeNum] = await fetchJSON(url);
        }

        const journeeData = journeesData[journeeNum];
        renderJourneeStandings(journeeData);

    } catch (error) {
        console.error('Error loading journée:', error);
        showError('journee-standings', 'Impossible de charger cette journée.');
    }
}

/**
 * Render journée standings
 */
function renderJourneeStandings(journeeData) {
    const container = document.getElementById('journee-standings');
    if (!container || !journeeData) return;

    container.classList.remove('loading');

    console.log('Rendering journée:', journeeData.j, 'with', journeeData.m.length, 'matches and', journeeData.cj.length, 'users');

    // Build matches header (fixed at top)
    const matchesHeaderHTML = journeeData.m.map(match => {
        const logo1 = getTeamLogo(match.t1);
        const logo2 = getTeamLogo(match.t2);

        return `
            <div class="match-header-cell">
                <div class="match-teams">
                    ${logo1 ?
                        `<img src="${logo1}" alt="${match.t1}" title="${match.t1}" class="team-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" />
                         <span class="team-name team-fallback" style="display:none;" title="${match.t1}">${getTeamShort(match.t1)}</span>` :
                        `<span class="team-name" title="${match.t1}">${getTeamShort(match.t1)}</span>`
                    }
                    ${logo2 ?
                        `<img src="${logo2}" alt="${match.t2}" title="${match.t2}" class="team-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" />
                         <span class="team-name team-fallback" style="display:none;" title="${match.t2}">${getTeamShort(match.t2)}</span>` :
                        `<span class="team-name" title="${match.t2}">${getTeamShort(match.t2)}</span>`
                    }
                </div>
                <div class="match-score">
                    <span class="score">${match.sc1} - ${match.sc2}</span>
                </div>
            </div>
        `;
    }).join('');

    // Get competition colors (moved before buildHeaderRow to use in repeated headers)
    const competitionColor = getCompetitionColor(currentCompetition);
    const darkerColor = adjustColorBrightness(competitionColor, -20);

    // Build repeated header row (for every 20 users) with competition colors
    const buildHeaderRow = () => `
        <tr class="journee-header-repeat" style="background: linear-gradient(135deg, ${competitionColor} 0%, ${darkerColor} 100%); border-top-color: ${darkerColor}; border-bottom-color: ${darkerColor};">
            <th class="rank-cell">Clt</th>
            <th class="username-cell sticky-username">Joueurs</th>
            ${journeeData.m.map(match => {
                const logo1 = getTeamLogo(match.t1);
                const logo2 = getTeamLogo(match.t2);
                return `
                    <th class="match-header-cell-repeat">
                        <div class="match-teams-small">
                            ${logo1 ? `<img src="${logo1}" alt="${match.t1}" title="${match.t1}" class="team-logo-small" onerror="this.style.display='none';" />` : ''}
                            ${logo2 ? `<img src="${logo2}" alt="${match.t2}" title="${match.t2}" class="team-logo-small" onerror="this.style.display='none';" />` : ''}
                        </div>
                        <div class="match-score-small">${match.sc1}-${match.sc2}</div>
                    </th>
                `;
            }).join('')}
            <th class="stats-cell">1N2</th>
            <th class="stats-cell">Points</th>
        </tr>
    `;

    // Build user rows with all pronostics
    const userRowsHTML = journeeData.cj.map((user, index) => {
        const stars = getUserStars(user.u);
        const usernameDisplay = user.un + stars;

        // Find all pronostics for this user
        const userPronostics = journeeData.m.map(match => {
            const prono = match.pr.find(p => p.u === user.u);
            return prono || null;
        });

        // Calculate total points from exact scores
        const totalExactPoints = userPronostics.reduce((sum, p) => sum + (p ? p.pts : 0), 0);

        const pronosHTML = userPronostics.map((prono, matchIndex) => {
            const match = journeeData.m[matchIndex];
            if (!prono) {
                return '<td class="prono-cell prono-missing">-</td>';
            }

            const isCorrect1N2 = prono.c === 1;
            const isExactScore = prono.se === 1;
            const points = prono.pts;

            let cellClass = 'prono-cell';
            if (isExactScore) {
                cellClass += ' prono-exact';
            } else if (isCorrect1N2) {
                cellClass += ' prono-correct';
            } else {
                cellClass += ' prono-wrong';
            }

            return `
                <td class="${cellClass}">
                    <div class="prono-score">${prono.p1} - ${prono.p2}</div>
                    ${points > 0 ? `<div class="prono-points">+${points}</div>` : ''}
                </td>
            `;
        }).join('');

        // Insert repeated header every 20 rows (after rows 20, 40, 60, etc.)
        const headerRow = (index > 0 && (index) % 20 === 0) ? buildHeaderRow() : '';

        return `
            ${headerRow}
            <tr class="user-row">
                <td class="rank-cell">${index + 1 <= 3 ? getRankEmoji(index + 1) : index + 1}</td>
                <td class="username-cell sticky-username">${usernameDisplay}</td>
                ${pronosHTML}
                <td class="stats-cell stats-1n2">
                    <div class="stats-value">${user.c}</div>
                    <div class="stats-points">+${user.bonus || 0}</div>
                </td>
                <td class="stats-cell stats-total">
                    <div class="stats-value bold">${user.pj}</div>
                </td>
            </tr>
        `;
    }).join('');

    const tableHTML = `
        <div class="journee-table-wrapper">
            <div class="journee-header-fixed" style="background: linear-gradient(135deg, ${competitionColor} 0%, ${darkerColor} 100%); border-bottom-color: ${darkerColor};">
                <div class="journee-header-row">
                    <div class="header-spacer-rank">Clt</div>
                    <div class="header-spacer-username">Joueurs</div>
                    ${matchesHeaderHTML}
                    <div class="header-spacer-stats">1N2</div>
                    <div class="header-spacer-stats">Points</div>
                </div>
            </div>
            <div class="journee-table-scroll">
                <table class="journee-table">
                    <tbody>
                        ${userRowsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Build mobile view
    let mobileViewHTML = '';
    try {
        mobileViewHTML = buildMobileJourneeView(journeeData, competitionColor, darkerColor);
    } catch (error) {
        console.error('Error building mobile view:', error);
        mobileViewHTML = ''; // Fallback to desktop-only view
    }

    container.innerHTML = tableHTML + mobileViewHTML;
}

/**
 * Build mobile-friendly journée view
 */
function buildMobileJourneeView(journeeData, competitionColor, darkerColor) {
    const totalMatches = journeeData.m.length;
    const totalUsers = journeeData.cj.length;

    const userCardsHTML = journeeData.cj.map((user, index) => {
        const stars = getUserStars(user.u);
        const usernameDisplay = user.un + stars;

        // Find all pronostics for this user
        const userPronostics = journeeData.m.map(match => {
            const prono = match.pr.find(p => p.u === user.u);
            return prono || null;
        });

        // Calculate total points from exact scores
        const totalExactPoints = userPronostics.reduce((sum, p) => sum + (p ? p.pts : 0), 0);

        // Médailles pour le top 3
        let rankDisplay = user.pj > 0 ? (index + 1) : '-';
        if (index === 0 && user.pj > 0) rankDisplay = '🥇';
        else if (index === 1 && user.pj > 0) rankDisplay = '🥈';
        else if (index === 2 && user.pj > 0) rankDisplay = '🥉';

        // Build match rows for this user
        const matchRowsHTML = journeeData.m.map((match, matchIndex) => {
            const prono = userPronostics[matchIndex];
            const logo1 = getTeamLogo(match.t1);
            const logo2 = getTeamLogo(match.t2);

            let pronoClass = '';
            let pronoHTML = '<span style="color: #9ca3af;">-</span>';
            let pointsHTML = '';

            if (prono) {
                const isCorrect1N2 = prono.c === 1;
                const isExactScore = prono.se === 1;

                if (isExactScore) {
                    pronoClass = 'exact-score';
                } else if (isCorrect1N2) {
                    pronoClass = 'correct-1n2';
                }

                pronoHTML = `${prono.p1}-${prono.p2}`;

                if (prono.pts > 0) {
                    pointsHTML = `<div class="journee-prono-points">+${prono.pts}</div>`;
                }
            }

            return `
                <div class="journee-match-row">
                    <div class="journee-match-teams">
                        <div class="journee-match-team">
                            ${logo1 ? `<img src="${logo1}" alt="${match.t1}" class="journee-team-logo" onerror="this.style.display='none';" />` : ''}
                            <span class="journee-team-name">${match.t1}</span>
                        </div>
                        <div class="journee-match-team">
                            ${logo2 ? `<img src="${logo2}" alt="${match.t2}" class="journee-team-logo" onerror="this.style.display='none';" />` : ''}
                            <span class="journee-team-name">${match.t2}</span>
                        </div>
                    </div>
                    <div class="journee-match-score">${match.sc1}-${match.sc2}</div>
                    <div class="journee-match-prono">
                        <div class="journee-prono-scores ${pronoClass}">${pronoHTML}</div>
                        ${pointsHTML}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="journee-user-card">
                <div class="journee-user-header" style="background: linear-gradient(135deg, ${competitionColor} 0%, ${darkerColor} 100%);">
                    <div class="journee-user-info">
                        <div class="journee-user-rank">${rankDisplay}</div>
                        <div class="journee-user-name">${usernameDisplay}</div>
                    </div>
                    <div class="journee-user-points">
                        <div class="journee-points-total">${user.pj}</div>
                        <div class="journee-points-label">points</div>
                    </div>
                </div>
                <div class="journee-user-stats">
                    <div class="journee-stat-item">
                        <span class="journee-stat-icon">✓</span>
                        <span>${user.c} 1N2</span>
                    </div>
                    ${(user.se && user.se > 0) ? `
                        <div class="journee-stat-item">
                            <span class="journee-stat-icon">🎯</span>
                            <span>${user.se} exact${user.se > 1 ? 's' : ''}</span>
                        </div>
                    ` : ''}
                    ${totalExactPoints > 0 ? `
                        <div class="journee-stat-item">
                            <span class="journee-stat-icon">⭐</span>
                            <span>${totalExactPoints} pts</span>
                        </div>
                    ` : ''}
                </div>
                <div class="journee-user-pronostics">
                    ${matchRowsHTML}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="journee-mobile-view">
            <div class="journee-mobile-header" style="background: linear-gradient(135deg, ${competitionColor} 0%, ${darkerColor} 100%);">
                <h3>Journée ${journeeData.j}</h3>
                <div class="journee-mobile-stats">
                    <span>${totalMatches} matchs</span>
                    <span>•</span>
                    <span>${totalUsers} joueurs</span>
                </div>
            </div>
            ${userCardsHTML}
        </div>
    `;
}

/**
 * Get short team name (first 3 letters or abbreviation)
 */
function getTeamShort(teamName) {
    const abbreviations = {
        'Paris SG': 'PSG',
        'Marseille': 'OM',
        'Lyon': 'OL',
        'Saint-Etienne': 'ASSE',
        'Montpellier': 'MHSC',
        'Bordeaux': 'FCGB',
        'Lens': 'RCL',
        'Strasbourg': 'RCSA',
        'Le Havre': 'HAC',
        'Toulouse': 'TFC',
        'Nantes': 'FCN',
        'Stade Brestois': 'SB29',
        'Reims': 'SDR',
        'Angers': 'SCO'
    };

    return abbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
}

/**
 * Load history data
 */
async function loadHistoryData() {
    const container = document.getElementById('history-chart');
    if (!container) return;

    try {
        const competitionPath = getCompetitionPath(currentCompetition);
        const url = `${DATA_BASE_PATH}/${competitionPath}/${currentSeason}/standings-history.json`;

        console.log('Loading history from:', url);
        // Don't cache history in localStorage (too large), use in-memory cache only
        historyData = await fetchJSON(url);
        console.log('History data loaded:', historyData);

        if (!historyData || !historyData.history || historyData.history.length === 0) {
            showError('history-chart', 'Aucune donnée d\'historique disponible pour cette saison.');
            return;
        }

        renderHistoryChart();

    } catch (error) {
        console.error('Error loading history:', error);
        showError('history-chart', `Impossible de charger l'historique. ${error.message}`);
    }
}

/**
 * Chart instance (global to destroy and recreate)
 */
let historyChartInstance = null;

/**
 * Render history chart with Chart.js
 */
function renderHistoryChart() {
    const container = document.getElementById('history-chart');
    if (!container || !historyData) return;

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        container.innerHTML = `
            <div class="placeholder">
                <p>⏳ Chargement de la bibliothèque de graphiques...</p>
            </div>
        `;
        // Retry after a short delay
        setTimeout(renderHistoryChart, 500);
        return;
    }

    container.classList.remove('loading');

    // Get filter values
    const topNValue = document.getElementById('top-n')?.value || '10';
    const searchTerm = document.getElementById('search-user-history')?.value?.toLowerCase() || '';

    // Determine which users to show
    let usersToShow = [];
    if (searchTerm) {
        // Filter by search term if provided (takes priority)
        usersToShow = standingsData.ranking.filter(user =>
            user.username.toLowerCase().includes(searchTerm)
        ).slice(0, 10);
    } else if (topNValue === 'all') {
        // Show all users from final standings (limited to 50 for performance)
        usersToShow = standingsData.ranking.slice(0, 50);
    } else {
        // Show top N users
        const topN = parseInt(topNValue) || 10;
        usersToShow = standingsData.ranking.slice(0, topN);
    }

    // Safety check
    if (usersToShow.length === 0) {
        container.innerHTML = `
            <div class="placeholder">
                <p>Aucun joueur trouvé</p>
            </div>
        `;
        return;
    }

    // Create canvas for chart
    container.innerHTML = `
        <canvas id="evolution-canvas"></canvas>
    `;

    const canvas = document.getElementById('evolution-canvas');
    const ctx = canvas.getContext('2d');

    // Prepare data for Chart.js
    const journees = historyData.history.map(j => `J${j.journee}`);
    const competitionColor = getCompetitionColor(currentCompetition);

    // Create datasets for each user
    const datasets = usersToShow.map((user, index) => {
        // Extract rank evolution for this user
        const rankData = historyData.history.map(journee => {
            const userRank = journee.standings.find(s => s.userId === user.userId);
            return userRank ? userRank.rank : null;
        });

        // Generate color (gradient from competition color)
        const colors = generateChartColors(usersToShow.length, competitionColor);

        return {
            label: user.username,
            data: rankData,
            borderColor: colors[index],
            backgroundColor: colors[index],
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.1,
            spanGaps: false
        };
    });

    // Destroy previous chart if exists
    if (historyChartInstance) {
        historyChartInstance.destroy();
    }

    // Create new chart with error handling
    try {
        historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: journees,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 20,
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}e place`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    reverse: true, // Lower rank = better position
                    beginAtZero: false,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return value + 'e';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Classement'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Journée'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });

        // Setup filter event listeners
        setupHistoryFilters();

        // Render stats
        renderHistoryStats();

    } catch (error) {
        console.error('Error creating chart:', error);
        container.innerHTML = `
            <div class="placeholder">
                <p style="color: #dc2626;">❌ Erreur lors de la création du graphique</p>
                <p style="font-size: 0.9rem; color: var(--gray-600); margin-top: 0.5rem;">
                    ${error.message}
                </p>
            </div>
        `;
    }
}

/**
 * Setup history filter event listeners
 */
function setupHistoryFilters() {
    const topNSelect = document.getElementById('top-n');
    const searchInput = document.getElementById('search-user-history');

    if (topNSelect) {
        topNSelect.removeEventListener('change', renderHistoryChart);
        topNSelect.addEventListener('change', renderHistoryChart);
    }

    if (searchInput) {
        searchInput.removeEventListener('input', handleHistorySearch);
        searchInput.addEventListener('input', debounce(handleHistorySearch, 300));
    }
}

/**
 * Handle history search
 */
function handleHistorySearch() {
    renderHistoryChart();
}

/**
 * Generate chart colors from base color
 */
function generateChartColors(count, baseColor) {
    const colors = [];
    const hsl = hexToHSL(baseColor);

    for (let i = 0; i < count; i++) {
        // Vary hue and lightness
        const hue = (hsl.h + (i * 360 / count)) % 360;
        const lightness = 40 + (i % 3) * 15;
        colors.push(`hsl(${hue}, 70%, ${lightness}%)`);
    }

    return colors;
}

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * Render history stats with advanced insights
 */
function renderHistoryStats() {
    if (!historyData || !standingsData) return;

    const container = document.getElementById('history-stats');
    if (!container) return;

    const firstJournee = historyData.history[0];
    const lastJournee = historyData.history[historyData.history.length - 1];

    const winner = lastJournee.standings[0];
    const firstLeader = firstJournee.standings[0];

    // Calculate advanced stats
    const stats = calculateAdvancedStats();

    // Afficher les étoiles du palmarès global
    const winnerDisplay = winner.username + getUserStars(winner.userId);
    const firstLeaderDisplay = firstLeader.username + getUserStars(firstLeader.userId);
    const mostConsistentDisplay = stats.mostConsistent.username + getUserStars(stats.mostConsistent.userId);
    const biggestClimberDisplay = stats.biggestClimber.username + getUserStars(stats.biggestClimber.userId);

    container.innerHTML = `
        <div class="stats-grid">
            <div class="history-stat-card highlight">
                <div class="history-stat-icon">🏆</div>
                <div class="history-stat-title">Vainqueur Final</div>
                <div class="history-stat-value">${winnerDisplay}</div>
                <div class="history-stat-detail">${formatNumber(winner.points)} points · ${winner.corrects} bons 1N2</div>
            </div>

            <div class="history-stat-card">
                <div class="history-stat-icon">🚀</div>
                <div class="history-stat-title">Leader J1</div>
                <div class="history-stat-value">${firstLeaderDisplay}</div>
                <div class="history-stat-detail">${firstLeader.points} points</div>
            </div>

            <div class="history-stat-card">
                <div class="history-stat-icon">📊</div>
                <div class="history-stat-title">Total Journées</div>
                <div class="history-stat-value">${historyData.totalJournees}</div>
                <div class="history-stat-detail">Historique complet</div>
            </div>

            <div class="history-stat-card">
                <div class="history-stat-icon">🎯</div>
                <div class="history-stat-title">Plus Régulier</div>
                <div class="history-stat-value">${mostConsistentDisplay}</div>
                <div class="history-stat-detail">Écart-type: ${stats.mostConsistent.stdDev.toFixed(1)} places</div>
            </div>

            <div class="history-stat-card success">
                <div class="history-stat-icon">📈</div>
                <div class="history-stat-title">Meilleure Progression</div>
                <div class="history-stat-value">${biggestClimberDisplay}</div>
                <div class="history-stat-detail">+${stats.biggestClimber.climb} places (J1→Final)</div>
            </div>

            <div class="history-stat-card">
                <div class="history-stat-icon">👑</div>
                <div class="history-stat-title">Journées en Tête</div>
                <div class="history-stat-value">${stats.mostLeadJournees.username}</div>
                <div class="history-stat-detail">${stats.mostLeadJournees.count} journées en 1ère place</div>
            </div>
        </div>
    `;
}

/**
 * Calculate advanced statistics from history
 */
function calculateAdvancedStats() {
    const stats = {
        mostConsistent: null,
        biggestClimber: null,
        mostLeadJournees: null
    };

    // Track leadership count for each user
    const leadershipCount = {};
    historyData.history.forEach(journee => {
        const leader = journee.standings[0];
        leadershipCount[leader.userId] = (leadershipCount[leader.userId] || 0) + 1;
    });

    // Find user with most journées as leader
    let maxLeadCount = 0;
    let mostLeadUser = null;
    for (const [userId, count] of Object.entries(leadershipCount)) {
        if (count > maxLeadCount) {
            maxLeadCount = count;
            mostLeadUser = parseInt(userId);
        }
    }

    const mostLeadUserData = standingsData.ranking.find(u => u.userId === mostLeadUser);
    stats.mostLeadJournees = {
        userId: mostLeadUser,
        username: mostLeadUserData?.username || 'Inconnu',
        count: maxLeadCount
    };

    // Calculate consistency (standard deviation of ranks) for top 20
    let minStdDev = Infinity;
    let mostConsistentUser = null;

    standingsData.ranking.slice(0, 20).forEach(user => {
        const ranks = historyData.history.map(journee => {
            const userRank = journee.standings.find(s => s.userId === user.userId);
            return userRank ? userRank.rank : 999;
        }).filter(rank => rank !== 999);

        if (ranks.length > historyData.totalJournees * 0.8) { // At least 80% participation
            const mean = ranks.reduce((sum, r) => sum + r, 0) / ranks.length;
            const variance = ranks.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ranks.length;
            const stdDev = Math.sqrt(variance);

            if (stdDev < minStdDev) {
                minStdDev = stdDev;
                mostConsistentUser = {
                    userId: user.userId,
                    username: user.username,
                    stdDev: stdDev
                };
            }
        }
    });

    stats.mostConsistent = mostConsistentUser || { username: 'N/A', stdDev: 0, userId: 0 };

    // Find biggest climber (J1 to Final)
    const firstJournee = historyData.history[0];
    const lastJournee = historyData.history[historyData.history.length - 1];

    let maxClimb = 0;
    let biggestClimberUser = null;

    lastJournee.standings.forEach(finalUser => {
        const firstRank = firstJournee.standings.find(u => u.userId === finalUser.userId);
        if (firstRank) {
            const climb = firstRank.rank - finalUser.rank; // Positive = climbed up
            if (climb > maxClimb) {
                maxClimb = climb;
                biggestClimberUser = {
                    userId: finalUser.userId,
                    username: finalUser.username,
                    climb: climb
                };
            }
        }
    });

    stats.biggestClimber = biggestClimberUser || { username: 'N/A', climb: 0, userId: 0 };

    return stats;
}

/**
 * Update page title
 */
function updatePageTitle() {
    if (seasonMeta) {
        document.getElementById('page-title').textContent = `${seasonMeta.name} - Pronos Potes`;
    }
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
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', init);
