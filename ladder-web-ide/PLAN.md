# Ladder Web IDE - Web-Based Ladder Logic Editor with Multi-Vendor Export

## Project Overview

A web-based ladder logic diagramming tool (similar to draw.io) specialized for PLC programming that can export to multiple vendor formats (Siemens, Rockwell, Mitsubishi, CODESYS, etc.).

**Core Value Proposition**: Draw once → Export to any PLC vendor format

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React 18 + TypeScript |
| **Diagram Library** | React Flow |
| **State Management** | Zustand (lightweight) |
| **Styling** | Tailwind CSS |
| **Build Tool** | Vite |
| **Hosting** | Static (Vercel/Netlify) - FREE |
| **License** | Apache 2.0 (our code) |

### Why React Flow?
- Fastest to MVP (1-2 weeks vs 3-4 weeks for alternatives)
- Excellent documentation and community
- First-class TypeScript support
- Built-in: drag/drop, zoom/pan, selection, minimap, controls
- MIT license (simple compliance)

---

## Docker Compose for Local Development

Docker Compose provides a consistent development environment for local testing and development.

### Services

| Service | Description | Port |
|---------|-------------|------|
| **app** | Vite development server with hot reload | 5173 |
| **preview** | Production build preview server | 4173 |

### Docker Files

#### `Dockerfile.dev` (Development)
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start development server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host"]
```

#### `Dockerfile.prod` (Production Build)
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### `docker-compose.yml`
```yaml
services:
  # Development server with hot reload
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      # Mount source code for hot reload
      - ./src:/app/src:delegated
      - ./public:/app/public:delegated
      - ./index.html:/app/index.html:delegated
      # Prevent overwriting node_modules
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev -- --host

  # Production preview server
  preview:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "4173:80"
    profiles:
      - preview

  # Optional: Run tests in container
  test:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - ./src:/app/src:delegated
      - /app/node_modules
    command: npm run test
    profiles:
      - test
```

#### `nginx.conf` (for production preview)
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

### Usage Commands

```bash
# Start development server
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down

# Rebuild after dependency changes
docker compose build --no-cache

# Run production preview
docker compose --profile preview up preview

