/**
 * Utility functions for Pronos Potes
 */

// Configuration
const DATA_BASE_PATH = '../data';

/**
 * Fetch JSON data with error handling
 */
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching JSON:', url, error);
        throw error;
    }
}

/**
 * Format date to French locale
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format date to short format
 */
function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Get competition icon (official logo from Wikipedia)
 */
function getCompetitionIcon(competitionId) {
    const icons = {
        'ligue1': '<img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Logo_Ligue_1_McDonald%27s_2024.svg" alt="Ligue 1" class="competition-logo">',
        'ldc': '<img src="https://upload.wikimedia.org/wikipedia/fr/2/24/Logo_Champions_League_2021.svg" alt="Ligue des Champions" class="competition-logo">',
        'ligaeuropa': '<img src="https://upload.wikimedia.org/wikipedia/fr/d/d9/Uel_logotype_fc_light.svg" alt="Liga Europa" class="competition-logo">',
        'top14': '<img src="https://upload.wikimedia.org/wikipedia/en/d/dd/Logo_Top14_2012.png" alt="TOP 14" class="competition-logo">',
        'international': '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/International_Flag_of_Planet_Earth.svg" alt="International" class="competition-logo">'
    };
    return icons[competitionId] || '🏅';
}

/**
 * Get competition color
 */
function getCompetitionColor(competitionId) {
    const colors = {
        'ligue1': '#2563eb',
        'ldc': '#7c3aed',
        'ligaeuropa': '#059669',
        'top14': '#dc2626',
        'international': '#ea580c'
    };
    return colors[competitionId] || '#6b7280';
}

/**
 * Get competition type label
 */
function getCompetitionType(type) {
    const types = {
        'football': 'Football',
        'rugby': 'Rugby',
        'multi': 'Multi-sports'
    };
    return types[type] || type;
}

/**
 * Format large numbers with thousands separator
 */
function formatNumber(num) {
    return num.toLocaleString('fr-FR');
}

/**
 * Calculate success rate percentage
 */
function calculateSuccessRate(corrects, total) {
    if (total === 0) return '0.0';
    return ((corrects / total) * 100).toFixed(1);
}

/**
 * Get rank emoji/medal
 */
function getRankEmoji(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
}

/**
 * Get status badge class
 */
function getStatusClass(status) {
    const classes = {
        'ongoing': 'status-ongoing',
        'finished': 'status-finished',
        'upcoming': 'status-upcoming'
    };
    return classes[status] || 'status-default';
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
 * Pad journée number with leading zero
 */
function padJournee(num) {
    return String(num).padStart(2, '0');
}

/**
 * Show error message
 */
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error">
                <p>⚠️ ${message}</p>
            </div>
        `;
        container.classList.remove('loading');
    }
}

/**
 * Show loading state
 */
function showLoading(containerId, message = 'Chargement...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="loader">${message}</div>`;
        container.classList.add('loading');
    }
}

/**
 * Get URL parameters
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        competition: params.get('competition'),
        season: params.get('season'),
        journee: params.get('journee'),
        userId: params.get('user')
    };
}

/**
 * Build URL with parameters
 */
function buildUrl(page, params) {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
        if (params[key]) {
            searchParams.set(key, params[key]);
        }
    });
    const queryString = searchParams.toString();
    return queryString ? `${page}?${queryString}` : page;
}

/**
 * Debounce function for search/filter
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Local storage helpers with expiry
 */
const storage = {
    set: (key, value, expiryMinutes = 60) => {
        const item = {
            value: value,
            expiry: Date.now() + (expiryMinutes * 60 * 1000)
        };
        try {
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            // QuotaExceededError - Storage is full
            if (e.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, cleaning old cache...');
                storage.cleanOldCache();
                // Try again after cleaning
                try {
                    localStorage.setItem(key, JSON.stringify(item));
                } catch (e2) {
                    // Still failed, clear everything and try once more
                    console.warn('Still exceeded, clearing all cache...');
                    storage.clear();
                    try {
                        localStorage.setItem(key, JSON.stringify(item));
                    } catch (e3) {
                        // Give up - item is too large or localStorage disabled
                        console.error('Cannot save to localStorage:', e3);
                    }
                }
            } else {
                console.error('Error saving to localStorage:', e);
            }
        }
    },

    get: (key) => {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        try {
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value;
        } catch {
            return null;
        }
    },

    remove: (key) => {
        localStorage.removeItem(key);
    },

    clear: () => {
        localStorage.clear();
    },

    // Clean cache entries older than 1 hour
    cleanOldCache: () => {
        const now = Date.now();
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_')) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    // Remove if expired or older than 1 hour
                    if (!item.expiry || now > item.expiry || (now - (item.expiry - 60 * 60 * 1000)) > 60 * 60 * 1000) {
                        keysToRemove.push(key);
                    }
                } catch {
                    // Invalid JSON, remove it
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleaned ${keysToRemove.length} old cache entries`);
    }
};

/**
 * Fetch with cache
 * Add version parameter to force cache refresh when data changes
 */
async function fetchWithCache(url, cacheMinutes = 60) {
    const DATA_VERSION = '4.0'; // Increment this to bust cache
    const cacheKey = `cache_v${DATA_VERSION}_${url}`;
    const cached = storage.get(cacheKey);

    if (cached) {
        return cached;
    }

    // Add cache busting parameter to URL
    const urlWithVersion = url.includes('?') ? `${url}&v=${DATA_VERSION}` : `${url}?v=${DATA_VERSION}`;
    const data = await fetchJSON(urlWithVersion);
    storage.set(cacheKey, data, cacheMinutes);
    return data;
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
