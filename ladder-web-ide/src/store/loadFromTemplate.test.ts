// Tests for loadFromTemplate store action

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import type { LadderTemplate } from '../core/templates/types';

describe('loadFromTemplate', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.getState().resetSimulation();
    useStore.getState().setProject({
      name: 'Empty',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rungs: [],
    });
  });

  describe('Basic loading', () => {
    it('should load a template into the store', () => {
      const template: LadderTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [
          {
            elements: [
              {
                type: 'contact',
                variable: 'X0',
                contactType: 'no',
                position: { x: 0, y: 0 },
                connections: {},
              },
              {
                type: 'coil',
                variable: 'Y0',
                coilType: 'output',
                position: { x: 1, y: 0 },
                connections: {},
              },
            ],
            comment: 'Test rung',
          },
        ],
        tags: ['test'],
      };

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      const { project } = useStore.getState();
      expect(project.name).toBe('Test Template');
      expect(project.rungs).toHaveLength(1);
      expect(project.rungs[0].elements).toHaveLength(2);
    });

    it('should clear selection after loading', () => {
      const template: LadderTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [{ elements: [] }],
        tags: [],
      };

      // First select something
      useStore.getState().setProject({
        name: 'Old',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'r1',
          elements: [{ id: 'e1', type: 'contact', variable: 'X0', contactType: 'no', position: { x: 0, y: 0 }, connections: {}, rungId: 'r1' }],
          position: 0,
        }],
      });

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      expect(useStore.getState().selectedElementId).toBeNull();
      expect(useStore.getState().selectedRungId).toBeNull();
    });

    it('should mark project as dirty', () => {
      const template: LadderTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [{ elements: [] }],
        tags: [],
      };

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      expect(useStore.getState().isDirty).toBe(true);
    });

    it('should reset simulation state', () => {
      // First run some simulation
      const { toggleInput, stepSimulation } = useStore.getState();
      toggleInput('X0');
      stepSimulation();

      const template: LadderTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [{ elements: [] }],
        tags: [],
      };

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      const { simulation } = useStore.getState();
      expect(simulation.cycleCount).toBe(0);
      expect(simulation.inputs).toEqual({});
      expect(simulation.outputs).toEqual({});
    });
  });

  describe('ID generation', () => {
    it('should generate unique IDs for each element', () => {
      const template: LadderTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [
          {
            elements: [
              { type: 'contact', variable: 'X0', contactType: 'no', position: { x: 0, y: 0 }, connections: {} },
              { type: 'contact', variable: 'X1', contactType: 'no', position: { x: 1, y: 0 }, connections: {} },
              { type: 'coil', variable: 'Y0', coilType: 'output', position: { x: 2, y: 0 }, connections: {} },
            ],
          },
        ],
        tags: [],
      };

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      const { project } = useStore.getState();
      const ids = project.rungs[0].elements.map(e => e.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate IDs with correct prefixes', () => {
      const template: LadderTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [
          {
            elements: [
              { type: 'contact', variable: 'X0', contactType: 'no', position: { x: 0, y: 0 }, connections: {} },
              { type: 'coil', variable: 'Y0', coilType: 'output', position: { x: 1, y: 0 }, connections: {} },
              { type: 'timer', variable: 'T0', timerType: 'TON', preset: 1000, position: { x: 2, y: 0 }, connections: {} },
              { type: 'counter', variable: 'C0', counterType: 'CTU', preset: 10, position: { x: 3, y: 0 }, connections: {} },
              { type: 'branch', branchType: 'start', branchId: 'b1', position: { x: 4, y: 0 }, connections: {} },
            ],
          },
        ],
        tags: [],
      };

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      const { project } = useStore.getState();
      const elements = project.rungs[0].elements;

      expect(elements[0].id).toMatch(/^contact-/);
      expect(elements[1].id).toMatch(/^coil-/);
      expect(elements[2].id).toMatch(/^timer-/);
      expect(elements[3].id).toMatch(/^counter-/);
      expect(elements[4].id).toMatch(/^branch-/);
    });
  });

  describe('Branch element handling', () => {
    it('should load templates with branch elements', () => {
      const template: LadderTemplate = {
        id: 'test-branch',
        name: 'Test Branch',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [
          {
            elements: [
              { type: 'branch', branchType: 'start', branchId: 'branch-0', position: { x: 0, y: 0 }, connections: { right: 'temp-1', bottom: 'temp-2' } },
              { type: 'contact', variable: 'X0', contactType: 'no', position: { x: 1, y: 0 }, connections: { right: 'temp-3' } },
              { type: 'contact', variable: 'Y0', contactType: 'no', position: { x: 1, y: 1 }, connections: { right: 'temp-3' } },
              { type: 'branch', branchType: 'end', branchId: 'branch-0', position: { x: 2, y: 0 }, connections: { right: 'temp-4' } },
              { type: 'coil', variable: 'Y0', coilType: 'output', position: { x: 3, y: 0 }, connections: {} },
            ],
          },
        ],
        tags: [],
      };

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      const { project } = useStore.getState();
      expect(project.rungs[0].elements).toHaveLength(5);

      const branchElements = project.rungs[0].elements.filter(e => e.type === 'branch');
      expect(branchElements).toHaveLength(2);
    });
  });

  describe('SET/RESET coil handling', () => {
    it('should preserve SET coil type for memory bits', () => {
      const template: LadderTemplate = {
        id: 'test-sr',
        name: 'Test SR',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [
          {
            elements: [
              { type: 'contact', variable: 'X0', contactType: 'no', position: { x: 0, y: 0 }, connections: {} },
              { type: 'coil', variable: 'M0', coilType: 'set', position: { x: 1, y: 0 }, connections: {} },
            ],
          },
          {
            elements: [
              { type: 'contact', variable: 'X1', contactType: 'no', position: { x: 0, y: 0 }, connections: {} },
              { type: 'coil', variable: 'M0', coilType: 'reset', position: { x: 1, y: 0 }, connections: {} },
            ],
          },
        ],
        tags: [],
      };

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      const { project } = useStore.getState();
      expect(project.rungs).toHaveLength(2);

      const setCoil = project.rungs[0].elements.find(e => e.type === 'coil');
      const resetCoil = project.rungs[1].elements.find(e => e.type === 'coil');

      expect((setCoil as any)?.coilType).toBe('set');
      expect((resetCoil as any)?.coilType).toBe('reset');
    });
  });

  describe('Undo/Redo reset', () => {
    it('should reset undo/redo history when loading template', () => {
      // First make some changes
      const initialProject = {
        name: 'Initial',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'r1',
          elements: [],
          position: 0,
        }],
      };

      useStore.getState().setProject(initialProject);
      useStore.getState().addRung(); // This creates undo history

      const template: LadderTemplate = {
        id: 'test',
        name: 'Template',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [{ elements: [] }],
        tags: [],
      };

      const { loadFromTemplate } = useStore.getState();
      loadFromTemplate(template);

      expect(useStore.getState().canUndo).toBe(false);
      expect(useStore.getState().canRedo).toBe(false);
    });
  });
});
