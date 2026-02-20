import { create } from 'zustand';
import type {
  LadderState,
  LadderProject,
  LadderElement,
  Position,
  SimulationState,
  SimulationSpeed,
} from '../core/schema/types';
import { createEmptyProject } from '../core/schema/types';
import type { LadderTemplate } from '../core/templates/types';
import { createProjectFromTemplate } from '../core/templates/templateUtils';

// Generate unique ID
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// History management
const MAX_HISTORY_SIZE = 50;
let historyStack: LadderProject[] = [];
let historyIndex = -1;

// Save current state to history
const saveToHistory = (project: LadderProject) => {
  // Remove any redo states
  historyStack = historyStack.slice(0, historyIndex + 1);

  // Add new state
  historyStack.push(JSON.parse(JSON.stringify(project)));

  // Limit history size
  if (historyStack.length > MAX_HISTORY_SIZE) {
    historyStack.shift();
  } else {
    historyIndex++;
  }
};

// Clear history (for new project or loaded project)
const clearHistory = () => {
  historyStack = [];
  historyIndex = -1;
};

// Simulation interval management
let simulationInterval: ReturnType<typeof setInterval> | null = null;

const SPEED_INTERVALS: Record<SimulationSpeed, number> = {
  slow: 500,    // 500ms per cycle
  medium: 200,  // 200ms per cycle
  fast: 50,     // 50ms per cycle
};

// Initial simulation state
const createEmptySimulationState = (): SimulationState => ({
  running: false,
  speed: 'medium',
  cycleCount: 0,
  inputs: {},
  outputs: {},
  internalBits: {},
  timers: {},
  counters: {},
  powerFlow: {},
});

