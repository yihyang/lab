import type { LadderProject, LadderElement } from '../schema/types';

export interface ValidationError {
  type: 'error' | 'warning';
  elementId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a ladder project for common issues
 */
export function validateProject(project: LadderProject): ValidationResult {
  const errors: ValidationError[] = [];

  // Check each rung
  project.rungs.forEach((rung, rungIndex) => {
    // Check for empty rungs
    if (rung.elements.length === 0) {
      errors.push({
        type: 'warning',
        message: `Rung ${rungIndex + 1} is empty`,
      });
      return;
    }

    // Track used variables to detect duplicates
    const variableMap = new Map<string, LadderElement[]>();

    rung.elements.forEach((element) => {
      // Check for empty variable names
      if (!element.variable || element.variable.trim() === '') {
        if (element.type !== 'branch') {
          errors.push({
            type: 'error',
            elementId: element.id,
            message: `Element at position ${element.position.x} has no variable assigned`,
          });
        }
      }

      // Track variables for duplicate detection
      if (element.variable) {
        const existing = variableMap.get(element.variable) || [];
        existing.push(element);
        variableMap.set(element.variable, existing);
      }

      // Check for unconnected elements (except first/last in rung)
      const hasConnections = Object.values(element.connections).some(c => c !== undefined);
      if (!hasConnections && rung.elements.length > 1) {
        errors.push({
          type: 'warning',
          elementId: element.id,
          message: `Element ${element.variable} is not connected to other elements`,
        });
      }
    });

    // Check for duplicate coil variables (coils should be unique)
    variableMap.forEach((elements, variable) => {
      const coils = elements.filter(e => e.type === 'coil');
      if (coils.length > 1) {
        errors.push({
          type: 'error',
          message: `Multiple coils use the same variable "${variable}" - this may cause conflicts`,
        });
      }
    });

    // Sort elements by position to check order
    const sortedElements = [...rung.elements].sort((a, b) => a.position.x - b.position.x);

    // Check for coils before other elements (invalid ladder logic)
    const coilIndices = sortedElements
      .map((el, idx) => ({ el, idx }))
      .filter(({ el }) => el.type === 'coil');

    coilIndices.forEach(({ el, idx }) => {
      if (idx < sortedElements.length - 1) {
        const elementsAfter = sortedElements.slice(idx + 1);
        const hasNonCoilAfter = elementsAfter.some(e => e.type !== 'coil');
        if (hasNonCoilAfter) {
          errors.push({
            type: 'warning',
            elementId: el.id,
            message: `Rung ${rungIndex + 1}: Coil "${el.variable}" should be the last element on the rung`,
          });
        }
      }
    });

    // Check if rung ends with an output element (coil, timer, or counter)
    const lastElement = sortedElements[sortedElements.length - 1];
    if (lastElement) {
      const outputTypes = ['coil', 'timer', 'counter'];
      if (!outputTypes.includes(lastElement.type)) {
        errors.push({
          type: 'warning',
          elementId: lastElement.id,
          message: `Rung ${rungIndex + 1}: Should end with an output element (coil, timer, or counter)`,
        });
      }
    }
  });

  // Check for project-level issues
  if (project.rungs.length === 0) {
    errors.push({
      type: 'warning',
      message: 'Project has no rungs',
    });
  }

  return {
    valid: !errors.some(e => e.type === 'error'),
    errors,
  };
}

/**
 * Get a summary of validation issues for display
 */
export function getValidationSummary(result: ValidationResult): string {
  const errorCount = result.errors.filter(e => e.type === 'error').length;
  const warningCount = result.errors.filter(e => e.type === 'warning').length;

  if (errorCount === 0 && warningCount === 0) {
    return 'No issues found';
  }

  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}
