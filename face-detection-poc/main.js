// Main application bootstrap

import { loadModels, detectFaces, getDominantExpression } from './face-detection.js';
import { initializeUI, logEvent, updateFaceCount, updateFPS, showLoading, hideLoading, showError, hideError, getState } from './ui.js';
import { render, setupCanvasSize } from './renderer.js';

// DOM elements
let video, canvas, ctx;
let animationId = null;
let previousFaceCount = 0;

/**
 * Initialize the application
 */
async function init() {
    // Get DOM elements
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    const togglesContainer = document.getElementById('toggles');
    const eventLogContainer = document.getElementById('event-log');
    const faceCountContainer = document.getElementById('face-count');
    const fpsContainer = document.getElementById('fps-counter');
    const retryButton = document.getElementById('retry-button');

    // Initialize UI
    initializeUI(togglesContainer, eventLogContainer, faceCountContainer, fpsContainer);

    // Setup retry button handler
    retryButton.addEventListener('click', handleRetry);

    // Start application flow
    try {
        await loadModelsAndStartCamera();
    } catch (error) {
        handleError(error);
    }
}

/**
 * Load face detection models and start camera
 */
async function loadModelsAndStartCamera() {
    // Load models
    showLoading('Loading face detection models...');
    logEvent('info', 'Starting to load face detection models...');

    try {
        await loadModels((message) => {
            showLoading(message);
            logEvent('info', message);
        });

        logEvent('success', 'All face detection models loaded successfully');
        hideLoading();

        // Request camera access
        showLoading('Requesting camera access...');
        logEvent('info', 'Requesting camera permission...');

        await setupCamera();

        logEvent('success', 'Camera initialized successfully');
        hideLoading();

        // Start detection loop
        startDetectionLoop();

    } catch (error) {
        hideLoading();
        throw error;
    }
}

/**
 * Setup camera stream
 */
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        });

        video.srcObject = stream;

        return new Promise((resolve, reject) => {
            let resolved = false;

            const onReady = () => {
                if (resolved) return;
                resolved = true;

                video.play();
                setupCanvasSize(canvas, video);
                logEvent('success', `Video stream initialized: ${video.videoWidth}x${video.videoHeight}`);
                resolve();
            };

            // Listen for multiple possible events
            video.addEventListener('loadeddata', onReady, { once: true });
            video.addEventListener('loadedmetadata', onReady, { once: true });

            video.onerror = () => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Video stream error'));
                }
            };

            // Also check if video is already ready
            if (video.readyState >= 2) {
                onReady();
            }

            // Timeout if video doesn't load
            setTimeout(() => {
                if (!resolved && video.readyState < 2) {
                    resolved = true;
                    reject(new Error('Camera initialization timeout'));
                }
            }, 10000);
        });

    } catch (error) {
        if (error.name === 'NotAllowedError') {
            throw new Error('Camera permission denied. Please allow camera access and retry.');
        } else if (error.name === 'NotFoundError') {
            throw new Error('No camera detected. Please connect a camera and retry.');
        } else if (error.name === 'NotReadableError') {
            throw new Error('Camera is already in use by another application.');
        } else {
            throw new Error(`Camera setup failed: ${error.message}`);
        }
    }
}

/**
 * Start the face detection loop
 */
function startDetectionLoop() {
    logEvent('info', 'Starting face detection loop');
    detectAndDraw();
}

/**
 * Detect faces and draw visualizations
 */
async function detectAndDraw() {
    const state = getState();

    // Detect faces
    const faces = await detectFaces(video);

    // Update face count display
    const currentFaceCount = faces.length;

    // Log face count changes
    if (currentFaceCount !== previousFaceCount) {
        if (currentFaceCount > previousFaceCount) {
            logEvent('success', `Face detected - Total: ${currentFaceCount}`);
        } else {
            logEvent('info', `Face lost - Total: ${currentFaceCount}`);
        }
        previousFaceCount = currentFaceCount;
    }

    updateFaceCount(currentFaceCount);

    // Render visualizations
    render(ctx, faces, state);

    // Update FPS
    updateFPS();

    // Request next frame
    animationId = requestAnimationFrame(detectAndDraw);
}

/**
 * Handle retry button click
 */
async function handleRetry() {
    hideError();
    logEvent('info', 'Retrying initialization...');

    try {
        await loadModelsAndStartCamera();
    } catch (error) {
        handleError(error);
    }
}

/**
 * Handle application errors
 * @param {Error} error - Error object
 */
function handleError(error) {
    console.error('Application error:', error);
    logEvent('error', error.message);

    let errorMessage = error.message;

    // Provide user-friendly error messages
    if (error.message.includes('Camera permission denied')) {
        errorMessage = 'Camera access was denied. Please allow camera permission in your browser settings and click Retry.';
    } else if (error.message.includes('No camera detected')) {
        errorMessage = 'No camera was found on your device. Please connect a webcam and click Retry.';
    } else if (error.message.includes('already in use')) {
        errorMessage = 'Your camera is being used by another application. Please close other apps using the camera and click Retry.';
    } else if (error.message.includes('Failed to load')) {
        errorMessage = 'Failed to load face detection models. Please check your internet connection and click Retry.';
    } else if (error.message.includes('timeout')) {
        errorMessage = 'Operation timed out. Please check your camera connection and click Retry.';
    }

    showError(errorMessage);
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
    const isCompatible = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.requestAnimationFrame
    );

    if (!isCompatible) {
        const incompatibleMessage = 'Your browser is not compatible with this application. ' +
            'Please use a modern browser like Chrome, Firefox, Safari, or Edge.';
        showError(incompatibleMessage);
        logEvent('error', 'Browser compatibility check failed');
        return false;
    }

    return true;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (checkBrowserCompatibility()) {
            init();
        }
    });
} else {
    if (checkBrowserCompatibility()) {
        init();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }
});
