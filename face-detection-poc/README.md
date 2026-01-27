# Face Detection POC

A browser-based face scanner with toggleable visualization options for learning face detection APIs. Built with vanilla JavaScript and face-api.js (TensorFlow.js wrapper).

## Features

- **Real-time face detection** using your webcam
- **Toggleable visualizations:**
  - Face bounding boxes with color-coded tracking
  - 68 facial landmark points (eyes, nose, mouth, jaw)
  - Face expression/emotion detection with confidence
  - Detection confidence scores
- **Live event logging** with timestamps
- **Performance monitoring** (FPS counter, face count)
- **Docker-based development** environment

## Tech Stack

- **Vite** - Fast development server and build tooling
- **Vanilla JavaScript** - No framework, direct API interaction
- **face-api.js** - TensorFlow.js wrapper for in-browser face detection
- **Docker Compose** - Containerized development environment

## Prerequisites

- **Docker** and **Docker Compose** installed
- A webcam or camera connected to your device
- Modern browser (Chrome, Firefox, Safari, or Edge)

## Quick Start

### Using Docker (Recommended)

1. **Start the application:**
   ```bash
   docker compose up
   ```

2. **Open your browser:**
   Navigate to [http://localhost:5173](http://localhost:5173)

3. **Allow camera access** when prompted

4. **Start experimenting!** Toggle visualizations on/off using the control panel

### Local Development

If you prefer to run without Docker:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** to the URL shown in the terminal

## Project Structure

```
face-detection-poc/
├── index.html              # HTML structure with video, canvas, controls
├── main.js                 # Entry point - camera setup and initialization
├── face-detection.js       # Core detection logic (load models, detect faces)
├── ui.js                   # Toggle controls, event handlers, event logging
├── renderer.js             # Canvas drawing functions (boxes, landmarks, etc.)
├── styles.css              # Layout, positioning, responsive design
├── Dockerfile              # Container definition (node:alpine)
├── docker-compose.yml      # Dev orchestration (volumes, ports)
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## How It Works

### 1. Model Loading
The application loads three pre-trained TensorFlow.js models from a CDN:
- **Tiny Face Detector** - Fast face detection (lower accuracy, better performance)
- **Face Landmark 68 Net** - Detects 68 facial landmark points
- **Face Expression Net** - Classifies facial expressions (emotions)

### 2. Camera Access
Uses the MediaDevices API (`navigator.mediaDevices.getUserMedia`) to access your webcam and stream video to a `<video>` element.

### 3. Detection Loop
The application runs a continuous loop using `requestAnimationFrame`:
1. Capture current frame from video
2. Run face detection on the frame
3. Extract face data (boxes, landmarks, expressions, confidence)
4. Draw enabled visualizations on canvas overlay
5. Update UI (face count, FPS, event log)
6. Request next frame

### 4. Canvas Rendering
A transparent `<canvas>` element is positioned directly over the `<video>` element. The canvas displays:
- Colored bounding boxes around detected faces
- Small dots at each of the 68 landmark positions
- Expression labels with confidence percentages
- Confidence scores for each detection

### 5. State Management
A simple state object tracks which visualizations are enabled. Checkboxes update this state, and the renderer checks the state before drawing each visualization type.

## Key Learnings

### Browser APIs
- **MediaDevices API** (`getUserMedia`) - Access camera/microphone
- **Canvas API** - Draw graphics over video
- **requestAnimationFrame** - Create smooth animation loops

### Face Detection Concepts
- **Bounding boxes** - Rectangular regions around detected objects
- **Facial landmarks** - Specific points of interest on a face (68 total)
- **Expression classification** - Machine learning model that classifies emotions (happy, sad, angry, etc.)
- **Confidence scores** - Probability (0-1) that a detection is correct

### Performance Optimization
- **Tiny Face Detector** - Faster but less accurate than SSD Mobilenet
- **Canvas clearing** - Must clear canvas each frame before redrawing
- **Async detection** - Face detection is async, so we use `await` in the loop
- **FPS monitoring** - Track performance to avoid UI freezing

### Error Handling
- Camera permission denial (user denied access)
- No camera detected (no hardware)
- Camera already in use (another app has it)
- Model loading failures (network issues)
- Browser incompatibility (old browsers)
- Initialization timeouts (hardware issues)

## Troubleshooting

### Camera not working
- **Check permissions:** Ensure you've allowed camera access in your browser
- **Check other apps:** Close other applications using your camera (Zoom, Teams, etc.)
- **Check hardware:** Verify your camera is connected and working
- **Try a different browser:** Some browsers have stricter camera permissions

### Models not loading
- **Check internet connection:** Models are loaded from a CDN
- **Check browser console:** Look for specific error messages
- **Try refreshing:** Sometimes CDN requests fail temporarily

### Poor performance
- **Close other tabs:** Browser resources are shared across tabs
- **Disable some visualizations:** Turn off landmarks and expressions
- **Use a smaller browser window:** Reduces rendering load
- **Check system resources:** Ensure your CPU isn't maxed out

### Docker issues
- **Port already in use:** Another service is using port 5173
  ```bash
  # Find and kill the process
  lsof -ti:5173 | xargs kill -9
  ```
- **Permission issues:** Ensure Docker has proper permissions
- **Rebuild container:**
  ```bash
  docker compose down
  docker compose build --no-cache
  docker compose up
  ```

## Future Enhancements

- [ ] Add age and gender detection
- [ ] Implement face recognition (identify specific people)
- [ ] Add video/image recording capabilities
- [ ] Create performance mode toggle (quality vs speed)
- [ ] Support multiple camera sources
- [ ] Add export/save functionality for detections
- [ ] Implement hand pose detection
- [ ] Add body pose estimation

## License

ISC

## Resources

- [face-api.js Documentation](https://github.com/justadudewhohacks/face-api.js)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [MediaDevices API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [Canvas API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
