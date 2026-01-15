// ============================================
// GitHub User Explorer - Main JavaScript
// ============================================

// DOM Elements
const usernameInput = document.getElementById('usernameInput');
const searchBtn = document.getElementById('searchBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const userProfile = document.getElementById('userProfile');
const repositoriesSection = document.getElementById('repositoriesSection');
const repositoriesContainer = document.getElementById('repositoriesContainer');
const welcomeSection = document.getElementById('welcomeSection');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// ============================================
// Theme Toggle Functionality
// ============================================
function initTheme() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Initialize theme on page load
initTheme();
themeToggle.addEventListener('click', toggleTheme);

// ============================================
// Utility Functions
// ============================================
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    userProfile.classList.add('hidden');
    repositoriesSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    welcomeSection.classList.add('hidden');
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    userProfile.classList.add('hidden');
    repositoriesSection.classList.add('hidden');
    welcomeSection.classList.add('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// ============================================
// API Functions
// ============================================
/**
 * Fetches user data from GitHub API
 * @param {string} username - GitHub username
 * @returns {Promise<Object>} User data object
 */
async function fetchUserData(username) {
    const response = await fetch(`https://api.github.com/users/${username}`);
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Fetches repositories for a GitHub user
 * @param {string} username - GitHub username
 * @returns {Promise<Array>} Array of repository objects
 */
async function fetchUserRepositories(username) {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&order=desc`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.status}`);
    }
    
    return await response.json();
}

// ============================================
// Display Functions
// ============================================
/**
 * Displays user profile information
 * @param {Object} userData - User data from GitHub API
 */
function displayUserProfile(userData) {
    // Set avatar
    document.getElementById('avatar').src = userData.avatar_url || '';
    document.getElementById('avatar').alt = `${userData.login}'s avatar`;
    
    // Set username
    document.getElementById('username').textContent = userData.login || 'N/A';
    
    // Set full name (if available)
    const fullNameEl = document.getElementById('fullName');
    if (userData.name) {
        fullNameEl.textContent = userData.name;
        fullNameEl.classList.remove('hidden');
    } else {
        fullNameEl.textContent = '';
        fullNameEl.classList.add('hidden');
    }
    
    // Set bio (if available)
    const bioEl = document.getElementById('bio');
    if (userData.bio) {
        bioEl.textContent = userData.bio;
        bioEl.classList.remove('hidden');
    } else {
        bioEl.textContent = '';
        bioEl.classList.add('hidden');
    }
    
    // Set location (if available)
    const locationEl = document.getElementById('location');
    if (userData.location) {
        locationEl.textContent = userData.location;
        locationEl.classList.remove('hidden');
    } else {
        locationEl.textContent = '';
        locationEl.classList.add('hidden');
    }
    
    // Set followers and following counts
    document.getElementById('followers').textContent = userData.followers || 0;
    document.getElementById('following').textContent = userData.following || 0;
    
    // Set GitHub profile link
    const githubLink = document.getElementById('githubLink');
    githubLink.href = userData.html_url || '#';
    
    // Hide welcome section and show profile section
    welcomeSection.classList.add('hidden');
    userProfile.classList.remove('hidden');
}

/**
 * Displays repositories in cards
 * @param {Array} repositories - Array of repository objects
 */
function displayRepositories(repositories) {
    // Clear previous repositories
    repositoriesContainer.innerHTML = '';
    
    if (!repositories || repositories.length === 0) {
        repositoriesContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No public repositories found.</p>';
        repositoriesSection.classList.remove('hidden');
        return;
    }
    
    // Sort repositories by stars (highest first) - bonus feature
    const sortedRepos = [...repositories].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
    
    // Create repository cards
    sortedRepos.forEach(repo => {
        const repoCard = document.createElement('a');
        repoCard.href = repo.html_url;
        repoCard.target = '_blank';
        repoCard.rel = 'noopener noreferrer';
        repoCard.className = 'repo-card';
        
        repoCard.innerHTML = `
            <h3 class="repo-name">${escapeHtml(repo.name)}</h3>
            <p class="repo-description">${repo.description ? escapeHtml(repo.description) : '<em>No description</em>'}</p>
            <div class="repo-stars">${repo.stargazers_count || 0}</div>
        `;
        
        repositoriesContainer.appendChild(repoCard);
    });
    
    // Show repositories section
    repositoriesSection.classList.remove('hidden');
}

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Search Functionality
// ============================================
/**
 * Handles the search operation
 */
async function handleSearch() {
    const username = usernameInput.value.trim();
    
    // Validate input
    if (!username) {
        alert('Please enter a GitHub username');
        usernameInput.focus();
        return;
    }
    
    try {
        // Show loading indicator
        showLoading();
        hideError();
        
        // Fetch user data and repositories in parallel
        const [userData, repositories] = await Promise.all([
            fetchUserData(username),
            fetchUserRepositories(username)
        ]);
        
        // Hide loading indicator
        hideLoading();
        
        // Display results
        displayUserProfile(userData);
        displayRepositories(repositories);
        
    } catch (error) {
        // Hide loading indicator
        hideLoading();
        
        // Show error message
        if (error.message === 'User not found') {
            showError('User not found');
        } else {
            showError(`Error: ${error.message}`);
        }
        
        console.error('Search error:', error);
    }
}

// ============================================
// Event Listeners
// ============================================
// Search button click
searchBtn.addEventListener('click', handleSearch);

// Enter key press in input field
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Focus input on page load
window.addEventListener('load', () => {
    usernameInput.focus();
});

