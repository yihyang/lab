// Face detection logic using face-api.js

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';

/**
 * Load all required face detection models
 * @param {Function} progressCallback - Callback for loading progress
 * @returns {Promise<void>}
 */
export async function loadModels(progressCallback) {
    const models = [
        { name: 'Tiny Face Detector', file: 'tiny_face_detector_model-weights_manifest.json' },
        { name: 'Face Landmark 68 Net', file: 'face_landmark_68_model-weights_manifest.json' },
        { name: 'Face Expression Net', file: 'face_expression_model-weights_manifest.json' }
    ];

    for (const model of models) {
        try {
            progressCallback(`Loading ${model.name}...`);
            await loadModel(model.name);
            progressCallback(`${model.name} loaded successfully`);
        } catch (error) {
            throw new Error(`Failed to load ${model.name}: ${error.message}`);
        }
    }
}

/**
 * Load a specific model
 * @param {string} modelName - Name of the model to load
 * @returns {Promise<void>}
 */
async function loadModel(modelName) {
    switch (modelName) {
        case 'Tiny Face Detector':
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            break;
        case 'Face Landmark 68 Net':
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            break;
        case 'Face Expression Net':
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            break;
        default:
            throw new Error(`Unknown model: ${modelName}`);
    }
}

/**
 * Detect faces in a video element
 * @param {HTMLVideoElement} videoElement - The video element to analyze
 * @returns {Promise<Array>} Array of face detection results
 */
export async function detectFaces(videoElement) {
    if (!videoElement || videoElement.paused || videoElement.ended) {
        return [];
    }

    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5
    });

    try {
        const detections = await faceapi
            .detectAllFaces(videoElement, detectionOptions)
            .withFaceLandmarks()
            .withFaceExpressions();

        return detections.map(detection => ({
            box: detection.detection.box,
            landmarks: detection.landmarks,
            expressions: detection.expressions,
            confidence: detection.detection.score
        }));
    } catch (error) {
        console.error('Face detection error:', error);
        return [];
    }
}

/**
 * Get the dominant expression from face expressions
 * @param {Object} expressions - Face expression object from face-api
 * @returns {Object} Object with expression name and confidence
 */
export function getDominantExpression(expressions) {
    if (!expressions) return { expression: 'unknown', confidence: 0 };

    const expressionEntries = Object.entries(expressions);
    const [expression, confidence] = expressionEntries.reduce((max, current) =>
        current[1] > max[1] ? current : max
    );

    return { expression, confidence };
}
