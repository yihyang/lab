# AGENTS.md - Ladder Web IDE

This document provides guidance for AI agents working with the Ladder Web IDE codebase.

## Project Overview

Ladder Web IDE is a web-based ladder logic diagramming tool for PLC programming with multi-vendor export support.

**Core Value Proposition**: Draw once → Export to any PLC vendor format

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Diagramming**: React Flow 11
- **State Management**: Zustand 5
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite 7
- **Testing**: Vitest + Testing Library

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Build for production
npm run test       # Run tests (watch mode)
npm run test:run   # Run tests (single run)
npm run lint       # Lint code
```

## Project Structure

```
src/
├── components/
│   ├── Editor/          # Canvas, Toolbar, Validation, Simulation
│   ├── Nodes/           # Custom React Flow nodes
│   ├── Palette/         # Component palette for drag-and-drop
│   └── Export/          # Export dialog with vendor selection
├── core/
│   ├── schema/          # Type definitions
│   ├── compiler/        # PLC exporters (Keyence, etc.)
│   └── validation/      # Project validation rules
├── store/               # Zustand state management
├── hooks/               # Custom React hooks
└── App.tsx              # Main application component
```

## Key Types

```typescript
interface LadderProject {
  name: string;
  version: string;
  rungs: Rung[];
}

// Variable naming: X=Input, Y=Output, M=Memory, T=Timer, C=Counter
```

## Adding New Features

### New Node Type
1. Create component in `src/components/Nodes/`
2. Add type to `src/core/schema/types.ts`
3. Register in `src/components/Nodes/index.ts`
4. Add to palette, update exporters

### New Exporter
1. Create `src/core/compiler/vendor.ts` implementing `LadderExporter`
2. Register in `src/core/compiler/index.ts`
3. Add vendor info to `VENDOR_INFO`
4. Add tests

## Common Gotchas

- React Flow: Left handle = input, right handle = output
- Variable names must follow PLC convention (X, Y, M, T, C prefixes)
- State changes must go through store actions for undo/redo tracking
