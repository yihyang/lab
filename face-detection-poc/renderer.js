// Canvas rendering functions

// Color palette for face boxes
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#FF6F61'
];

/**
 * Clear canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 */
export function clearCanvas(ctx) {
    if (!ctx) return;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw bounding boxes around detected faces
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} faces - Array of face detection results
 */
export function drawBoxes(ctx, faces) {
    if (!ctx || !faces || faces.length === 0) return;

    faces.forEach((face, index) => {
        const { box } = face;
        const color = colors[index % colors.length];

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw corner markers
        const markerSize = 10;
        ctx.fillStyle = color;

        // Top-left
        ctx.fillRect(box.x - 2, box.y - 2, markerSize, 4);
        ctx.fillRect(box.x - 2, box.y - 2, 4, markerSize);

        // Top-right
        ctx.fillRect(box.x + box.width - markerSize + 2, box.y - 2, markerSize, 4);
        ctx.fillRect(box.x + box.width - 2, box.y - 2, 4, markerSize);

        // Bottom-left
        ctx.fillRect(box.x - 2, box.y + box.height - 2, markerSize, 4);
        ctx.fillRect(box.x - 2, box.y + box.height - markerSize + 2, 4, markerSize);

        // Bottom-right
        ctx.fillRect(box.x + box.width - markerSize + 2, box.y + box.height - 2, markerSize, 4);
        ctx.fillRect(box.x + box.width - 2, box.y + box.height - markerSize + 2, 4, markerSize);
    });
}

/**
 * Draw facial landmarks
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} faces - Array of face detection results
 */
export function drawLandmarks(ctx, faces) {
    if (!ctx || !faces || faces.length === 0) return;

    faces.forEach((face, index) => {
        const { landmarks } = face;
        const color = colors[index % colors.length];

        if (landmarks && landmarks.positions) {
            ctx.fillStyle = color;

            landmarks.positions.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    });
}

/**
 * Draw face expressions
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} faces - Array of face detection results
 */
export function drawExpressions(ctx, faces) {
    if (!ctx || !faces || faces.length === 0) return;

    faces.forEach((face, index) => {
        const { box, expressions } = face;

        if (expressions) {
            // Get dominant expression
            const expressionEntries = Object.entries(expressions);
            const [expression, confidence] = expressionEntries.reduce((max, current) =>
                current[1] > max[1] ? current : max
            );

            // Format expression name
            const formattedExpression = expression.replace(/([A-Z])/g, ' $1').trim();
            const confidencePercent = Math.round(confidence * 100);

            // Draw background
            const text = `${formattedExpression}: ${confidencePercent}%`;
            ctx.font = 'bold 16px Arial';
            const textMetrics = ctx.measureText(text);
            const padding = 8;
            const bgX = box.x;
            const bgY = box.y - 30;
            const bgWidth = textMetrics.width + padding * 2;
            const bgHeight = 24;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

            // Draw text
            ctx.fillStyle = '#fff';
            ctx.fillText(text, bgX + padding, bgY + 17);
        }
    });
}

/**
 * Draw confidence scores
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} faces - Array of face detection results
 */
export function drawConfidence(ctx, faces) {
    if (!ctx || !faces || faces.length === 0) return;

    faces.forEach((face, index) => {
        const { box, confidence } = face;
        const color = colors[index % colors.length];

        const confidencePercent = Math.round(confidence * 100);
        const text = `Confidence: ${confidencePercent}%`;

        ctx.font = 'bold 14px Arial';
        const textMetrics = ctx.measureText(text);
        const padding = 6;
        const bgX = box.x;
        const bgY = box.y + box.height + 10;
        const bgWidth = textMetrics.width + padding * 2;
        const bgHeight = 20;

        // Draw background
        ctx.fillStyle = color + 'CC'; // Add transparency
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

        // Draw text
        ctx.fillStyle = '#fff';
        ctx.fillText(text, bgX + padding, bgY + 15);
    });
}

/**
 * Render all enabled visualizations
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} faces - Array of face detection results
 * @param {Object} state - Current UI state
 */
export function render(ctx, faces, state) {
    if (!ctx) return;

    clearCanvas(ctx);

    if (faces && faces.length > 0) {
        if (state.showBoxes) {
            drawBoxes(ctx, faces);
        }

        if (state.showLandmarks) {
            drawLandmarks(ctx, faces);
        }

        if (state.showExpressions) {
            drawExpressions(ctx, faces);
        }

        if (state.showConfidence) {
            drawConfidence(ctx, faces);
        }
    }
}

/**
 * Setup canvas size to match video
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {HTMLVideoElement} video - Video element
 */
export function setupCanvasSize(canvas, video) {
    if (canvas && video) {
        canvas.width = video.videoWidth || video.clientWidth;
        canvas.height = video.videoHeight || video.clientHeight;
    }
}