export const useStore = create<LadderState>((set, get) => ({
  project: createEmptyProject(),
  selectedElementId: null,
  selectedRungId: null,
  isDirty: false,
  canUndo: false,
  canRedo: false,
  simulation: createEmptySimulationState(),
  clipboard: null,

  // Project actions
  setProject: (project: LadderProject) => {
    clearHistory();
    saveToHistory(project);
    set({
      project,
      selectedElementId: null,
      selectedRungId: null,
      isDirty: false,
      canUndo: false,
      canRedo: false,
    });
  },

  updateProjectName: (name: string) => {
    const state = get();
    const newProject = {
      ...state.project,
      name,
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  // Rung actions
  addRung: (afterRungId?: string) => {
    const state = get();
    const newRungId = generateId('rung');
    const newRung = {
      id: newRungId,
      elements: [],
      position: state.project.rungs.length,
    };

    let newRungs;
    if (afterRungId) {
      const index = state.project.rungs.findIndex((r) => r.id === afterRungId);
      newRungs = [...state.project.rungs];
      newRungs.splice(index + 1, 0, newRung);
      newRungs = newRungs.map((r, i) => ({ ...r, position: i }));
    } else {
      newRungs = [...state.project.rungs, newRung];
    }

    const newProject = {
      ...state.project,
      rungs: newRungs,
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      selectedRungId: newRungId,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  removeRung: (rungId: string) => {
    const state = get();
    const newRungs = state.project.rungs
      .filter((r) => r.id !== rungId)
      .map((r, i) => ({ ...r, position: i }));

    const newProject = {
      ...state.project,
      rungs: newRungs,
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      selectedRungId: state.selectedRungId === rungId ? null : state.selectedRungId,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  updateRungComment: (rungId: string, comment: string) => {
    const state = get();
    const newProject = {
      ...state.project,
      rungs: state.project.rungs.map((r) =>
        r.id === rungId ? { ...r, comment } : r
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  // Element actions
  addElement: (rungId: string, element: Omit<LadderElement, 'id' | 'rungId'>) => {
    const state = get();
    const id = generateId(element.type);
    const newElement = {
      ...element,
      id,
      rungId,
    } as LadderElement;

    const newProject = {
      ...state.project,
      rungs: state.project.rungs.map((r) =>
        r.id === rungId
          ? { ...r, elements: [...r.elements, newElement] }
          : r
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      selectedElementId: id,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  removeElement: (elementId: string) => {
    const state = get();

    const newRungs = state.project.rungs.map((rung) => {
      const filteredElements = rung.elements.filter((e) => e.id !== elementId);

      const cleanedElements = filteredElements.map((e) => {
        const newConnections = { ...e.connections };
        if (newConnections.left === elementId) delete newConnections.left;
        if (newConnections.right === elementId) delete newConnections.right;
        if (newConnections.top === elementId) delete newConnections.top;
        if (newConnections.bottom === elementId) delete newConnections.bottom;
        return { ...e, connections: newConnections };
      });

      return { ...rung, elements: cleanedElements };
    });

    const newProject = {
      ...state.project,
      rungs: newRungs,
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      selectedElementId:
        state.selectedElementId === elementId ? null : state.selectedElementId,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  updateElement: (elementId: string, updates: Partial<LadderElement>) => {
    const state = get();
    const newProject = {
      ...state.project,
      rungs: state.project.rungs.map((rung) => ({
        ...rung,
        elements: rung.elements.map((e) =>
          e.id === elementId ? { ...e, ...updates } as LadderElement : e
        ),
      })),
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  updateElementPosition: (elementId: string, position: Position) => {
    const state = get();
    const newProject = {
      ...state.project,
      rungs: state.project.rungs.map((rung) => ({
        ...rung,
        elements: rung.elements.map((e) =>
          e.id === elementId ? { ...e, position } : e
        ),
      })),
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  connectElements: (
    sourceId: string,
    targetId: string,
    direction: 'left' | 'right' | 'top' | 'bottom'
  ) => {
    const state = get();
    const oppositeDirection: 'left' | 'right' | 'top' | 'bottom' =
      direction === 'left' ? 'right' :
      direction === 'right' ? 'left' :
      direction === 'top' ? 'bottom' : 'top';

    const newRungs = state.project.rungs.map((rung) => ({
      ...rung,
      elements: rung.elements.map((e) => {
        if (e.id === sourceId) {
          return {
            ...e,
            connections: { ...e.connections, [direction]: targetId },
          };
        }
        if (e.id === targetId) {
          return {
            ...e,
            connections: { ...e.connections, [oppositeDirection]: sourceId },
          };
        }
        return e;
      }),
    }));

    const newProject = {
      ...state.project,
      rungs: newRungs,
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  // Reorder elements in a rung: contacts -> branches -> timers/counters -> coils
  reorderRungElements: (rungId: string) => {
    const state = get();

    // Helper to get element order priority
    const getElementOrder = (type: string): number => {
      switch (type) {
        case 'contact': return 1;
        case 'branch': return 2;
        case 'timer': return 3;
        case 'counter': return 3;
        case 'coil': return 4;
        default: return 5;
      }
    };

    const newRungs = state.project.rungs.map((rung) => {
      if (rung.id !== rungId) return rung;

      // Sort elements by type, then by original position
      const sortedElements = [...rung.elements].sort((a, b) => {
        const orderA = getElementOrder(a.type);
        const orderB = getElementOrder(b.type);
        if (orderA !== orderB) return orderA - orderB;
        return a.position.x - b.position.x;
      });

      // Update position.x to reflect new order
      const reorderedElements = sortedElements.map((el, index) => ({
        ...el,
        position: { ...el.position, x: index },
      }));

      return { ...rung, elements: reorderedElements };
    });

    const newProject = {
      ...state.project,
      rungs: newRungs,
      updatedAt: new Date().toISOString(),
    };
    // Don't save to history for reorder - it's an automatic adjustment
    set({
      project: newProject,
      isDirty: true,
    });
  },

  disconnectElements: (sourceId: string, direction: 'left' | 'right' | 'top' | 'bottom') => {
    const state = get();
    const newRungs = state.project.rungs.map((rung) => ({
      ...rung,
      elements: rung.elements.map((e) => {
        if (e.id === sourceId) {
          const newConnections = { ...e.connections };
          delete newConnections[direction];
          return { ...e, connections: newConnections };
        }
        return e;
      }),
    }));

    const newProject = {
      ...state.project,
      rungs: newRungs,
      updatedAt: new Date().toISOString(),
    };
    saveToHistory(newProject);
    set({
      project: newProject,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },

  // Selection actions
  setSelectedElement: (elementId: string | null) => {
    set({ selectedElementId: elementId });
  },

  setSelectedRung: (rungId: string | null) => {
    set({ selectedRungId: rungId });
  },

  // Project management
  newProject: () => {
    const newProj = createEmptyProject();
    clearHistory();
    saveToHistory(newProj);
    set({
      project: newProj,
      selectedElementId: null,
      selectedRungId: null,
      isDirty: false,
      canUndo: false,
      canRedo: false,
      simulation: createEmptySimulationState(),
    });
  },

  loadFromTemplate: (template: LadderTemplate) => {
    const newProj = createProjectFromTemplate(template);
    clearHistory();
    saveToHistory(newProj);
    set({
      project: newProj,
      selectedElementId: null,
      selectedRungId: null,
      isDirty: true, // Mark as dirty since it's a new project from template
      canUndo: false,
      canRedo: false,
      simulation: createEmptySimulationState(),
    });
  },

  markClean: () => {
    set({ isDirty: false });
  },

  // Undo/Redo actions
  undo: () => {
    if (historyIndex > 0) {
      historyIndex--;
      const previousProject = historyStack[historyIndex];
      set({
        project: previousProject,
        selectedElementId: null,
        canUndo: historyIndex > 0,
        canRedo: true,
      });
    }
  },

  redo: () => {
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      const nextProject = historyStack[historyIndex];
      set({
        project: nextProject,
        selectedElementId: null,
        canUndo: true,
        canRedo: historyIndex < historyStack.length - 1,
      });
    }
  },

  // Simulation actions
  startSimulation: () => {
    const state = get();

    // Clear any existing interval
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    // Start continuous simulation
    simulationInterval = setInterval(() => {
      get().stepSimulation();
    }, SPEED_INTERVALS[state.simulation.speed]);

    set({
      simulation: {
        ...state.simulation,
        running: true,
      },
    });
  },

  stopSimulation: () => {
    // Clear the interval
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }

    const state = get();
    set({
      simulation: {
        ...state.simulation,
        running: false,
      },
    });
  },

  resetSimulation: () => {
    // Clear the interval
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }

    set({
      simulation: createEmptySimulationState(),
    });
  },

  stepSimulation: () => {
    const state = get();
    const { project, simulation } = state;

    // Initialize power flow for each rung
    const newPowerFlow: Record<string, boolean> = {};
    const newOutputs: Record<string, boolean> = { ...simulation.outputs };
    const newInternalBits: Record<string, boolean> = { ...simulation.internalBits };
    const newTimers = { ...simulation.timers };
    const newCounters = { ...simulation.counters };

    // Helper to check variable state from current cycle's updates
    const getVariableState = (variable: string): boolean => {
      if (variable.startsWith('X')) {
        return simulation.inputs[variable] ?? false;
      }
      if (variable.startsWith('Y')) {
        return newOutputs[variable] ?? false;
      }
      if (variable.startsWith('M')) {
        return newInternalBits[variable] ?? false;
      }
      if (variable.startsWith('T')) {
        return newTimers[variable]?.done ?? false;
      }
      if (variable.startsWith('C')) {
        return newCounters[variable]?.done ?? false;
      }
      return false;
    };

    project.rungs.forEach((rung) => {
      // Build element lookup by ID
      const elementById = new Map(rung.elements.map(e => [e.id, e]));

      // Find branch start/end pairs and group parallel paths
      const branchGroups = new Map<string, { start: string; end: string; branchId: string }>();
      rung.elements.forEach(el => {
        if (el.type === 'branch') {
          const branchEl = el as any;
          if (branchEl.branchType === 'start') {
            const existing = branchGroups.get(branchEl.branchId) || { start: '', end: '', branchId: branchEl.branchId };
            existing.start = el.id;
            branchGroups.set(branchEl.branchId, existing);
          } else if (branchEl.branchType === 'end') {
            const existing = branchGroups.get(branchEl.branchId) || { start: '', end: '', branchId: branchEl.branchId };
            existing.end = el.id;
            branchGroups.set(branchEl.branchId, existing);
          }
        }
      });

      // Evaluate a path from an element to the branch end (or to coil if no branch)
      const evaluatePath = (startElementId: string, incomingPower: boolean): { power: boolean; endId: string | null } => {
        let currentId: string | null = startElementId;
        let powerFlow = incomingPower;

        while (currentId) {
          const element = elementById.get(currentId);
          if (!element) break;

          const { type, variable } = element;

          // Skip branch elements in path evaluation (they're structural)
          if (type === 'branch') {
            const branchEl = element as any;
            if (branchEl.branchType === 'start') {
              // Follow right connection (upper path)
              currentId = element.connections.right || null;
              continue;
            }
            if (branchEl.branchType === 'end') {
              // Reached end of branch
              return { power: powerFlow, endId: currentId };
            }
          }

          // Evaluate element based on type
          switch (type) {
            case 'contact': {
              const inputState = getVariableState(variable);
              const isNegated = (element as any).contactType === 'nc';
              const contactClosed = isNegated ? !inputState : inputState;
              powerFlow = powerFlow && contactClosed;
              break;
            }
            case 'coil': {
              if (powerFlow) {
                const coilType = (element as any).coilType;
                if (coilType === 'set') {
                  // SET coil - write to appropriate state
                  if (variable.startsWith('M')) {
                    newInternalBits[variable] = true;
                  } else {
                    newOutputs[variable] = true;
                  }
                } else if (coilType === 'reset') {
                  // RESET coil - write to appropriate state
                  if (variable.startsWith('M')) {
                    newInternalBits[variable] = false;
                  } else {
                    newOutputs[variable] = false;
                  }
                } else {
                  // Output coil
                  newOutputs[variable] = true;
                }
              } else {
                // Output coil turns off when no power
                const coilType = (element as any).coilType;
                if (coilType === 'output') {
                  newOutputs[variable] = false;
                }
              }
              break;
            }
            case 'timer': {
              // Initialize timer if not exists
              if (!newTimers[variable]) {
                const preset = (element as any).preset ?? 1000;
                newTimers[variable] = { elapsed: 0, preset, done: false, running: false };
              }

              if (powerFlow) {
                newTimers[variable].running = true;
                newTimers[variable].elapsed += 100; // Step by 100ms
                if (newTimers[variable].elapsed >= newTimers[variable].preset) {
                  newTimers[variable].done = true;
                }
              } else {
                // Timer resets when power is lost
                newTimers[variable].elapsed = 0;
                newTimers[variable].done = false;
                newTimers[variable].running = false;
              }
              break;
            }
            case 'counter': {
              // Initialize counter if not exists
              if (!newCounters[variable]) {
                const preset = (element as any).preset ?? 10;
                newCounters[variable] = { current: 0, preset, done: false };
              }

              if (powerFlow) {
                // Counter increments on rising edge (simplified)
                const counterType = (element as any).counterType;
                if (counterType === 'CTU') {
                  newCounters[variable].current += 1;
                  if (newCounters[variable].current >= newCounters[variable].preset) {
                    newCounters[variable].done = true;
                  }
                } else if (counterType === 'CTD') {
                  newCounters[variable].current = Math.max(0, newCounters[variable].current - 1);
                }
              }
              break;
            }
          }

          // Record power flow at this element
          newPowerFlow[element.id] = powerFlow;

          // Move to next element (right connection)
          currentId = element.connections.right || null;
        }

        return { power: powerFlow, endId: null };
      };

      // Find branch start elements
      const branchStarts = rung.elements.filter(
        el => el.type === 'branch' && (el as any).branchType === 'start'
      );

      if (branchStarts.length > 0) {
        // Process rung with branches
        branchStarts.forEach(branchStart => {
          const branchId = (branchStart as any).branchId;

          // Find all parallel paths from this branch start
          // Upper path: branchStart -> right connection
          // Lower paths: branchStart -> bottom connection (and chain down)

          const paths: boolean[] = [];

          // Evaluate upper path (right from branch start)
          if (branchStart.connections.right) {
            const result = evaluatePath(branchStart.connections.right, true);
            paths.push(result.power);
          }

          // Find lower paths by following bottom connections
          let lowerElementId = branchStart.connections.bottom;
          while (lowerElementId) {
            const lowerElement = elementById.get(lowerElementId);
            if (!lowerElement) break;

            // Evaluate this parallel path
            const result = evaluatePath(lowerElementId, true);
            paths.push(result.power);

            // Move to next lower path (if any)
            lowerElementId = lowerElement.connections.bottom;
          }

          // OR all paths together - if any path has power, the branch outputs power
          const branchOutputPower = paths.some(p => p);

          // Find branch end and continue evaluation
          const branchEnd = rung.elements.find(
            el => el.type === 'branch' &&
            (el as any).branchType === 'end' &&
            (el as any).branchId === branchId
          );

          if (branchEnd && branchEnd.connections.right) {
            // Continue evaluation after branch end
            evaluatePath(branchEnd.connections.right, branchOutputPower);
          }

          // Record power at branch elements
          newPowerFlow[branchStart.id] = true; // Branch start always has power from rail
          if (branchEnd) {
            newPowerFlow[branchEnd.id] = branchOutputPower;
          }
        });
      } else {
        // No branches - simple series evaluation
        // Find elements connected to left rail (no left connection)
        const startElements = rung.elements.filter(
          el => el.type !== 'branch' && !el.connections.left
        );

        // Sort by x position and start from the leftmost
        const sortedStarts = [...startElements].sort((a, b) => a.position.x - b.position.x);

        if (sortedStarts.length > 0) {
          evaluatePath(sortedStarts[0].id, true);
        }
      }
    });

    set({
      simulation: {
        running: simulation.running,
        speed: simulation.speed,
        cycleCount: simulation.cycleCount + 1,
        inputs: { ...simulation.inputs },
        outputs: newOutputs,
        internalBits: newInternalBits,
        timers: newTimers,
        counters: newCounters,
        powerFlow: newPowerFlow,
      },
    });
  },

  toggleInput: (variable: string) => {
    const state = get();
    const currentValue = state.simulation.inputs[variable] ?? false;
    set({
      simulation: {
        ...state.simulation,
        inputs: {
          ...state.simulation.inputs,
          [variable]: !currentValue,
        },
      },
    });
  },

  setSimulationState: (updates: Partial<SimulationState>) => {
    const state = get();
    set({
      simulation: {
        ...state.simulation,
        ...updates,
      },
    });
  },

  setSimulationSpeed: (speed: SimulationSpeed) => {
    const state = get();

    // If simulation is running, update the interval
    if (state.simulation.running && simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = setInterval(() => {
        get().stepSimulation();
      }, SPEED_INTERVALS[speed]);
    }

    set({
      simulation: {
        ...state.simulation,
        speed,
      },
    });
  },

  // Clipboard actions
  copyElement: () => {
    const state = get();
    if (!state.selectedElementId) return;

    // Find the selected element
    for (const rung of state.project.rungs) {
      const element = rung.elements.find((e) => e.id === state.selectedElementId);
      if (element) {
        set({ clipboard: JSON.parse(JSON.stringify(element)) });
        return;
      }
    }
  },

  pasteElement: (targetRungId?: string) => {
    const state = get();
    if (!state.clipboard) return;

    // Determine target rung
    let rungId = targetRungId;
    if (!rungId) {
      // Use first rung or create one
      if (state.project.rungs.length === 0) {
        get().addRung();
      }
      rungId = get().project.rungs[0].id;
    }

    // Find the rung
    const rung = get().project.rungs.find((r) => r.id === rungId);
    if (!rung) return;

    // Create new element from clipboard with new ID
    const newElement = {
      ...JSON.parse(JSON.stringify(state.clipboard)),
      position: { x: rung.elements.length, y: 0 },
    };
    delete newElement.id;
    delete newElement.rungId;

    get().addElement(rungId, newElement);
    get().reorderRungElements(rungId);
  },

  duplicateElement: () => {
    const state = get();
    if (!state.selectedElementId) return;

    // Copy then paste
    get().copyElement();
    get().pasteElement();
  },
}));

// Selector hooks for common patterns
export const useProject = () => useStore((state) => state.project);
export const useSelectedElement = () => {
  const selectedId = useStore((state) => state.selectedElementId);
  const project = useStore((state) => state.project);

  if (!selectedId) return null;

  for (const rung of project.rungs) {
    const element = rung.elements.find((e) => e.id === selectedId);
    if (element) return element;
  }

  return null;
};

export const useIsDirty = () => useStore((state) => state.isDirty);
