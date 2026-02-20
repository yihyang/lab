import { describe, it, expect } from 'vitest';
import { generateIL } from './il-keyence';
import type { LadderProject } from '../schema/types';

describe('generateIL', () => {
  it('should return empty string for empty project', () => {
    const project: LadderProject = {
      name: 'Empty Project',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [],
    };

    const output = generateIL(project);
    expect(output).toBe('');
  });

  it('should return empty string for project with empty rungs', () => {
    const project: LadderProject = {
      name: 'Empty Rungs',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [
        { id: 'rung-1', elements: [], position: 0 },
        { id: 'rung-2', elements: [], position: 1 },
      ],
    };

    const output = generateIL(project);
    expect(output).toBe('');
  });

  it('should generate IL for single contact and coil', () => {
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
            connections: {},
          },
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y0',
            coilType: 'output',
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    expect(output).toBe('LD X0\nOUT Y0');
  });

  it('should generate IL for multiple series contacts', () => {
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
            connections: {},
          },
          {
            id: 'contact-2',
            type: 'contact',
            variable: 'X1',
            contactType: 'no',
            position: { x: 1, y: 0 },
            connections: {},
          },
          {
            id: 'contact-3',
            type: 'contact',
            variable: 'X2',
            contactType: 'no',
            position: { x: 2, y: 0 },
            connections: {},
          },
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y0',
            coilType: 'output',
            position: { x: 3, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    expect(output).toBe('LD X0\nAND X1\nAND X2\nOUT Y0');
  });

  it('should generate LD-NOT for NC contact at start', () => {
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
            contactType: 'nc',
            position: { x: 0, y: 0 },
            connections: {},
          },
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y0',
            coilType: 'output',
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    expect(output).toBe('LD-NOT X0\nOUT Y0');
  });

  it('should generate AND-NOT for NC contact in series', () => {
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
            connections: {},
          },
          {
            id: 'contact-2',
            type: 'contact',
            variable: 'X1',
            contactType: 'nc',
            position: { x: 1, y: 0 },
            connections: {},
          },
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y0',
            coilType: 'output',
            position: { x: 2, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    expect(output).toBe('LD X0\nAND-NOT X1\nOUT Y0');
  });

  it('should generate SET for set coil', () => {
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
            connections: {},
          },
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y0',
            coilType: 'set',
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    expect(output).toBe('LD X0\nSET Y0');
  });

  it('should generate RST for reset coil', () => {
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
            connections: {},
          },
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y0',
            coilType: 'reset',
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    expect(output).toBe('LD X0\nRST Y0');
  });

  it('should generate TMR for timer with converted preset', () => {
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
            connections: {},
          },
          {
            id: 'timer-1',
            type: 'timer',
            variable: 'T0',
            timerType: 'TON',
            preset: 1000,
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    // Timer preset is converted to 100ms units (1000ms -> 10)
    expect(output).toBe('LD X0\nTMR T0 10');
  });

  it('should generate CNT for counter', () => {
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
            connections: {},
          },
          {
            id: 'counter-1',
            type: 'counter',
            variable: 'C0',
            counterType: 'CTU',
            preset: 10,
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    expect(output).toBe('LD X0\nCNT C0 10');
  });

  it('should generate IL for multiple rungs', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [
        {
          id: 'rung-1',
          elements: [
            {
              id: 'contact-1',
              type: 'contact',
              variable: 'X0',
              contactType: 'no',
              position: { x: 0, y: 0 },
              connections: {},
            },
            {
              id: 'coil-1',
              type: 'coil',
              variable: 'Y0',
              coilType: 'output',
              position: { x: 1, y: 0 },
              connections: {},
            },
          ],
          position: 0,
        },
        {
          id: 'rung-2',
          elements: [
            {
              id: 'contact-2',
              type: 'contact',
              variable: 'X1',
              contactType: 'no',
              position: { x: 0, y: 0 },
              connections: {},
            },
            {
              id: 'coil-2',
              type: 'coil',
              variable: 'Y1',
              coilType: 'output',
              position: { x: 1, y: 0 },
              connections: {},
            },
          ],
          position: 1,
        },
      ],
    };

    const output = generateIL(project);
    expect(output).toBe('LD X0\nOUT Y0\nLD X1\nOUT Y1');
  });

  it('should sort elements by position before generating IL', () => {
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
            position: { x: 2, y: 0 },
            connections: {},
          },
          {
            id: 'contact-1',
            type: 'contact',
            variable: 'X0',
            contactType: 'no',
            position: { x: 0, y: 0 },
            connections: {},
          },
          {
            id: 'contact-2',
            type: 'contact',
            variable: 'X1',
            contactType: 'no',
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    // Should be ordered by position.x, not by element order in array
    expect(output).toBe('LD X0\nAND X1\nOUT Y0');
  });

  it('should handle various variable prefixes', () => {
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
            connections: {},
          },
          {
            id: 'contact-2',
            type: 'contact',
            variable: 'M100',
            contactType: 'no',
            position: { x: 1, y: 0 },
            connections: {},
          },
          {
            id: 'coil-1',
            type: 'coil',
            variable: 'Y5',
            coilType: 'output',
            position: { x: 2, y: 0 },
            connections: {},
          },
        ],
        position: 0,
      }],
    };

    const output = generateIL(project);
    expect(output).toBe('LD X0\nAND M100\nOUT Y5');
  });
});
