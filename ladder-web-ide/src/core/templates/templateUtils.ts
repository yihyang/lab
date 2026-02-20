// Template Utility Functions

import type { LadderProject, Rung, LadderElement } from '../schema/types';
import type { LadderTemplate, TemplateRung } from './types';

// Generate unique ID (matching store pattern)
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ID mapping for regenerating connections
type IdMapping = Record<string, string>;

/**
 * Generate unique IDs for a rung and its elements
 * Updates element connections to use the new IDs
 * Preserves original positions (x, y) for parallel branch layout
 */
export function generateUniqueIds(
  templateRung: TemplateRung,
  rungId: string,
  positionIndex: number
): Rung {
  const idMapping: IdMapping = {};

  // First pass: generate new IDs for all elements
  const elementsWithNewIds = templateRung.elements.map((element, index) => {
    const newId = generateId(element.type);
    const tempId = `temp-${index}`;
    idMapping[tempId] = newId;

    // Preserve original position for branch layout
    const originalPosition = element.position || { x: index, y: 0 };

    return {
      ...element,
      id: newId,
      rungId,
      position: originalPosition,
    } as LadderElement;
  });

  // Second pass: update connections to use new IDs
  const elementsWithUpdatedConnections = elementsWithNewIds.map((element, index) => {
    const originalConn = templateRung.elements[index].connections || {};
    const newConnections: LadderElement['connections'] = {};

    // Map each connection direction
    for (const direction of ['left', 'right', 'top', 'bottom'] as const) {
      const connValue = originalConn[direction];
      if (connValue) {
        // Check if it's a temp-id reference (e.g., "temp-0")
        if (connValue.startsWith('temp-')) {
          const connectedIndex = parseInt(connValue.replace('temp-', ''));
          if (!isNaN(connectedIndex) && connectedIndex >= 0 && connectedIndex < elementsWithNewIds.length) {
            newConnections[direction] = elementsWithNewIds[connectedIndex].id;
          }
        } else if (connValue === 'left-rail' || connValue === 'right-rail') {
          // Keep special rail references as-is (they're handled by the canvas)
          // Don't add to connections - these are implicit
        } else {
          // Keep other connection values as-is (could be element IDs from branch elements)
          newConnections[direction] = connValue;
        }
      }
    }

    return {
      ...element,
      connections: newConnections,
    };
  });

  return {
    id: rungId,
    elements: elementsWithUpdatedConnections,
    comment: templateRung.comment,
    position: positionIndex,
  };
}

/**
 * Create a full LadderProject from a template
 */
export function createProjectFromTemplate(template: LadderTemplate): LadderProject {
  const now = new Date().toISOString();
  const rungs: Rung[] = [];

  // Generate unique rungs with regenerated IDs
  template.rungs.forEach((templateRung, index) => {
    const rungId = generateId('rung');
    const rung = generateUniqueIds(templateRung, rungId, index);
    rungs.push(rung);
  });

  return {
    name: template.name,
    version: '1.0',
    createdAt: now,
    updatedAt: now,
    rungs,
  };
}

/**
 * Get difficulty badge color
 */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'advanced':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get difficulty label
 */
export function getDifficultyLabel(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}
