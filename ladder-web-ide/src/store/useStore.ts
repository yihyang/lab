import { create } from 'zustand';
import type {
  LadderState,
  LadderProject,
  LadderElement,
  Position,
  SimulationState,
} from '../core/schema/types';
import { createEmptyProject } from '../core/schema/types';

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

// Initial simulation state
const createEmptySimulationState = (): SimulationState => ({
  running: false,
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
    set({
      simulation: {
        ...state.simulation,
        running: true,
      },
    });
  },

  stopSimulation: () => {
    const state = get();
    set({
      simulation: {
        ...state.simulation,
        running: false,
      },
    });
  },

  resetSimulation: () => {
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
    const newTimers = { ...simulation.timers };
    const newCounters = { ...simulation.counters };

    project.rungs.forEach((rung) => {
      // Sort elements by position
      const sortedElements = [...rung.elements].sort((a, b) => a.position.x - b.position.x);

      let powerFlow = true; // Power from left rail

      sortedElements.forEach((element) => {
        const { type, variable } = element;

        // Get input state for this element
        const getInputState = (): boolean => {
          if (variable.startsWith('X')) {
            return simulation.inputs[variable] ?? false;
          }
          if (variable.startsWith('Y')) {
            return simulation.outputs[variable] ?? false;
          }
          if (variable.startsWith('M')) {
            return simulation.internalBits[variable] ?? false;
          }
          if (variable.startsWith('T')) {
            return simulation.timers[variable]?.done ?? false;
          }
          if (variable.startsWith('C')) {
            return simulation.counters[variable]?.done ?? false;
          }
          return false;
        };

        // Evaluate element based on type
        switch (type) {
          case 'contact': {
            const inputState = getInputState();
            const isNegated = (element as any).contactType === 'nc';
            const contactClosed = isNegated ? !inputState : inputState;
            powerFlow = powerFlow && contactClosed;
            break;
          }
          case 'coil': {
            if (powerFlow) {
              const coilType = (element as any).coilType;
              if (coilType === 'set') {
                newOutputs[variable] = true;
              } else if (coilType === 'reset') {
                newOutputs[variable] = false;
              } else {
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
      });
    });

    set({
      simulation: {
        running: simulation.running,
        inputs: { ...simulation.inputs },
        outputs: newOutputs,
        internalBits: { ...simulation.internalBits },
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
