import { describe, it, expect } from 'vitest';
import {
  createContactElement,
  createCoilElement,
  createTimerElement,
  createCounterElement,
  createBranchElement,
} from './types';

describe('Element factory functions', () => {
  describe('createContactElement', () => {
    it('should create NO contact with correct properties', () => {
      const element = createContactElement('rung-1', { x: 0, y: 0 }, 'X0', 'no');

      expect(element.type).toBe('contact');
      expect(element.variable).toBe('X0');
      expect(element.contactType).toBe('no');
      expect(element.position).toEqual({ x: 0, y: 0 });
      expect(element.connections).toEqual({});
      expect(element.id).toBeDefined();
      expect(element.id.startsWith('contact-')).toBe(true);
    });

    it('should create NC contact with correct properties', () => {
      const element = createContactElement('rung-1', { x: 1, y: 0 }, 'X1', 'nc');

      expect(element.contactType).toBe('nc');
      expect(element.variable).toBe('X1');
    });
  });

  describe('createCoilElement', () => {
    it('should create output coil with correct properties', () => {
      const element = createCoilElement('rung-1', { x: 2, y: 0 }, 'Y0', 'output');

      expect(element.type).toBe('coil');
      expect(element.variable).toBe('Y0');
      expect(element.coilType).toBe('output');
      expect(element.position).toEqual({ x: 2, y: 0 });
    });

    it('should create set coil', () => {
      const element = createCoilElement('rung-1', { x: 0, y: 0 }, 'Y1', 'set');
      expect(element.coilType).toBe('set');
    });

    it('should create reset coil', () => {
      const element = createCoilElement('rung-1', { x: 0, y: 0 }, 'Y2', 'reset');
      expect(element.coilType).toBe('reset');
    });
  });

  describe('createTimerElement', () => {
    it('should create TON timer with default preset', () => {
      const element = createTimerElement('rung-1', { x: 1, y: 0 }, 'T0', 'TON');

      expect(element.type).toBe('timer');
      expect(element.variable).toBe('T0');
      expect(element.timerType).toBe('TON');
      expect(element.preset).toBe(1000);
    });

    it('should create TOF timer', () => {
      const element = createTimerElement('rung-1', { x: 0, y: 0 }, 'T1', 'TOF');
      expect(element.timerType).toBe('TOF');
    });

    it('should create TP timer', () => {
      const element = createTimerElement('rung-1', { x: 0, y: 0 }, 'T2', 'TP');
      expect(element.timerType).toBe('TP');
    });
  });

  describe('createCounterElement', () => {
    it('should create CTU counter with default preset', () => {
      const element = createCounterElement('rung-1', { x: 1, y: 0 }, 'C0', 'CTU');

      expect(element.type).toBe('counter');
      expect(element.variable).toBe('C0');
      expect(element.counterType).toBe('CTU');
      expect(element.preset).toBe(10);
    });

    it('should create CTD counter', () => {
      const element = createCounterElement('rung-1', { x: 0, y: 0 }, 'C1', 'CTD');
      expect(element.counterType).toBe('CTD');
    });
  });

  describe('createBranchElement', () => {
    it('should create OR start branch', () => {
      const element = createBranchElement('rung-1', { x: 0, y: 0 }, 'or-start');

      expect(element.type).toBe('branch');
      expect(element.branchType).toBe('or-start');
      expect(element.variable).toBe('');
    });

    it('should create OR end branch', () => {
      const element = createBranchElement('rung-1', { x: 0, y: 0 }, 'or-end');
      expect(element.branchType).toBe('or-end');
    });
  });
});
