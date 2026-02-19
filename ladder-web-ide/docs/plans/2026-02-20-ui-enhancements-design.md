# UI Enhancements Design

## Overview

This document outlines the design for 5 UI enhancements to the Ladder Web IDE:
1. More keyboard shortcuts
2. Element reordering via drag
3. Copy/paste elements
4. Keyboard shortcut help overlay
5. Zoom improvements

---

## 1. Keyboard Shortcuts

### New Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+R` | Add new rung |
| `Ctrl+S` | Save project |
| `Ctrl+N` | New project |
| `Ctrl+O` | Open file dialog |
| `Ctrl+A` | Select all elements |
| `Ctrl+C` | Copy selected element |
| `Ctrl+V` | Paste element |
| `Ctrl+D` | Duplicate selected element |
| `?` | Show keyboard shortcuts help |

### Implementation
- Extend existing `onKeyDown` handler in `Canvas.tsx`
- Add clipboard state to store
- Create `KeyboardShortcutsDialog` component for help overlay

---

## 2. Element Reordering

### Behavior
- Enable dragging on element nodes
- Track drag end position to calculate new x-position
- On drop, update `element.position.x`
- Call `reorderRungElements()` to maintain proper order

### Visual Feedback
- Highlight drop zone when dragging over valid positions
- Smooth transition animation

---

## 3. Copy/Paste Elements

### Store Additions
```typescript
clipboard: LadderElement | null;
copyElement: () => void;
pasteElement: () => void;
duplicateElement: () => void;
```

### Actions
- `copyElement()`: Store selected element in clipboard
- `pasteElement()`: Create new element from clipboard with new ID, append to rung
- `duplicateElement()`: Copy + paste in one step

---

## 4. Keyboard Shortcuts Help Overlay

### Component
- New `KeyboardShortcutsDialog` component
- Triggered by `?` key or toolbar button
- Modal overlay with formatted shortcuts table
- Grouped by category: File, Edit, View, Elements
- Close with `Escape` or click outside

### Categories
- **File:** New, Open, Save
- **Edit:** Undo, Redo, Copy, Paste, Duplicate, Delete
- **View:** Zoom In, Zoom Out, Fit View, Help
- **Elements:** Add Rung, Select All

---

## 5. Zoom Improvements

### Features
- `fitView` button to fit all content in view
- Zoom controls: `+` / `-` buttons
- Current zoom percentage display

### Implementation
- Use React Flow's `useReactFlow` hook
- Methods: `fitView()`, `zoomIn()`, `zoomOut()`

### UI Placement
- Zoom controls in bottom-left panel, below "Add Rung" button
- Current zoom level displayed (e.g., "75%")

---

## Files to Modify

1. `src/store/useStore.ts` - Add clipboard state and actions
2. `src/components/Editor/Canvas.tsx` - Extend keyboard shortcuts, add zoom controls
3. `src/components/Editor/Toolbar.tsx` - Add help button
4. `src/components/Editor/KeyboardShortcutsDialog.tsx` - New component
5. `src/core/schema/types.ts` - Add clipboard type to LadderState

---

## Testing

- Unit tests for clipboard actions
- Unit tests for keyboard shortcut handlers
- E2E tests for copy/paste workflow
