// Ladder Web IDE - Core Schema Types

export type ContactType = 'no' | 'nc'; // Normally Open / Normally Closed
export type CoilType = 'output' | 'set' | 'reset';
export type TimerType = 'TON' | 'TOF' | 'TP';
export type CounterType = 'CTU' | 'CTD';

export type ElementType = 'contact' | 'coil' | 'timer' | 'counter' | 'branch';

export interface Position {
  x: number;
  y: number;
}

export interface ElementConnections {
  left?: string;   // element id connected to left
  right?: string;  // element id connected to right
  top?: string;    // for branches - element id above
  bottom?: string; // for branches - element id below
}

export interface BaseElement {
  id: string;
  type: ElementType;
  variable: string;
  position: Position;
  connections: ElementConnections;
  rungId: string;
}

export interface ContactElement extends BaseElement {
  type: 'contact';
  contactType: ContactType; // 'no' or 'nc'
}

export interface CoilElement extends BaseElement {
  type: 'coil';
  coilType: CoilType; // 'output', 'set', or 'reset'
}

export interface TimerElement extends BaseElement {
  type: 'timer';
  timerType: TimerType; // 'TON', 'TOF', or 'TP'
  preset: number;       // time value in ms
  accumulated?: number; // current value
}

export interface CounterElement extends BaseElement {
  type: 'counter';
  counterType: CounterType; // 'CTU' or 'CTD'
  preset: number;           // count target
  accumulated?: number;     // current count
}

export interface BranchElement extends BaseElement {
  type: 'branch';
  branchType: 'start' | 'end' | 'junction';
  branchId: string; // groups related branch elements
}

export type LadderElement = ContactElement | CoilElement | TimerElement | CounterElement | BranchElement;

export interface Rung {
  id: string;
  elements: LadderElement[];
  comment?: string;
  position: number; // vertical order
}

export interface LadderProject {
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  rungs: Rung[];
}

// React Flow Node Types
export interface LadderNodeData {
  element: LadderElement;
  onVariableChange?: (id: string, variable: string) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  hasPower?: boolean;
}

// Store State
export interface LadderState {
  project: LadderProject;
  selectedElementId: string | null;
  selectedRungId: string | null;
  isDirty: boolean;

  // History state
  canUndo: boolean;
  canRedo: boolean;

  // Simulation state
  simulation: SimulationState;

  // Clipboard state
  clipboard: LadderElement | null;

  // Actions
  setProject: (project: LadderProject) => void;
  updateProjectName: (name: string) => void;

  addRung: (afterRungId?: string) => void;
  removeRung: (rungId: string) => void;
  updateRungComment: (rungId: string, comment: string) => void;

  addElement: (rungId: string, element: Omit<LadderElement, 'id' | 'rungId'>) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<LadderElement>) => void;
  updateElementPosition: (elementId: string, position: Position) => void;
  connectElements: (sourceId: string, targetId: string, direction: 'left' | 'right' | 'top' | 'bottom') => void;
  disconnectElements: (sourceId: string, direction: 'left' | 'right' | 'top' | 'bottom') => void;
  reorderRungElements: (rungId: string) => void;

  setSelectedElement: (elementId: string | null) => void;
  setSelectedRung: (rungId: string | null) => void;

  newProject: () => void;
  markClean: () => void;

  // Undo/Redo actions
  undo: () => void;
  redo: () => void;

  // Clipboard actions
  copyElement: () => void;
  pasteElement: (targetRungId?: string) => void;
  duplicateElement: () => void;

  // Simulation actions
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;
  toggleInput: (variable: string) => void;
  setSimulationState: (state: Partial<SimulationState>) => void;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
}

// Recent file entry
export interface RecentFile {
  name: string;
  updatedAt: string;
  elementCount: number;
}

// Simulation State
export type SimulationSpeed = 'slow' | 'medium' | 'fast';

export interface SimulationState {
  running: boolean;
  speed: SimulationSpeed;
  cycleCount: number;
  inputs: Record<string, boolean>;      // X0, X1, etc.
  outputs: Record<string, boolean>;     // Y0, Y1, etc.
  internalBits: Record<string, boolean>; // M0, M1, etc.
  timers: Record<string, {
    elapsed: number;
    preset: number;
    done: boolean;
    running: boolean;
  }>;
  counters: Record<string, {
    current: number;
    preset: number;
    done: boolean;
  }>;
  powerFlow: Record<string, boolean>;   // Element ID -> has power
}

// Helper type guards
export function isContactElement(element: LadderElement): element is ContactElement {
  return element.type === 'contact';
}

export function isCoilElement(element: LadderElement): element is CoilElement {
  return element.type === 'coil';
}

export function isTimerElement(element: LadderElement): element is TimerElement {
  return element.type === 'timer';
}

export function isCounterElement(element: LadderElement): element is CounterElement {
  return element.type === 'counter';
}

export function isBranchElement(element: LadderElement): element is BranchElement {
  return element.type === 'branch';
}

// Factory functions
export function createContactElement(
  rungId: string,
  position: Position,
  variable: string = 'X0',
  contactType: ContactType = 'no'
): ContactElement {
  return {
    id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'contact',
    rungId,
    position,
    variable,
    contactType,
    connections: {},
  };
}

export function createCoilElement(
  rungId: string,
  position: Position,
  variable: string = 'Y0',
  coilType: CoilType = 'output'
): CoilElement {
  return {
    id: `coil-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'coil',
    rungId,
    position,
    variable,
    coilType,
    connections: {},
  };
}

export function createTimerElement(
  rungId: string,
  position: Position,
  variable: string = 'T0',
  timerType: TimerType = 'TON',
  preset: number = 1000
): TimerElement {
  return {
    id: `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'timer',
    rungId,
    position,
    variable,
    timerType,
    preset,
    connections: {},
  };
}

export function createCounterElement(
  rungId: string,
  position: Position,
  variable: string = 'C0',
  counterType: CounterType = 'CTU',
  preset: number = 10
): CounterElement {
  return {
    id: `counter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'counter',
    rungId,
    position,
    variable,
    counterType,
    preset,
    connections: {},
  };
}

// Branch type for parallel paths
export type BranchType = 'start' | 'end' | 'junction';

export function createBranchElement(
  rungId: string,
  position: Position,
  branchType: BranchType = 'start',
  branchId?: string
): BranchElement {
  return {
    id: `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'branch',
    rungId,
    position,
    variable: '', // Branches don't have variables
    branchType,
    branchId: branchId || `branch-group-${Date.now()}`,
    connections: {},
  };
}

// Create a new empty project
export function createEmptyProject(name: string = 'Untitled Project'): LadderProject {
  const now = new Date().toISOString();
  return {
    name,
    version: '1.0',
    createdAt: now,
    updatedAt: now,
    rungs: [],
  };
}
