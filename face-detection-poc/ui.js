// UI management and event handling

// Shared state object
export const state = {
    showBoxes: true,
    showLandmarks: false,
    showExpressions: false,
    showConfidence: false,
    videoReady: false,
    modelsLoaded: false
};

// Configuration for toggle controls
const toggleConfig = [
    { id: 'showBoxes', label: 'Show Bounding Boxes', default: true },
    { id: 'showLandmarks', label: 'Show Facial Landmarks', default: false },
    { id: 'showExpressions', label: 'Show Expressions', default: false },
    { id: 'showConfidence', label: 'Show Confidence Scores', default: false }
];

// Event log element
let eventLogElement = null;
let faceCountElement = null;
let fpsElement = null;

// FPS calculation
let frameCount = 0;
let lastFpsUpdate = Date.now();

/**
 * Initialize UI components
 * @param {HTMLElement} togglesContainer - Container for toggle controls
 * @param {HTMLElement} logContainer - Container for event log
 * @param {HTMLElement} faceCountContainer - Container for face count display
 * @param {HTMLElement} fpsContainer - Container for FPS display
 */
export function initializeUI(togglesContainer, logContainer, faceCountContainer, fpsContainer) {
    eventLogElement = logContainer;
    faceCountElement = faceCountContainer;
    fpsElement = fpsContainer;

    // Generate toggle controls
    generateToggles(togglesContainer);

    logEvent('info', 'UI initialized');
}

/**
 * Generate toggle checkboxes from configuration
 * @param {HTMLElement} container - Container element for toggles
 */
function generateToggles(container) {
    container.innerHTML = '';

    toggleConfig.forEach(config => {
        const toggleItem = document.createElement('div');
        toggleItem.className = 'toggle-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = config.id;
        checkbox.checked = config.default;
        checkbox.addEventListener('change', () => handleToggleChange(config.id, checkbox.checked));

        const label = document.createElement('label');
        label.htmlFor = config.id;
        label.textContent = config.label;

        toggleItem.appendChild(checkbox);
        toggleItem.appendChild(label);
        container.appendChild(toggleItem);

        // Initialize state
        state[config.id] = config.default;
    });
}

/**
 * Handle toggle change events
 * @param {string} toggleId - ID of the changed toggle
 * @param {boolean} isChecked - New checked state
 */
function handleToggleChange(toggleId, isChecked) {
    state[toggleId] = isChecked;
    logEvent('info', `${toggleId} ${isChecked ? 'enabled' : 'disabled'}`);
}

/**
 * Log an event with timestamp
 * @param {string} type - Event type (info, warning, error, success)
 * @param {string} message - Event message
 */
export function logEvent(type, message) {
    if (!eventLogElement) return;

    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'log-timestamp';
    timestampSpan.textContent = `[${timestamp}]`;

    const messageSpan = document.createElement('span');
    messageSpan.className = `log-${type}`;
    messageSpan.textContent = message;

    entry.appendChild(timestampSpan);
    entry.appendChild(messageSpan);

    eventLogElement.appendChild(entry);

    // Auto-scroll to bottom
    eventLogElement.scrollTop = eventLogElement.scrollHeight;
}

/**
 * Update face count display
 * @param {number} count - Number of faces detected
 */
export function updateFaceCount(count) {
    if (faceCountElement) {
        faceCountElement.textContent = count.toString();
    }
}

/**
 * Update FPS display
 */
export function updateFPS() {
    if (!fpsElement) return;

    frameCount++;
    const now = Date.now();
    const elapsed = now - lastFpsUpdate;

    if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        fpsElement.textContent = fps.toString();
        frameCount = 0;
        lastFpsUpdate = now;
    }
}

/**
 * Show loading overlay with message
 * @param {string} message - Loading message to display
 */
export function showLoading(message) {
    const loadingOverlay = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    if (loadingOverlay && loadingMessage) {
        loadingMessage.textContent = message;
        loadingOverlay.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

/**
 * Show error overlay with message
 * @param {string} message - Error message to display
 */
export function showError(message) {
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');
    if (errorOverlay && errorMessage) {
        errorMessage.textContent = message;
        errorOverlay.classList.remove('hidden');
    }
}

/**
 * Hide error overlay
 */
export function hideError() {
    const errorOverlay = document.getElementById('error-overlay');
    if (errorOverlay) {
        errorOverlay.classList.add('hidden');
    }
}

/**
 * Get current state object (read-only)
 * @returns {Object} Current state
 */
export function getState() {
    return { ...state };
}
