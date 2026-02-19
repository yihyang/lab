import { describe, it, expect } from 'vitest';
import { validateProject, getValidationSummary } from './validate';
import type { LadderProject } from '../schema/types';

describe('validateProject', () => {
  it('should return warning for empty project', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [],
    };

    const result = validateProject(project);
    expect(result.valid).toBe(true);
    expect(result.errors.some(e => e.message.includes('no rungs'))).toBe(true);
  });

  it('should return warning for empty rung', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [{ id: 'rung-1', elements: [], position: 0 }],
    };

    const result = validateProject(project);
    expect(result.errors.some(e => e.message.includes('empty'))).toBe(true);
  });

  it('should return error for element without variable', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [{
        id: 'rung-1',
        elements: [{
          id: 'elem-1',
          type: 'contact',
          variable: '',
          contactType: 'no',
          position: { x: 0, y: 0 },
          connections: {},
        }],
        position: 0,
      }],
    };

    const result = validateProject(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'error' && e.message.includes('no variable'))).toBe(true);
  });

  it('should return warning when coil is not last element', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [{
        id: 'rung-1',
        elements: [
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y0',
            coilType: 'output',
            position: { x: 0, y: 0 },
            connections: {},
          },
          {
            id: 'contact-1',
            type: 'contact',
            variable: 'X0',
            contactType: 'no',
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const result = validateProject(project);
    expect(result.errors.some(e => e.message.includes('should be the last element'))).toBe(true);
  });

  it('should return warning when rung does not end with output element', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [{
        id: 'rung-1',
        elements: [{
          id: 'contact-1',
          type: 'contact',
          variable: 'X0',
          contactType: 'no',
          position: { x: 0, y: 0 },
          connections: {},
        }],
        position: 0,
      }],
    };

    const result = validateProject(project);
    expect(result.errors.some(e => e.message.includes('output element'))).toBe(true);
  });

  it('should pass for valid ladder with contact and coil', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [{
        id: 'rung-1',
        elements: [
          {
            id: 'contact-1',
            type: 'contact',
            variable: 'X0',
            contactType: 'no',
            position: { x: 0, y: 0 },
            connections: { right: 'coil-1' },
          },
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y0',
            coilType: 'output',
            position: { x: 1, y: 0 },
            connections: { left: 'contact-1' },
          },
        ],
        position: 0,
      }],
    };

    const result = validateProject(project);
    expect(result.valid).toBe(true);
  });
});

describe('getValidationSummary', () => {
  it('should return "No issues found" when no errors', () => {
    const summary = getValidationSummary({ valid: true, errors: [] });
    expect(summary).toBe('No issues found');
  });

  it('should count errors and warnings correctly', () => {
    const result = {
      valid: false,
      errors: [
        { type: 'error' as const, message: 'Error 1' },
        { type: 'warning' as const, message: 'Warning 1' },
        { type: 'warning' as const, message: 'Warning 2' },
      ],
    };
    const summary = getValidationSummary(result);
    expect(summary).toBe('1 error, 2 warnings');
  });
});
