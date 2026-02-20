import type { LadderProject, LadderElement, ContactElement, CoilElement, TimerElement, CounterElement } from '../schema/types';
import { isContactElement, isCoilElement, isTimerElement, isCounterElement } from '../schema/types';

/**
 * Keyence KV Series Instruction List Generator
 *
 * Generates clean IL (Instruction List) from ladder project.
 * Output is raw instructions without comments, ready for copy/paste.
 *
 * Supported instructions:
 * - LD, LD-NOT (load contact)
 * - AND, AND-NOT (series contact)
 * - OR, OR-NOT (parallel contact)
 * - OUT (output coil)
 * - SET, RST (set/reset coil)
 * - TMR (timer)
 * - CNT (counter)
 */
export function generateIL(project: LadderProject): string {
  const lines: string[] = [];

  // Check for empty project
  const hasElements = project.rungs.some(rung => rung.elements.length > 0);
  if (!hasElements) {
    return '';
  }

  // Process each rung
  project.rungs.forEach((rung) => {
    const instructions = generateRungInstructions(rung.elements);
    lines.push(...instructions);
  });

  return lines.join('\n');
}

function generateRungInstructions(elements: LadderElement[]): string[] {
  const instructions: string[] = [];
  let isFirstElement = true;

  // Sort elements by position for correct order (left to right)
  const sortedElements = [...elements].sort((a, b) => a.position.x - b.position.x);

  for (const element of sortedElements) {
    if (isContactElement(element)) {
      instructions.push(...generateContactInstruction(element, isFirstElement));
      isFirstElement = false;
    } else if (isCoilElement(element)) {
      instructions.push(...generateCoilInstruction(element));
      isFirstElement = true; // Reset for next rung logic
    } else if (isTimerElement(element)) {
      instructions.push(...generateTimerInstruction(element));
      isFirstElement = true;
    } else if (isCounterElement(element)) {
      instructions.push(...generateCounterInstruction(element));
      isFirstElement = true;
    }
  }

  return instructions;
}

function generateContactInstruction(element: ContactElement, isFirst: boolean): string[] {
  const variable = formatVariable(element.variable);

  if (element.contactType === 'no') {
    // Normally Open contact
    if (isFirst) {
      return [`LD ${variable}`];
    } else {
      return [`AND ${variable}`];
    }
  } else {
    // Normally Closed contact
    if (isFirst) {
      return [`LD-NOT ${variable}`];
    } else {
      return [`AND-NOT ${variable}`];
    }
  }
}

function generateCoilInstruction(element: CoilElement): string[] {
  const variable = formatVariable(element.variable);

  switch (element.coilType) {
    case 'output':
      return [`OUT ${variable}`];
    case 'set':
      return [`SET ${variable}`];
    case 'reset':
      return [`RST ${variable}`];
    default:
      return [`OUT ${variable}`];
  }
}

function generateTimerInstruction(element: TimerElement): string[] {
  const variable = formatVariable(element.variable);
  // TMR T0 1000 (timer number, preset in 100ms units)
  // Convert ms to 100ms units (Keyence standard)
  const preset = Math.ceil(element.preset / 100);
  return [`TMR ${variable} ${preset}`];
}

function generateCounterInstruction(element: CounterElement): string[] {
  const variable = formatVariable(element.variable);
  // CNT C0 10 (counter number, preset)
  return [`CNT ${variable} ${element.preset}`];
}

/**
 * Format variable name for Keyence format
 * Keyence uses: X (inputs), Y (outputs), M (internal), T (timers), C (counters)
 */
function formatVariable(variable: string): string {
  // Keep the variable as-is if it already has a proper prefix
  if (/^[XYMLTCD]\d+$/.test(variable)) {
    return variable;
  }

  // If no prefix, assume it's an internal bit (M)
  if (/^\d+$/.test(variable)) {
    return `M${variable}`;
  }

  return variable;
}