# Run tests
docker compose --profile test up test
```

### Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                 Docker Development Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. docker compose up                                       │
│     ↓                                                       │
│  2. Open http://localhost:5173                              │
│     ↓                                                       │
│  3. Edit files in ./src (mounted volume)                   │
│     ↓                                                       │
│  4. Vite hot-reloads changes automatically                 │
│     ↓                                                       │
│  5. See updates in browser instantly                       │
│                                                             │
│  For production preview:                                    │
│  docker compose --profile preview up preview               │
│  Open http://localhost:4173                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Browser)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   React     │  │   Zustand   │  │     React Flow      │ │
│  │   Components│  │   (State)   │  │     (Canvas)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Internal Schema (JSON)                    │
│  { rungs: [{ elements: [{ type, var, ... }] }] }            │
├─────────────────────────────────────────────────────────────┤
│                     Compiler Backend                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Siemens  │ │ Rockwell │ │Mitsubishi│ │ CODESYS  │       │
│  │ Exporter │ │ Exporter │ │ Exporter │ │ Exporter │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Features (MVP)

### Phase 1: Visual Editor (Week 1-2)
- [ ] Project setup (Vite + React + TypeScript + React Flow)
- [ ] Canvas with power rails (left/right vertical lines)
- [ ] Rung layout (horizontal lines between rails)
- [ ] Custom node types:
  - Contact (NO): `─┤ ─`
  - Contact (NC): `─┤/─`
  - Coil (output): `─( )─`
  - Coil (set): `─(S)─`
  - Coil (reset): `─(R)─`
- [ ] Component palette (drag to add)
- [ ] Variable naming (X0, Y0, M0, etc.)
- [ ] Connect/disconnect elements
- [ ] Delete elements
- [ ] **Save/Load functionality:**
  - [ ] Save to JSON file (download `project.ladder.json`)
  - [ ] Open from JSON file (file picker)
  - [ ] Auto-save to localStorage (backup, survives refresh)
  - [ ] Recent files list (last 10 projects)
  - [ ] New project / Clear canvas

### Phase 2: Extended Components (Week 3)
- [ ] Timer (TON, TOF, TP)
- [ ] Counter (CTU, CTD)
- [ ] Branch (parallel paths)
- [ ] Undo/Redo
- [ ] Keyboard shortcuts
- [ ] Grid snap

### Phase 3: Compiler (Week 4-5)
- [ ] Define internal JSON schema
- [ ] Siemens STL exporter (first vendor)
- [ ] Export dialog with vendor selection
- [ ] Download generated file

### Phase 4: Polish (Week 6)
- [ ] UI polish
- [ ] Error validation (invalid connections, missing vars)
- [ ] Documentation
- [ ] Deploy to Vercel

---

## Ladder Logic Elements to Support

### Basic Elements (Phase 1)
| Element | Symbol | Description |
|---------|--------|-------------|
| NO Contact | `─┤ ─` | Normally Open |
| NC Contact | `─┤/─` | Normally Closed |
| Output Coil | `─( )─` | Output |
| Set Coil | `─(S)─` | Set (latch) |
| Reset Coil | `─(R)─` | Reset (unlatch) |

### Extended Elements (Phase 2)
| Element | Description |
|---------|-------------|
| TON | Timer On-Delay |
| TOF | Timer Off-Delay |
| TP | Timer Pulse |
| CTU | Count Up |
| CTD | Count Down |
| Branch | Parallel connection |

---

## Save/Load Functionality

### Overview
Users can save their ladder diagrams to files and open them later. This is essential for:
- Persisting work across sessions
- Sharing diagrams with colleagues
- Version control (commit .ladder.json files to git)
- Backup and portability

### Implementation

```
┌─────────────────────────────────────────────────────────────┐
│                    Save/Load Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    Save     ┌──────────────────────┐         │
│  │  Editor  │ ─────────►  │  project.ladder.json │         │
│  │  State   │             │  (Downloads folder)  │         │
│  └──────────┘             └──────────────────────┘         │
│       ▲                            │                        │
│       │                            ▼                        │
│       │                    Share via:                       │
│       │                    • Email                          │
│       │                    • Dropbox/Drive                  │
│       │                    • Git                            │
│       │                            │                        │
│       │         Open              │                         │
│       └────────────────────────────┘                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auto-save (localStorage)                            │  │
│  │  • Every 30 seconds                                  │  │
│  │  • Survives browser refresh                          │  │
│  │  • Backup if user forgets to save                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### File Format (`.ladder.json`)

```json
{
  "name": "Motor Control Project",
  "version": "1.0",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z",
  "rungs": [
    {
      "id": "rung-1",
      "comment": "Start motor when button pressed",
      "elements": [
        {
          "id": "elem-1",
          "type": "contact",
          "variable": "X0",
          "negated": false,
          "position": { "x": 0, "y": 0 },
          "connections": { "right": "elem-2" }
        },
        {
          "id": "elem-2",
          "type": "coil",
          "variable": "Y0",
          "coilType": "output",
          "position": { "x": 200, "y": 0 },
          "connections": { "left": "elem-1" }
        }
      ]
    }
  ]
}
```

### Toolbar Actions

| Action | Description | Implementation |
|--------|-------------|----------------|
| **New** | Clear canvas, start fresh | `resetState()` |
| **Open** | File picker, load .ladder.json | `<input type="file">` + FileReader |
| **Save** | Download current project | `Blob` + download link |
| **Save As** | Download with new name | Prompt + Save |

### Code Reference

