import { describe, it, expect } from 'vitest';
import {
  calculateRightRailX,
  MIN_RIGHT_RAIL_X,
  ELEMENT_START_X,
  ELEMENT_WIDTH,
  RIGHT_RAIL_PADDING,
} from './Canvas';
import type { LadderProject } from '../../core/schema/types';

describe('calculateRightRailX', () => {
  it('should return MIN_RIGHT_RAIL_X for empty project', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0.0',
      rungs: [],
    };

    expect(calculateRightRailX(project)).toBe(MIN_RIGHT_RAIL_X);
  });

  it('should return MIN_RIGHT_RAIL_X for project with empty rungs', () => {
    const project: LadderProject = {
      name: 'Test',
      version: '1.0.0',
      rungs: [
        { id: 'rung-1', elements: [], comment: '' },
        { id: 'rung-2', elements: [], comment: '' },
      ],
    };

    expect(calculateRightRailX(project)).toBe(MIN_RIGHT_RAIL_X);
  });

  it('should return MIN_RIGHT_RAIL_X for elements that fit within minimum width', () => {
    // Element at x=3: 150 + (3+1)*100 + 150 = 700 = MIN_RIGHT_RAIL_X
    const project: LadderProject = {
      name: 'Test',
      version: '1.0.0',
      rungs: [
        {
          id: 'rung-1',
          elements: [
            {
              id: 'elem-1',
              type: 'contact',
              rungId: 'rung-1',
              position: { x: 0, y: 0 },
              variable: 'X0',
              contactType: 'normallyOpen',
              connections: {},
            },
            {
              id: 'elem-2',
              type: 'contact',
              rungId: 'rung-1',
              position: { x: 1, y: 0 },
              variable: 'X1',
              contactType: 'normallyOpen',
              connections: {},
            },
            {
              id: 'elem-3',
              type: 'coil',
              rungId: 'rung-1',
              position: { x: 2, y: 0 },
              variable: 'Y0',
              coilType: 'output',
              connections: {},
            },
          ],
          comment: '',
        },
      ],
    };

    expect(calculateRightRailX(project)).toBe(MIN_RIGHT_RAIL_X);
  });

  it('should expand right rail for wide templates (Star-Delta case)', () => {
    // Element at x=5 (like Star-Delta Starter): 150 + (5+1)*100 + 150 = 900
    const project: LadderProject = {
      name: 'Test',
      version: '1.0.0',
      rungs: [
        {
          id: 'rung-1',
          elements: [
            {
              id: 'elem-1',
              type: 'branch',
              rungId: 'rung-1',
              position: { x: 0, y: 0 },
              variable: '',
              branchType: 'orStart',
              connections: {},
            },
            {
              id: 'elem-2',
              type: 'contact',
              rungId: 'rung-1',
              position: { x: 1, y: 0 },
              variable: 'X0',
              contactType: 'normallyOpen',
              connections: {},
            },
            {
              id: 'elem-3',
              type: 'contact',
              rungId: 'rung-1',
              position: { x: 2, y: 0 },
              variable: 'X1',
              contactType: 'normallyClosed',
              connections: {},
            },
            {
              id: 'elem-4',
              type: 'contact',
              rungId: 'rung-1',
              position: { x: 3, y: 0 },
              variable: 'Y0',
              contactType: 'normallyOpen',
              connections: {},
            },
            {
              id: 'elem-5',
              type: 'coil',
              rungId: 'rung-1',
              position: { x: 4, y: 0 },
              variable: 'Y0',
              coilType: 'output',
              connections: {},
            },
            {
              id: 'elem-6',
              type: 'timer',
              rungId: 'rung-1',
              position: { x: 5, y: 0 },
              variable: 'T0',
              timerType: 'TON',
              presetValue: 5000,
              connections: {},
            },
          ],
          comment: '',
        },
      ],
    };

    const expected = ELEMENT_START_X + 6 * ELEMENT_WIDTH + RIGHT_RAIL_PADDING;
    expect(calculateRightRailX(project)).toBe(expected); // 150 + 600 + 150 = 900
    expect(calculateRightRailX(project)).toBeGreaterThan(MIN_RIGHT_RAIL_X);
  });

  it('should find max x across multiple rungs', () => {
    // Rung 1 has element at x=2, Rung 2 has element at x=6
    // Should use x=6 for calculation: 150 + (6+1)*100 + 150 = 1000
    const project: LadderProject = {
      name: 'Test',
      version: '1.0.0',
      rungs: [
        {
          id: 'rung-1',
          elements: [
            {
              id: 'elem-1',
              type: 'contact',
              rungId: 'rung-1',
              position: { x: 0, y: 0 },
              variable: 'X0',
              contactType: 'normallyOpen',
              connections: {},
            },
            {
              id: 'elem-2',
              type: 'coil',
              rungId: 'rung-1',
              position: { x: 2, y: 0 },
              variable: 'Y0',
              coilType: 'output',
              connections: {},
            },
          ],
          comment: '',
        },
        {
          id: 'rung-2',
          elements: [
            {
              id: 'elem-3',
              type: 'contact',
              rungId: 'rung-2',
              position: { x: 4, y: 0 },
              variable: 'X1',
              contactType: 'normallyOpen',
              connections: {},
            },
            {
              id: 'elem-4',
              type: 'coil',
              rungId: 'rung-2',
              position: { x: 6, y: 0 },
              variable: 'Y1',
              coilType: 'output',
              connections: {},
            },
          ],
          comment: '',
        },
      ],
    };

    const expected = ELEMENT_START_X + 7 * ELEMENT_WIDTH + RIGHT_RAIL_PADDING;
    expect(calculateRightRailX(project)).toBe(expected); // 150 + 700 + 150 = 1000
  });

  it('should handle very wide templates', () => {
    // Element at x=10: 150 + (10+1)*100 + 150 = 1400
    const project: LadderProject = {
      name: 'Test',
      version: '1.0.0',
      rungs: [
        {
          id: 'rung-1',
          elements: [
            {
              id: 'elem-1',
              type: 'coil',
              rungId: 'rung-1',
              position: { x: 10, y: 0 },
              variable: 'Y0',
              coilType: 'output',
              connections: {},
            },
          ],
          comment: '',
        },
      ],
    };

    const expected = ELEMENT_START_X + 11 * ELEMENT_WIDTH + RIGHT_RAIL_PADDING;
    expect(calculateRightRailX(project)).toBe(expected); // 150 + 1100 + 150 = 1400
  });
});

describe('Canvas constants', () => {
  it('should have correct constant values', () => {
    expect(MIN_RIGHT_RAIL_X).toBe(700);
    expect(ELEMENT_START_X).toBe(150);
    expect(ELEMENT_WIDTH).toBe(100);
    expect(RIGHT_RAIL_PADDING).toBe(150);
  });

  it('should ensure minimum right rail provides enough space for basic ladder', () => {
    // With MIN_RIGHT_RAIL_X = 700, and ELEMENT_START_X = 150, ELEMENT_WIDTH = 100
    // We have space for: (700 - 150 - 150) / 100 = 4 elements
    // Plus some margin from RIGHT_RAIL_PADDING
    const availableSpace = MIN_RIGHT_RAIL_X - ELEMENT_START_X - RIGHT_RAIL_PADDING;
    const maxElements = Math.floor(availableSpace / ELEMENT_WIDTH);
    expect(maxElements).toBeGreaterThanOrEqual(3); // At least 3 elements should fit
  });
});
