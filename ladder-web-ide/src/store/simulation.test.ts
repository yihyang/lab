import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from '../store/useStore';
import type { LadderProject } from '../schema/types';

describe('Simulation State', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.getState().resetSimulation();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Parallel branch evaluation', () => {
    it('should evaluate parallel paths with OR logic', () => {
      // Create a rung with parallel branches:
      // |--[X0]--+--[Y0]--|
      // |        |
      // |--[X1]--+
      const project: LadderProject = {
        name: 'Test',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'rung-1',
          elements: [
            {
              id: 'branch-start',
              type: 'branch',
              branchType: 'start',
              branchId: 'branch-0',
              position: { x: 0, y: 0 },
              connections: { right: 'contact-x0', bottom: 'contact-x1' },
            } as any,
            {
              id: 'contact-x0',
              type: 'contact',
              variable: 'X0',
              contactType: 'no',
              position: { x: 1, y: 0 },
              connections: { right: 'branch-end' },
            },
            {
              id: 'contact-x1',
              type: 'contact',
              variable: 'X1',
              contactType: 'no',
              position: { x: 1, y: 1 },
              connections: { right: 'branch-end' },
            },
            {
              id: 'branch-end',
              type: 'branch',
              branchType: 'end',
              branchId: 'branch-0',
              position: { x: 2, y: 0 },
              connections: { right: 'coil-y0' },
            } as any,
            {
              id: 'coil-y0',
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

      const { setProject, toggleInput, stepSimulation } = useStore.getState();
      setProject(project);

      // Initially Y0 should be OFF
      stepSimulation();
      expect(useStore.getState().simulation.outputs['Y0']).toBeFalsy();

      // Turn on X0 - Y0 should turn ON
      toggleInput('X0');
      stepSimulation();
      expect(useStore.getState().simulation.outputs['Y0']).toBe(true);

      // Turn off X0, turn on X1 - Y0 should stay ON (OR logic)
      toggleInput('X0');
      toggleInput('X1');
      stepSimulation();
      expect(useStore.getState().simulation.outputs['Y0']).toBe(true);

      // Turn off X1 - Y0 should turn OFF
      toggleInput('X1');
      stepSimulation();
      expect(useStore.getState().simulation.outputs['Y0']).toBe(false);
    });

    it('should handle latching circuit with parallel branch', () => {
      // Standard start/stop with latching:
      // |--[X0]--+--[X1]--(Y0)--|
      // |        |
      // |--[Y0]--+
      const project: LadderProject = {
        name: 'Test',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'rung-1',
          elements: [
            {
              id: 'branch-start',
              type: 'branch',
              branchType: 'start',
              branchId: 'branch-0',
              position: { x: 0, y: 0 },
              connections: { right: 'contact-x0', bottom: 'contact-y0-latch' },
            } as any,
            {
              id: 'contact-x0',
              type: 'contact',
              variable: 'X0',
              contactType: 'no',
              position: { x: 1, y: 0 },
              connections: { right: 'branch-end' },
            },
            {
              id: 'contact-y0-latch',
              type: 'contact',
              variable: 'Y0',
              contactType: 'no',
              position: { x: 1, y: 1 },
              connections: { right: 'branch-end' },
            },
            {
              id: 'branch-end',
              type: 'branch',
              branchType: 'end',
              branchId: 'branch-0',
              position: { x: 2, y: 0 },
              connections: { right: 'contact-x1' },
            } as any,
            {
              id: 'contact-x1',
              type: 'contact',
              variable: 'X1',
              contactType: 'nc',
              position: { x: 3, y: 0 },
              connections: { right: 'coil-y0' },
            },
            {
              id: 'coil-y0',
              type: 'coil',
              variable: 'Y0',
              coilType: 'output',
              position: { x: 4, y: 0 },
              connections: {},
            },
          ],
          position: 0,
        }],
      };

      const { setProject, toggleInput, stepSimulation } = useStore.getState();
      setProject(project);

      // Initially Y0 should be OFF
      stepSimulation();
      expect(useStore.getState().simulation.outputs['Y0']).toBeFalsy();

      // Press X0 (Start) - Y0 should turn ON
      toggleInput('X0');
      stepSimulation();
      expect(useStore.getState().simulation.outputs['Y0']).toBe(true);

      // Release X0 - Y0 should stay ON (latching via Y0 contact)
      toggleInput('X0');
      stepSimulation();
      expect(useStore.getState().simulation.outputs['Y0']).toBe(true);

      // Press X1 (Stop) - Y0 should turn OFF (NC contact opens)
      toggleInput('X1');
      stepSimulation();
      expect(useStore.getState().simulation.outputs['Y0']).toBe(false);
    });
  });

  describe('SET/RESET coils with memory bits', () => {
    it('should SET memory bit M0 and keep it ON', () => {
      const project: LadderProject = {
        name: 'Test',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'rung-1',
          elements: [
            {
              id: 'contact-x0',
              type: 'contact',
              variable: 'X0',
              contactType: 'no',
              position: { x: 0, y: 0 },
              connections: { right: 'coil-m0-set' },
            },
            {
              id: 'coil-m0-set',
              type: 'coil',
              variable: 'M0',
              coilType: 'set',
              position: { x: 1, y: 0 },
              connections: {},
            },
          ],
          position: 0,
        }],
      };

      const { setProject, toggleInput, stepSimulation } = useStore.getState();
      setProject(project);

      // Press X0 to SET M0
      toggleInput('X0');
      stepSimulation();
      expect(useStore.getState().simulation.internalBits['M0']).toBe(true);

      // Release X0 - M0 should stay ON (SET is latching)
      toggleInput('X0');
      stepSimulation();
      expect(useStore.getState().simulation.internalBits['M0']).toBe(true);
    });

    it('should RESET memory bit M0', () => {
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
                id: 'contact-x0',
                type: 'contact',
                variable: 'X0',
                contactType: 'no',
                position: { x: 0, y: 0 },
                connections: { right: 'coil-m0-set' },
              },
              {
                id: 'coil-m0-set',
                type: 'coil',
                variable: 'M0',
                coilType: 'set',
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
                id: 'contact-x1',
                type: 'contact',
                variable: 'X1',
                contactType: 'no',
                position: { x: 0, y: 0 },
                connections: { right: 'coil-m0-reset' },
              },
              {
                id: 'coil-m0-reset',
                type: 'coil',
                variable: 'M0',
                coilType: 'reset',
                position: { x: 1, y: 0 },
                connections: {},
              },
            ],
            position: 1,
          },
        ],
      };

      const { setProject, toggleInput, stepSimulation } = useStore.getState();
      setProject(project);

      // SET M0
      toggleInput('X0');
      stepSimulation();
      expect(useStore.getState().simulation.internalBits['M0']).toBe(true);

      // RESET M0
      toggleInput('X0');
      toggleInput('X1');
      stepSimulation();
      expect(useStore.getState().simulation.internalBits['M0']).toBe(false);
    });

    it('should use memory bit to control output', () => {
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
                id: 'contact-x0',
                type: 'contact',
                variable: 'X0',
                contactType: 'no',
                position: { x: 0, y: 0 },
                connections: { right: 'coil-m0-set' },
              },
              {
                id: 'coil-m0-set',
                type: 'coil',
                variable: 'M0',
                coilType: 'set',
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
                id: 'contact-m0',
                type: 'contact',
                variable: 'M0',
                contactType: 'no',
                position: { x: 0, y: 0 },
                connections: { right: 'coil-y0' },
              },
              {
                id: 'coil-y0',
                type: 'coil',
                variable: 'Y0',
                coilType: 'output',
                position: { x: 1, y: 0 },
                connections: {},
              },
            ],
            position: 1,
          },
        ],
      };

      const { setProject, toggleInput, stepSimulation } = useStore.getState();
      setProject(project);

      // SET M0
      toggleInput('X0');
      stepSimulation();

      // Y0 should follow M0
      expect(useStore.getState().simulation.outputs['Y0']).toBe(true);
    });
  });

  describe('Initial state', () => {
    it('should have correct initial simulation state', () => {
      const { simulation } = useStore.getState();
      expect(simulation.running).toBe(false);
      expect(simulation.speed).toBe('medium');
      expect(simulation.cycleCount).toBe(0);
      expect(simulation.inputs).toEqual({});
      expect(simulation.outputs).toEqual({});
      expect(simulation.timers).toEqual({});
      expect(simulation.counters).toEqual({});
      expect(simulation.powerFlow).toEqual({});
    });
  });

  describe('Speed control', () => {
    it('should set simulation speed to slow', () => {
      const { setSimulationSpeed } = useStore.getState();
      setSimulationSpeed('slow');
      expect(useStore.getState().simulation.speed).toBe('slow');
    });

    it('should set simulation speed to fast', () => {
      const { setSimulationSpeed } = useStore.getState();
      setSimulationSpeed('fast');
      expect(useStore.getState().simulation.speed).toBe('fast');
    });

    it('should preserve other state when changing speed', () => {
      const { setSimulationSpeed, toggleInput } = useStore.getState();
      toggleInput('X0');
      setSimulationSpeed('slow');
      expect(useStore.getState().simulation.inputs['X0']).toBe(true);
      expect(useStore.getState().simulation.speed).toBe('slow');
    });
  });

  describe('Cycle counter', () => {
    it('should increment cycle count on each step', () => {
      const { stepSimulation } = useStore.getState();
      expect(useStore.getState().simulation.cycleCount).toBe(0);
      stepSimulation();
      expect(useStore.getState().simulation.cycleCount).toBe(1);
      stepSimulation();
      expect(useStore.getState().simulation.cycleCount).toBe(2);
    });

    it('should reset cycle count when resetSimulation is called', () => {
      const { stepSimulation, resetSimulation } = useStore.getState();
      stepSimulation();
      stepSimulation();
      stepSimulation();
      expect(useStore.getState().simulation.cycleCount).toBe(3);
      resetSimulation();
      expect(useStore.getState().simulation.cycleCount).toBe(0);
    });
  });

  describe('Input toggling', () => {
    it('should toggle input from false to true', () => {
      const { toggleInput } = useStore.getState();
      expect(useStore.getState().simulation.inputs['X0']).toBeUndefined();
      toggleInput('X0');
      expect(useStore.getState().simulation.inputs['X0']).toBe(true);
    });

    it('should toggle input from true to false', () => {
      const { toggleInput } = useStore.getState();
      toggleInput('X0');
      toggleInput('X0');
      expect(useStore.getState().simulation.inputs['X0']).toBe(false);
    });

    it('should toggle multiple inputs independently', () => {
      const { toggleInput } = useStore.getState();
      toggleInput('X0');
      toggleInput('X1');
      toggleInput('X2');
      toggleInput('X1'); // Toggle X1 off
      expect(useStore.getState().simulation.inputs['X0']).toBe(true);
      expect(useStore.getState().simulation.inputs['X1']).toBe(false);
      expect(useStore.getState().simulation.inputs['X2']).toBe(true);
    });
  });

  describe('Continuous simulation', () => {
    it('should set running to true when startSimulation is called', () => {
      const { startSimulation } = useStore.getState();
      startSimulation();
      expect(useStore.getState().simulation.running).toBe(true);
    });

    it('should set running to false when stopSimulation is called', () => {
      const { startSimulation, stopSimulation } = useStore.getState();
      startSimulation();
      stopSimulation();
      expect(useStore.getState().simulation.running).toBe(false);
    });

    it('should auto-step at medium speed (200ms) when running', () => {
      const { startSimulation } = useStore.getState();
      startSimulation();

      // Initially no cycles
      expect(useStore.getState().simulation.cycleCount).toBe(0);

      // Advance 199ms - still no cycles
      vi.advanceTimersByTime(199);
      expect(useStore.getState().simulation.cycleCount).toBe(0);

      // Advance to 200ms - 1 cycle
      vi.advanceTimersByTime(1);
      expect(useStore.getState().simulation.cycleCount).toBe(1);

      // Advance to 400ms - 2 cycles
      vi.advanceTimersByTime(200);
      expect(useStore.getState().simulation.cycleCount).toBe(2);
    });

    it('should auto-step at slow speed (500ms) when speed is slow', () => {
      const { setSimulationSpeed, startSimulation } = useStore.getState();
      setSimulationSpeed('slow');
      startSimulation();

      vi.advanceTimersByTime(499);
      expect(useStore.getState().simulation.cycleCount).toBe(0);

      vi.advanceTimersByTime(1);
      expect(useStore.getState().simulation.cycleCount).toBe(1);
    });

    it('should auto-step at fast speed (50ms) when speed is fast', () => {
      const { setSimulationSpeed, startSimulation } = useStore.getState();
      setSimulationSpeed('fast');
      startSimulation();

      vi.advanceTimersByTime(49);
      expect(useStore.getState().simulation.cycleCount).toBe(0);

      vi.advanceTimersByTime(1);
      expect(useStore.getState().simulation.cycleCount).toBe(1);
    });

    it('should change interval speed while running', () => {
      const { startSimulation, setSimulationSpeed } = useStore.getState();
      startSimulation();

      // Medium speed: 200ms per cycle
      vi.advanceTimersByTime(400);
      expect(useStore.getState().simulation.cycleCount).toBe(2);

      // Change to fast: 50ms per cycle
      setSimulationSpeed('fast');
      vi.advanceTimersByTime(100);
      expect(useStore.getState().simulation.cycleCount).toBe(4); // 2 + 2 more
    });

    it('should stop auto-stepping when stopSimulation is called', () => {
      const { startSimulation, stopSimulation } = useStore.getState();
      startSimulation();

      vi.advanceTimersByTime(400);
      expect(useStore.getState().simulation.cycleCount).toBe(2);

      stopSimulation();

      vi.advanceTimersByTime(1000);
      expect(useStore.getState().simulation.cycleCount).toBe(2); // No more cycles
    });
  });

  describe('Timer simulation', () => {
    it('should track timer elapsed time', () => {
      const project: LadderProject = {
        name: 'Test',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'rung-1',
          elements: [
            {
              id: 'timer-1',
              type: 'timer',
              variable: 'T0',
              timerType: 'TON',
              preset: 1000,
              position: { x: 0, y: 0 },
              connections: {},
            } as any,
          ],
          position: 0,
        }],
      };

      const { setProject, stepSimulation } = useStore.getState();
      setProject(project);

      stepSimulation();
      expect(useStore.getState().simulation.timers['T0']?.elapsed).toBe(100);

      stepSimulation();
      expect(useStore.getState().simulation.timers['T0']?.elapsed).toBe(200);
    });

    it('should set timer done when elapsed >= preset', () => {
      const project: LadderProject = {
        name: 'Test',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'rung-1',
          elements: [
            {
              id: 'timer-1',
              type: 'timer',
              variable: 'T0',
              timerType: 'TON',
              preset: 300,
              position: { x: 0, y: 0 },
              connections: {},
            } as any,
          ],
          position: 0,
        }],
      };

      const { setProject, stepSimulation } = useStore.getState();
      setProject(project);

      stepSimulation();
      stepSimulation();
      expect(useStore.getState().simulation.timers['T0']?.done).toBe(false);

      stepSimulation();
      expect(useStore.getState().simulation.timers['T0']?.elapsed).toBe(300);
      expect(useStore.getState().simulation.timers['T0']?.done).toBe(true);
    });
  });

  describe('Counter simulation', () => {
    it('should increment counter on each cycle with power', () => {
      const project: LadderProject = {
        name: 'Test',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'rung-1',
          elements: [
            {
              id: 'counter-1',
              type: 'counter',
              variable: 'C0',
              counterType: 'CTU',
              preset: 5,
              position: { x: 0, y: 0 },
              connections: {},
            } as any,
          ],
          position: 0,
        }],
      };

      const { setProject, stepSimulation } = useStore.getState();
      setProject(project);

      stepSimulation();
      expect(useStore.getState().simulation.counters['C0']?.current).toBe(1);

      stepSimulation();
      expect(useStore.getState().simulation.counters['C0']?.current).toBe(2);
    });

    it('should set counter done when current >= preset', () => {
      const project: LadderProject = {
        name: 'Test',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'rung-1',
          elements: [
            {
              id: 'counter-1',
              type: 'counter',
              variable: 'C0',
              counterType: 'CTU',
              preset: 3,
              position: { x: 0, y: 0 },
              connections: {},
            } as any,
          ],
          position: 0,
        }],
      };

      const { setProject, stepSimulation } = useStore.getState();
      setProject(project);

      stepSimulation();
      stepSimulation();
      expect(useStore.getState().simulation.counters['C0']?.done).toBe(false);

      stepSimulation();
      expect(useStore.getState().simulation.counters['C0']?.current).toBe(3);
      expect(useStore.getState().simulation.counters['C0']?.done).toBe(true);
    });
  });
});
