# Instruction List (IL) Export - Design Document

**Date**: 2026-02-20
**Status**: Approved
**Phase**: 1 (Export-only)

## Overview

Add IL (Instruction List) export capability to the ladder editor, allowing users to view and copy Keyence-format IL code generated from their ladder diagrams.

## Scope

### Phase 1 (this design)
- Modal dialog triggered from toolbar
- Read-only IL code display
- Copy to clipboard button
- Supports current ladder elements only

### Phase 2 (future)
- Side-by-side panel view
- Toggle between ladder and IL
- Optional editing capability

## Supported Instructions

Maps from current ladder elements to Keyence IL format:

| Ladder Element | IL Output |
|----------------|-----------|
| Contact (NO) - series | `AND X0` |
| Contact (NO) - first | `LD X0` |
| Contact (NO) - parallel | `OR X0` |
| Contact (NC) - series | `ANI X0` |
| Contact (NC) - first | `LDI X0` |
| Contact (NC) - parallel | `ORI X0` |
| Coil (Out) | `OUT Y0` |
| Coil (Set) | `SET Y0` |
| Coil (Reset) | `RST Y0` |
| Timer | `TIM T0 K50` |
| Counter | `CNT C0 K10` |

**Not included**: Data instructions (MOV, CMP, arithmetic) - future feature when data nodes are added to ladder editor.

## UI/UX Design

### Trigger Point
- Add "Export IL" button to the existing `Toolbar.tsx`
- Placed near the existing "Export" button (which handles Keyence file export)
- Icon suggestion: code/text icon or `{ }`

### Modal Dialog Layout
```
┌─────────────────────────────────────────────┐
│  Instruction List - Keyence Format      [X] │
├─────────────────────────────────────────────┤
│                                             │
│  LD X0                                      │
│  AND X1                                     │
│  OUT Y0                                     │
│  LD X2                                      │
│  TIM T0 K50                                 │
│                                             │
│  (monospace font, scrollable textarea)      │
│                                             │
├─────────────────────────────────────────────┤
│                          [Copy to Clipboard]│
└─────────────────────────────────────────────┘
```

### Behavior
- Modal opens with IL code pre-generated from current diagram
- Code regenerates each time modal opens (not live-updating while open)
- "Copy to Clipboard" shows brief success feedback (e.g., "Copied!")
- Close via X button, clicking outside, or Escape key
- If diagram is empty, show placeholder: "No instructions. Add elements to your ladder diagram."

## Architecture

### New Files
```
src/
├── components/Export/
│   └── ILExportDialog.tsx      # Modal component
├── core/compiler/
│   └── il-keyence.ts           # IL generator logic
```

### Integration Points

1. **Store** (`useStore.ts`) - No changes needed. IL generator reads directly from existing `nodes` and `edges` state.

2. **Compiler** (`core/compiler/il-keyence.ts`) - New exporter following the existing compiler pattern:
   ```typescript
   export function generateIL(nodes: Node[], edges: Edge[]): string
   ```
   - Traverses rungs in order
   - Outputs instruction per element
   - Handles series/parallel logic with LD/AND/OR

3. **Toolbar** (`Toolbar.tsx`) - Add button that opens IL dialog:
   ```typescript
   const [showILDialog, setShowILDialog] = useState(false);
   ```

4. **App** (`App.tsx`) - Render dialog alongside existing modals.

### Generation Algorithm
```
For each rung (top to bottom):
  1. Find elements on this rung
  2. For contacts (left to right):
     - First contact: LD/LDI
     - Series contacts: AND/ANI
     - Parallel branch: OR/ORI with stack logic
  3. For timers/counters: TIM/CNT with preset
  4. For coils (rightmost): OUT/SET/RST
```

**Branches** (parallel paths) use Keyence's MPS/MPP (push/pop stack) instructions or ORB (or block).

## Implementation Tasks

| Step | Task | File |
|------|------|------|
| 1 | Create IL generator function (simple rungs first) | `core/compiler/il-keyence.ts` |
| 2 | Add unit tests for IL generator | `tests/compiler/il-keyence.test.ts` |
| 3 | Handle parallel branches (MPS/MPP or ORB) | `core/compiler/il-keyence.ts` |
| 4 | Create dialog component with textarea | `components/Export/ILExportDialog.tsx` |
| 5 | Add "Export IL" button to toolbar | `components/Editor/Toolbar.tsx` |
| 6 | Wire up dialog state in App | `App.tsx` |
| 7 | Add copy-to-clipboard functionality | `ILExportDialog.tsx` |
| 8 | Handle empty diagram case | `ILExportDialog.tsx` |

## Testing

### Test Cases for IL Generator
1. Empty diagram → empty string or placeholder
2. Single rung with one contact + coil
3. Single rung with multiple series contacts
4. Rung with timer
5. Rung with counter
6. Multiple rungs
7. Parallel branch (complex case)

### Testing Approach
| Type | Coverage |
|------|----------|
| **Unit tests** | IL generator with various ladder configurations |
| **Integration** | Dialog opens, shows correct code, copy works |
| **Manual** | Create ladder → open dialog → verify IL → copy → paste to verify |

## Dependencies
- No new npm packages needed
- Uses existing `zustand` store, `react-flow` types