```typescript
// Save to file
function saveProject(data: LadderProject) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name}.ladder.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// Open from file
function openProject(file: File): Promise<LadderProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Auto-save to localStorage
function autoSave(data: LadderProject) {
  localStorage.setItem('ladder-draft', JSON.stringify(data));
  localStorage.setItem('ladder-draft-time', new Date().toISOString());
}

// Load auto-saved draft
function loadDraft(): LadderProject | null {
  const saved = localStorage.getItem('ladder-draft');
  return saved ? JSON.parse(saved) : null;
}

// Recent files list
function addToRecent(project: LadderProject) {
  const recent = JSON.parse(localStorage.getItem('ladder-recent') || '[]');
  recent.unshift({
    name: project.name,
    updatedAt: project.updatedAt,
    preview: generatePreview(project) // optional thumbnail
  });
  localStorage.setItem('ladder-recent', JSON.stringify(recent.slice(0, 10)));
}
```

---

## Internal JSON Schema

```typescript
interface LadderProject {
  name: string;
  version: string;
  rungs: Rung[];
}

interface Rung {
  id: string;
  elements: Element[];
}

interface Element {
  id: string;
  type: 'contact' | 'coil' | 'timer' | 'counter' | 'branch';
  variable: string;
  negated?: boolean; // for NC contact
  coilType?: 'output' | 'set' | 'reset';
  timerType?: 'TON' | 'TOF' | 'TP';
  preset?: number; // for timers/counters
  position: { x: number; y: number };
  connections: {
    left?: string;  // element id
    right?: string; // element id
    top?: string;   // for branches
    bottom?: string; // for branches
  };
}
```

---

## File Structure

```
ladder-web-ide/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── Canvas.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── RungLayout.tsx
│   │   ├── Nodes/
│   │   │   ├── ContactNode.tsx
│   │   │   ├── CoilNode.tsx
│   │   │   ├── TimerNode.tsx
│   │   │   └── CounterNode.tsx
│   │   ├── Palette/
│   │   │   └── ComponentPalette.tsx
│   │   └── Export/
│   │       └── ExportDialog.tsx
│   ├── core/
│   │   ├── schema/
│   │   │   └── types.ts
│   │   ├── compiler/
│   │   │   ├── index.ts
│   │   │   ├── siemens.ts
│   │   │   ├── rockwell.ts
│   │   │   └── mitsubishi.ts
│   │   └── validation/
│   │       └── validate.ts
│   ├── store/
│   │   └── useStore.ts
│   ├── hooks/
│   │   └── useLadder.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile.dev          # Development Dockerfile
├── Dockerfile.prod         # Production Dockerfile
├── nginx.conf              # Nginx config for production
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Export Format Examples

### Siemens STL (Phase 3)
```
// Input: Ladder diagram with X0 -> Y0
// Output:
      A     I0.0
      =     Q0.0
```

### Rockwell L5K (Phase 4+)
```xml
<Routine Name="MainRoutine" Type="RLL">
  <Rung>
    <Text>XIC(I:1/0) OTE(O:2/0)</Text>
  </Rung>
</Routine>
```

---

## Verification

1. **Manual Testing**
   - Create ladder diagrams
   - Verify visual output matches expected
   - Export and verify generated code

2. **Compiler Testing**
   - Unit tests for each exporter
   - Compare output with vendor IDE output
   - Test edge cases (empty, complex branches)

3. **E2E Testing**
   - Playwright tests for editor interactions
   - Save/load persistence tests

---

## Future Enhancements (Post-MVP)

- [ ] More vendor exporters (Rockwell, Mitsubishi, CODESYS)
- [ ] Import from vendor formats
- [ ] Simulation mode (step through logic)
- [ ] Cloud storage (backend)
- [ ] Collaboration features
- [ ] Version control integration
- [ ] Custom component library
- [ ] Print/export to PDF/PNG

---

## Getting Started Commands

### Option 1: Local Development (Recommended for quick setup)

```bash
# Navigate to project folder
cd ladder-web-ide

# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 2: Docker Development (Recommended for consistent environment)

```bash
# Navigate to project folder
cd ladder-web-ide

# Start development server with Docker
docker compose up

# Or run in background
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down
```

### Production Preview

```bash
# Build and preview production version
docker compose --profile preview up preview

# Access at http://localhost:4173
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first working prototype | < 2 weeks |
| Basic editor functional | Week 2 |
| First vendor export working | Week 4 |
| MVP ready for testing | Week 6 |
