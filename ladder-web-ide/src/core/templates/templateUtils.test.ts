// Tests for Template Utilities

import { describe, it, expect } from 'vitest';
import { generateUniqueIds, createProjectFromTemplate, getDifficultyColor, getDifficultyLabel } from './templateUtils';
import type { LadderTemplate, TemplateRung } from './types';

// Helper to wait for unique timestamp
const waitForUniqueTimestamp = () => new Promise(resolve => setTimeout(resolve, 10));

describe('templateUtils', () => {
  describe('generateUniqueIds', () => {
    it('should generate unique IDs for rung elements', () => {
      const templateRung: TemplateRung = {
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
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);

      expect(rung.id).toBe('test-rung');
      expect(rung.position).toBe(0);
      expect(rung.elements).toHaveLength(2);

      // Check that IDs are generated and unique
      expect(rung.elements[0].id).toMatch(/^contact-/);
      expect(rung.elements[1].id).toMatch(/^coil-/);
      expect(rung.elements[0].id).not.toBe(rung.elements[1].id);

      // Check that rungId is set
      expect(rung.elements[0].rungId).toBe('test-rung');
      expect(rung.elements[1].rungId).toBe('test-rung');
    });

    it('should handle empty elements array', () => {
      const templateRung: TemplateRung = {
        elements: [],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 1);

      expect(rung.id).toBe('test-rung');
      expect(rung.position).toBe(1);
      expect(rung.elements).toHaveLength(0);
    });

    it('should preserve comment', () => {
      const templateRung: TemplateRung = {
        elements: [],
        comment: 'Test comment',
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);

      expect(rung.comment).toBe('Test comment');
    });
  });

  describe('createProjectFromTemplate', () => {
    it('should create a project from a template', () => {
      const template: LadderTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
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

      const project = createProjectFromTemplate(template);

      expect(project.name).toBe('Test Template');
      expect(project.version).toBe('1.0');
      expect(project.rungs).toHaveLength(1);
      expect(project.rungs[0].elements).toHaveLength(2);
      expect(project.rungs[0].comment).toBe('Test rung');
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should create unique IDs each time', () => {
      const template: LadderTemplate = {
        id: 'test-template',
        name: 'Test',
        description: 'Test',
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
            ],
          },
        ],
        tags: [],
      };

      const project1 = createProjectFromTemplate(template);
      const project2 = createProjectFromTemplate(template);

      // IDs should be different
      expect(project1.rungs[0].id).not.toBe(project2.rungs[0].id);
      expect(project1.rungs[0].elements[0].id).not.toBe(project2.rungs[0].elements[0].id);
    });

    it('should handle multiple rungs', () => {
      const template: LadderTemplate = {
        id: 'multi-rung',
        name: 'Multi Rung',
        description: 'Test',
        category: 'logic',
        difficulty: 'beginner',
        rungs: [
          { elements: [{ type: 'contact', variable: 'X0', contactType: 'no', position: { x: 0, y: 0 }, connections: {} }] },
          { elements: [{ type: 'coil', variable: 'Y0', coilType: 'output', position: { x: 0, y: 0 }, connections: {} }] },
        ],
        tags: [],
      };

      const project = createProjectFromTemplate(template);

      expect(project.rungs).toHaveLength(2);
      expect(project.rungs[0].position).toBe(0);
      expect(project.rungs[1].position).toBe(1);
    });
  });

  describe('getDifficultyColor', () => {
    it('should return green for beginner', () => {
      expect(getDifficultyColor('beginner')).toContain('green');
    });

    it('should return yellow for intermediate', () => {
      expect(getDifficultyColor('intermediate')).toContain('yellow');
    });

    it('should return red for advanced', () => {
      expect(getDifficultyColor('advanced')).toContain('red');
    });

    it('should return gray for unknown', () => {
      expect(getDifficultyColor('unknown')).toContain('gray');
    });
  });

  describe('getDifficultyLabel', () => {
    it('should capitalize difficulty', () => {
      expect(getDifficultyLabel('beginner')).toBe('Beginner');
      expect(getDifficultyLabel('intermediate')).toBe('Intermediate');
      expect(getDifficultyLabel('advanced')).toBe('Advanced');
    });
  });

  describe('Connection mapping', () => {
    it('should map temp-id connections to generated element IDs', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'contact',
            variable: 'X0',
            contactType: 'no',
            position: { x: 0, y: 0 },
            connections: { right: 'temp-1' }, // Points to next element
          },
          {
            type: 'coil',
            variable: 'Y0',
            coilType: 'output',
            position: { x: 1, y: 0 },
            connections: { left: 'temp-0' }, // Points to previous element
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);

      // Element 0's right connection should point to element 1's generated ID
      expect(rung.elements[0].connections.right).toBe(rung.elements[1].id);
      // Element 1's left connection should point to element 0's generated ID
      expect(rung.elements[1].connections.left).toBe(rung.elements[0].id);
    });

    it('should handle branch elements with connections', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'branch',
            variable: '',
            branchType: 'start',
            branchId: 'branch-0',
            position: { x: 0, y: 0 },
            connections: { right: 'temp-1', bottom: 'temp-2' },
          },
          {
            type: 'contact',
            variable: 'X0',
            contactType: 'no',
            position: { x: 1, y: 0 },
            connections: { left: 'temp-0', right: 'temp-3' },
          },
          {
            type: 'contact',
            variable: 'Y0',
            contactType: 'no',
            position: { x: 1, y: 1 },
            connections: { left: 'temp-0', right: 'temp-3' },
          },
          {
            type: 'branch',
            variable: '',
            branchType: 'end',
            branchId: 'branch-0',
            position: { x: 2, y: 0 },
            connections: { left: 'temp-1', top: 'temp-2', right: 'temp-4' },
          },
          {
            type: 'coil',
            variable: 'Y0',
            coilType: 'output',
            position: { x: 3, y: 0 },
            connections: { left: 'temp-3' },
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);

      // Branch start right connects to X0
      expect(rung.elements[0].connections.right).toBe(rung.elements[1].id);
      // Branch start bottom connects to Y0 (latching contact)
      expect(rung.elements[0].connections.bottom).toBe(rung.elements[2].id);
      // Branch end right connects to coil
      expect(rung.elements[3].connections.right).toBe(rung.elements[4].id);
    });

    it('should preserve element positions', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'contact',
            variable: 'X0',
            contactType: 'no',
            position: { x: 5, y: 2 },
            connections: {},
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);
      expect(rung.elements[0].position).toEqual({ x: 5, y: 2 });
    });
  });

  describe('Branch element handling', () => {
    it('should generate branch elements with correct types', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'branch',
            variable: '',
            branchType: 'start',
            branchId: 'branch-0',
            position: { x: 0, y: 0 },
            connections: {},
          },
          {
            type: 'branch',
            variable: '',
            branchType: 'end',
            branchId: 'branch-0',
            position: { x: 1, y: 0 },
            connections: {},
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);

      expect(rung.elements[0].type).toBe('branch');
      expect((rung.elements[0] as any).branchType).toBe('start');
      expect(rung.elements[1].type).toBe('branch');
      expect((rung.elements[1] as any).branchType).toBe('end');
    });

    it('should preserve branchId', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'branch',
            variable: '',
            branchType: 'start',
            branchId: 'my-custom-branch-id',
            position: { x: 0, y: 0 },
            connections: {},
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);
      expect((rung.elements[0] as any).branchId).toBe('my-custom-branch-id');
    });
  });

  describe('Timer and Counter elements', () => {
    it('should handle timer elements with preset', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'timer',
            variable: 'T0',
            timerType: 'TON',
            preset: 5000,
            position: { x: 0, y: 0 },
            connections: {},
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);

      expect(rung.elements[0].type).toBe('timer');
      expect((rung.elements[0] as any).timerType).toBe('TON');
      expect((rung.elements[0] as any).preset).toBe(5000);
    });

    it('should handle counter elements with preset', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'counter',
            variable: 'C0',
            counterType: 'CTU',
            preset: 100,
            position: { x: 0, y: 0 },
            connections: {},
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);

      expect(rung.elements[0].type).toBe('counter');
      expect((rung.elements[0] as any).counterType).toBe('CTU');
      expect((rung.elements[0] as any).preset).toBe(100);
    });
  });

  describe('SET/RESET coil types', () => {
    it('should preserve SET coil type', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'coil',
            variable: 'M0',
            coilType: 'set',
            position: { x: 0, y: 0 },
            connections: {},
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);
      expect((rung.elements[0] as any).coilType).toBe('set');
    });

    it('should preserve RESET coil type', () => {
      const templateRung: TemplateRung = {
        elements: [
          {
            type: 'coil',
            variable: 'M0',
            coilType: 'reset',
            position: { x: 0, y: 0 },
            connections: {},
          },
        ],
      };

      const rung = generateUniqueIds(templateRung, 'test-rung', 0);
      expect((rung.elements[0] as any).coilType).toBe('reset');
    });
  });
});
