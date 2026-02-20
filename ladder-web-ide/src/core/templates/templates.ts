// Template Definitions for Ladder Web IDE

import type { LadderTemplate } from './types';

// Helper to create element definitions (without IDs - those are generated later)
const createContact = (
  variable: string,
  contactType: 'no' | 'nc' = 'no',
  position: { x: number; y: number } = { x: 0, y: 0 },
  connections: Record<string, string> = {}
) => ({
  type: 'contact' as const,
  variable,
  contactType,
  position,
  connections,
});

const createCoil = (
  variable: string,
  coilType: 'output' | 'set' | 'reset' = 'output',
  position: { x: number; y: number } = { x: 0, y: 0 },
  connections: Record<string, string> = {}
) => ({
  type: 'coil' as const,
  variable,
  coilType,
  position,
  connections,
});

const createTimer = (
  variable: string,
  timerType: 'TON' | 'TOF' | 'TP' = 'TON',
  preset: number = 1000,
  position: { x: number; y: number } = { x: 0, y: 0 },
  connections: Record<string, string> = {}
) => ({
  type: 'timer' as const,
  variable,
  timerType,
  preset,
  position,
  connections,
});

const createCounter = (
  variable: string,
  counterType: 'CTU' | 'CTD' = 'CTU',
  preset: number = 10,
  position: { x: number; y: number } = { x: 0, y: 0 },
  connections: Record<string, string> = {}
) => ({
  type: 'counter' as const,
  variable,
  counterType,
  preset,
  position,
  connections,
});

// Branch element helper - for creating parallel paths
const createBranch = (
  branchType: 'start' | 'end',
  branchId: string,
  position: { x: number; y: number } = { x: 0, y: 0 },
  connections: Record<string, string> = {}
) => ({
  type: 'branch' as const,
  variable: '',
  branchType,
  branchId,
  position,
  connections,
});

// ============================================
// MOTOR CONTROL TEMPLATES (4)
// ============================================

// Start/Stop with Latching - Classic motor circuit
// Ladder: |--[X0]--+--[X1]--(Y0)--|
//         |        |
//         |--[Y0]--|
// Structure: Branch(X0 || Y0) -> X1(NC) -> Coil Y0
// Elements: [0=branch-start, 1=X0, 2=Y0-latch, 3=branch-end, 4=X1, 5=coil]
const motorStartStop: LadderTemplate = {
  id: 'motor-start-stop',
  name: 'Start/Stop with Latching',
  description: 'Classic motor start/stop circuit with latching contact. Press Start to run, Stop to halt.',
  category: 'motor-control',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        // Branch start (index 0): right->X0(1), bottom->Y0-latch(2)
        createBranch('start', 'branch-0', { x: 0, y: 0 }, { right: 'temp-1', bottom: 'temp-2' }),
        // X0 Start contact (index 1): left->branch-start(0), right->branch-end(3)
        createContact('X0', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-3' }),
        // Y0 latching contact (index 2): left->branch-start(0), right->branch-end(3)
        createContact('Y0', 'no', { x: 1, y: 1 }, { left: 'temp-0', right: 'temp-3' }),
        // Branch end (index 3): left->X0(1), top->Y0-latch(2), right->X1(4)
        createBranch('end', 'branch-0', { x: 2, y: 0 }, { left: 'temp-1', top: 'temp-2', right: 'temp-4' }),
        // X1 Stop NC contact (index 4): left->branch-end(3), right->coil(5)
        createContact('X1', 'nc', { x: 3, y: 0 }, { left: 'temp-3', right: 'temp-5' }),
        // Coil Y0 (index 5): left->X1(4)
        createCoil('Y0', 'output', { x: 4, y: 0 }, { left: 'temp-4' }),
      ],
      comment: 'Start(X0) / Stop(X1) / Motor(Y0) with latching',
    },
  ],
  tags: ['motor', 'latching', 'start-stop', 'basic'],
};

const motorJog: LadderTemplate = {
  id: 'motor-jog',
  name: 'Jog Control',
  description: 'Jog control circuit - motor runs only while button is held. Useful for positioning.',
  category: 'motor-control',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCoil('Y0', 'output', { x: 1, y: 0 }, { left: 'temp-0' }),
      ],
      comment: 'Jog(X0) / Motor(Y0) - momentary operation',
    },
  ],
  tags: ['motor', 'jog', 'momentary', 'positioning'],
};

// Reversible Motor with Interlock - needs latching for each direction
const motorReversible: LadderTemplate = {
  id: 'motor-reversible',
  name: 'Reversible Motor with Interlock',
  description: 'Forward/reverse motor control with electrical interlock to prevent both directions simultaneously.',
  category: 'motor-control',
  difficulty: 'intermediate',
  rungs: [
    {
      elements: [
        // Forward rung with latching
        createBranch('start', 'branch-fwd', { x: 0, y: 0 }, { right: 'temp-1', bottom: 'temp-5' }),
        createContact('X0', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('X2', 'nc', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-6' }),
        createContact('Y1', 'nc', { x: 3, y: 0 }, { left: 'temp-2', right: 'temp-7' }),
        createContact('Y0', 'no', { x: 1, y: 1 }, { left: 'temp-0', right: 'temp-6' }),
        createBranch('end', 'branch-fwd', { x: 4, y: 0 }, { left: 'temp-3', top: 'temp-4', right: 'temp-8' }),
        createCoil('Y0', 'output', { x: 5, y: 0 }, { left: 'temp-7' }),
      ],
      comment: 'Forward(X0) / Stop(X2) / Forward(Y0) with interlock',
    },
    {
      elements: [
        // Reverse rung with latching
        createBranch('start', 'branch-rev', { x: 0, y: 0 }, { right: 'temp-1', bottom: 'temp-5' }),
        createContact('X1', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('X2', 'nc', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-6' }),
        createContact('Y0', 'nc', { x: 3, y: 0 }, { left: 'temp-2', right: 'temp-7' }),
        createContact('Y1', 'no', { x: 1, y: 1 }, { left: 'temp-0', right: 'temp-6' }),
        createBranch('end', 'branch-rev', { x: 4, y: 0 }, { left: 'temp-3', top: 'temp-4', right: 'temp-8' }),
        createCoil('Y1', 'output', { x: 5, y: 0 }, { left: 'temp-7' }),
      ],
      comment: 'Reverse(X1) / Stop(X2) / Reverse(Y1) with interlock',
    },
  ],
  tags: ['motor', 'reversible', 'interlock', 'forward-reverse'],
};

const motorStarDelta: LadderTemplate = {
  id: 'motor-star-delta',
  name: 'Star-Delta Starter',
  description: 'Star-delta motor starter with timer for reduced voltage starting. Automatic transition after delay.',
  category: 'motor-control',
  difficulty: 'advanced',
  rungs: [
    {
      elements: [
        // Main contactor with latching
        createBranch('start', 'branch-main', { x: 0, y: 0 }, { right: 'temp-1', bottom: 'temp-4' }),
        createContact('X0', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('X1', 'nc', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-5' }),
        createContact('Y0', 'no', { x: 1, y: 1 }, { left: 'temp-0', right: 'temp-5' }),
        createBranch('end', 'branch-main', { x: 3, y: 0 }, { left: 'temp-2', top: 'temp-3', right: 'temp-6' }),
        createCoil('Y0', 'output', { x: 4, y: 0 }, { left: 'temp-5' }),
        createTimer('T0', 'TON', 5000, { x: 5, y: 0 }, { left: 'temp-6' }),
      ],
      comment: 'Main contactor(Y0) with start/stop and transition timer',
    },
    {
      elements: [
        createContact('Y0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createContact('T0', 'nc', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createCoil('Y1', 'output', { x: 2, y: 0 }, { left: 'temp-1' }),
      ],
      comment: 'Star contactor(Y1) - active during startup',
    },
    {
      elements: [
        createContact('Y0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createContact('T0', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('Y1', 'nc', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-3' }),
        createCoil('Y2', 'output', { x: 3, y: 0 }, { left: 'temp-2' }),
      ],
      comment: 'Delta contactor(Y2) - active after timer',
    },
  ],
  tags: ['motor', 'star-delta', 'starter', 'reduced-voltage'],
};

// ============================================
// TIMER TEMPLATES (5)
// ============================================

const timerOnDelay: LadderTemplate = {
  id: 'timer-on-delay',
  name: 'On-Delay Timer (TON)',
  description: 'Timer that delays turning ON. Output activates after input stays true for the preset time.',
  category: 'timers',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createTimer('T0', 'TON', 3000, { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('T0', 'no', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-3' }),
        createCoil('Y0', 'output', { x: 3, y: 0 }, { left: 'temp-2' }),
      ],
      comment: 'Input(X0) -> Timer(T0) -> Delayed Output(Y0)',
    },
  ],
  tags: ['timer', 'on-delay', 'TON', 'delay'],
};

const timerOffDelay: LadderTemplate = {
  id: 'timer-off-delay',
  name: 'Off-Delay Timer (TOF)',
  description: 'Timer that delays turning OFF. Output stays ON for preset time after input goes false.',
  category: 'timers',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createTimer('T0', 'TOF', 5000, { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createCoil('Y0', 'output', { x: 2, y: 0 }, { left: 'temp-1' }),
      ],
      comment: 'Input(X0) -> Timer(T0) -> Extended Output(Y0)',
    },
  ],
  tags: ['timer', 'off-delay', 'TOF', 'extend'],
};

const timerPulse: LadderTemplate = {
  id: 'timer-pulse',
  name: 'Single Shot Pulse (TP)',
  description: 'Generates a fixed-duration pulse when triggered. Pulse width is independent of input duration.',
  category: 'timers',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createTimer('T0', 'TP', 2000, { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createCoil('Y0', 'output', { x: 2, y: 0 }, { left: 'temp-1' }),
      ],
      comment: 'Input(X0) -> Timer(T0) -> Pulse Output(Y0)',
    },
  ],
  tags: ['timer', 'pulse', 'TP', 'single-shot'],
};

const timerBlinker: LadderTemplate = {
  id: 'timer-blinker',
  name: 'Blinker/Flasher',
  description: 'Creates a blinking output using two timers. Adjustable ON and OFF times.',
  category: 'timers',
  difficulty: 'intermediate',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createContact('T1', 'nc', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createTimer('T0', 'TON', 500, { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-3' }),
        createCoil('Y0', 'output', { x: 3, y: 0 }, { left: 'temp-2' }),
      ],
      comment: 'Blink enable(X0) -> Timer(T0) ON phase -> Output(Y0)',
    },
    {
      elements: [
        createContact('T0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createTimer('T1', 'TON', 500, { x: 1, y: 0 }, { left: 'temp-0' }),
      ],
      comment: 'Timer(T1) OFF phase - creates oscillation',
    },
  ],
  tags: ['timer', 'blink', 'flash', 'oscillate'],
};

// Oscillator with latching
const timerOscillator: LadderTemplate = {
  id: 'timer-oscillator',
  name: 'Oscillator',
  description: 'Self-sustaining oscillator circuit. Generates continuous pulses after initial trigger.',
  category: 'timers',
  difficulty: 'intermediate',
  rungs: [
    {
      elements: [
        // Latching for M0
        createBranch('start', 'branch-osc', { x: 0, y: 0 }, { right: 'temp-1', bottom: 'temp-5' }),
        createContact('X0', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('T0', 'nc', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-6' }),
        createContact('M0', 'no', { x: 1, y: 1 }, { left: 'temp-0', right: 'temp-6' }),
        createBranch('end', 'branch-osc', { x: 3, y: 0 }, { left: 'temp-2', top: 'temp-4', right: 'temp-7' }),
        createCoil('M0', 'output', { x: 4, y: 0 }, { left: 'temp-6' }),
      ],
      comment: 'Oscillator enable(X0) -> Memory(M0)',
    },
    {
      elements: [
        createContact('M0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createTimer('T0', 'TON', 1000, { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('T0', 'no', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-3' }),
        createCoil('Y0', 'output', { x: 3, y: 0 }, { left: 'temp-2' }),
      ],
      comment: 'Timer(T0) -> Pulse Output(Y0)',
    },
  ],
  tags: ['timer', 'oscillator', 'pulse', 'periodic'],
};

// ============================================
// COUNTER TEMPLATES (3)
// ============================================

const counterCountUp: LadderTemplate = {
  id: 'counter-count-up',
  name: 'Count Up with Reset',
  description: 'Counter that increments on each trigger. Output activates when count reaches preset. Includes reset.',
  category: 'counters',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCounter('C0', 'CTU', 10, { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('C0', 'no', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-3' }),
        createCoil('Y0', 'output', { x: 3, y: 0 }, { left: 'temp-2' }),
      ],
      comment: 'Count input(X0) -> Counter(C0) -> Output(Y0)',
    },
    {
      elements: [
        createContact('X1', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCoil('C0', 'reset', { x: 1, y: 0 }, { left: 'temp-0' }),
      ],
      comment: 'Reset(X1) -> Counter Reset',
    },
  ],
  tags: ['counter', 'count-up', 'CTU', 'reset'],
};

const counterCountDown: LadderTemplate = {
  id: 'counter-count-down',
  name: 'Count Down',
  description: 'Counter that decrements from preset value. Output activates when count reaches zero.',
  category: 'counters',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCounter('C0', 'CTD', 5, { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('C0', 'no', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-3' }),
        createCoil('Y0', 'output', { x: 3, y: 0 }, { left: 'temp-2' }),
      ],
      comment: 'Count input(X0) -> Counter(C0) -> Output(Y0)',
    },
  ],
  tags: ['counter', 'count-down', 'CTD'],
};

const counterCascaded: LadderTemplate = {
  id: 'counter-cascaded',
  name: 'Cascaded Counters',
  description: 'Two counters in cascade for high-count applications. First counter triggers second counter.',
  category: 'counters',
  difficulty: 'intermediate',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCounter('C0', 'CTU', 10, { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('C0', 'no', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-3' }),
        createCounter('C1', 'CTU', 5, { x: 3, y: 0 }, { left: 'temp-2', right: 'temp-4' }),
        createContact('C1', 'no', { x: 4, y: 0 }, { left: 'temp-3', right: 'temp-5' }),
        createCoil('Y0', 'output', { x: 5, y: 0 }, { left: 'temp-4' }),
      ],
      comment: 'Cascaded counters: C0(10) * C1(5) = 50 counts',
    },
    {
      elements: [
        createContact('X1', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCoil('C0', 'reset', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createCoil('C1', 'reset', { x: 2, y: 0 }, { left: 'temp-1' }),
      ],
      comment: 'Reset(X1) -> Reset both counters',
    },
  ],
  tags: ['counter', 'cascaded', 'high-count', 'CTU'],
};

// ============================================
// LOGIC TEMPLATES (4)
// ============================================

const logicAnd: LadderTemplate = {
  id: 'logic-and',
  name: 'AND Logic (Series)',
  description: 'Series contacts - output requires ALL inputs to be true. Classic AND gate implementation.',
  category: 'logic',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createContact('X1', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('X2', 'no', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-3' }),
        createCoil('Y0', 'output', { x: 3, y: 0 }, { left: 'temp-2' }),
      ],
      comment: 'AND Logic: Y0 = X0 AND X1 AND X2',
    },
  ],
  tags: ['logic', 'AND', 'series', 'basic'],
};

// OR Logic with parallel branches
const logicOr: LadderTemplate = {
  id: 'logic-or',
  name: 'OR Logic (Parallel)',
  description: 'Parallel contacts - output requires ANY input to be true. Classic OR gate implementation.',
  category: 'logic',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createBranch('start', 'branch-or', { x: 0, y: 0 }, { right: 'temp-1', bottom: 'temp-2' }),
        createContact('X0', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-4' }),
        createContact('X1', 'no', { x: 1, y: 1 }, { left: 'temp-0', right: 'temp-5' }),
        createContact('X2', 'no', { x: 1, y: 2 }, { left: 'temp-0', right: 'temp-6' }),
        createBranch('end', 'branch-or', { x: 2, y: 0 }, { left: 'temp-1', top: 'temp-2', bottom: 'temp-3', right: 'temp-7' }),
        createCoil('Y0', 'output', { x: 3, y: 0 }, { left: 'temp-6' }),
      ],
      comment: 'OR Logic: Y0 = X0 OR X1 OR X2',
    },
  ],
  tags: ['logic', 'OR', 'parallel', 'basic'],
};

const logicSetReset: LadderTemplate = {
  id: 'logic-set-reset',
  name: 'Set/Reset Latch',
  description: 'SR latch using SET and RESET coils. SET turns ON and keeps ON, RESET turns OFF.',
  category: 'logic',
  difficulty: 'beginner',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCoil('M0', 'set', { x: 1, y: 0 }, { left: 'temp-0' }),
      ],
      comment: 'Set(X0) -> Set Memory(M0)',
    },
    {
      elements: [
        createContact('X1', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCoil('M0', 'reset', { x: 1, y: 0 }, { left: 'temp-0' }),
      ],
      comment: 'Reset(X1) -> Reset Memory(M0)',
    },
    {
      elements: [
        createContact('M0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCoil('Y0', 'output', { x: 1, y: 0 }, { left: 'temp-0' }),
      ],
      comment: 'Memory(M0) -> Output(Y0)',
    },
  ],
  tags: ['logic', 'set-reset', 'SR', 'latch', 'memory'],
};

const logicToggle: LadderTemplate = {
  id: 'logic-toggle',
  name: 'Toggle Flip-Flop',
  description: 'Toggle output on each button press using rising edge detection. State toggles between ON/OFF.',
  category: 'logic',
  difficulty: 'intermediate',
  rungs: [
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createContact('M1', 'nc', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createCoil('M0', 'output', { x: 2, y: 0 }, { left: 'temp-1' }),
      ],
      comment: 'Rising edge detection: X0 AND NOT M1 -> Pulse(M0)',
    },
    {
      elements: [
        createContact('X0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createCoil('M1', 'output', { x: 1, y: 0 }, { left: 'temp-0' }),
      ],
      comment: 'Memory for edge detection(M1)',
    },
    {
      elements: [
        createContact('M0', 'no', { x: 0, y: 0 }, { right: 'temp-1' }),
        createContact('Y0', 'nc', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createCoil('M2', 'output', { x: 2, y: 0 }, { left: 'temp-1' }),
      ],
      comment: 'Toggle logic: Pulse AND NOT Y0 -> Temp(M2)',
    },
    {
      elements: [
        createBranch('start', 'branch-tog', { x: 0, y: 0 }, { right: 'temp-1', bottom: 'temp-4' }),
        createContact('M0', 'no', { x: 1, y: 0 }, { left: 'temp-0', right: 'temp-2' }),
        createContact('Y0', 'no', { x: 2, y: 0 }, { left: 'temp-1', right: 'temp-5' }),
        createContact('M2', 'no', { x: 1, y: 1 }, { left: 'temp-0', right: 'temp-5' }),
        createBranch('end', 'branch-tog', { x: 3, y: 0 }, { left: 'temp-2', top: 'temp-3', right: 'temp-6' }),
        createCoil('Y0', 'output', { x: 4, y: 0 }, { left: 'temp-5' }),
      ],
      comment: 'Output toggle: Y0 = (Pulse AND Y0) OR M2',
    },
  ],
  tags: ['logic', 'toggle', 'flip-flop', 'rising-edge'],
};

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export const TEMPLATES: LadderTemplate[] = [
  // Motor Control
  motorStartStop,
  motorJog,
  motorReversible,
  motorStarDelta,
  // Timers
  timerOnDelay,
  timerOffDelay,
  timerPulse,
  timerBlinker,
  timerOscillator,
  // Counters
  counterCountUp,
  counterCountDown,
  counterCascaded,
  // Logic
  logicAnd,
  logicOr,
  logicSetReset,
  logicToggle,
];

// Get templates by category
export function getTemplatesByCategory(category: string): LadderTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

// Get template by ID
export function getTemplateById(id: string): LadderTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
