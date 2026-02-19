import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import type { LadderProject } from '../schema/types';

describe('Clipboard State', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.getState().resetSimulation();
    useStore.setState({ clipboard: null, selectedElementId: null });
  });

  describe('Copy element', () => {
    it('should copy selected element to clipboard', () => {
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
              rungId: 'rung-1',
            },
          ],
          position: 0,
        }],
      };

      const { setProject, setSelectedElement, copyElement } = useStore.getState();
      setProject(project);
      setSelectedElement('contact-1');
      copyElement();

      expect(useStore.getState().clipboard).not.toBeNull();
      expect(useStore.getState().clipboard?.id).toBe('contact-1');
      expect(useStore.getState().clipboard?.variable).toBe('X0');
    });

    it('should not copy when no element is selected', () => {
      const { copyElement } = useStore.getState();
      copyElement();
      expect(useStore.getState().clipboard).toBeNull();
    });
  });

  describe('Paste element', () => {
    it('should paste element from clipboard', () => {
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
              rungId: 'rung-1',
            },
          ],
          position: 0,
        }],
      };

      const { setProject, setSelectedElement, copyElement, pasteElement } = useStore.getState();
      setProject(project);
      setSelectedElement('contact-1');
      copyElement();
      pasteElement('rung-1');

      const rung = useStore.getState().project.rungs[0];
      expect(rung.elements.length).toBe(2);
      expect(rung.elements[1].variable).toBe('X0');
      expect(rung.elements[1].id).not.toBe('contact-1'); // New ID
    });

    it('should not paste when clipboard is empty', () => {
      const project: LadderProject = {
        name: 'Test',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rungs: [{
          id: 'rung-1',
          elements: [],
          position: 0,
        }],
      };

      const { setProject, pasteElement } = useStore.getState();
      setProject(project);
      pasteElement('rung-1');

      expect(useStore.getState().project.rungs[0].elements.length).toBe(0);
    });

    it('should paste to first rung if no target specified', () => {
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
              rungId: 'rung-1',
            },
          ],
          position: 0,
        }],
      };

      const { setProject, setSelectedElement, copyElement, pasteElement } = useStore.getState();
      setProject(project);
      setSelectedElement('coil-1');
      copyElement();
      pasteElement(); // No target rung specified

      const rung = useStore.getState().project.rungs[0];
      expect(rung.elements.length).toBe(2);
    });
  });

  describe('Duplicate element', () => {
    it('should duplicate selected element', () => {
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
              rungId: 'rung-1',
            },
          ],
          position: 0,
        }],
      };

      const { setProject, setSelectedElement, duplicateElement } = useStore.getState();
      setProject(project);
      setSelectedElement('timer-1');
      duplicateElement();

      const rung = useStore.getState().project.rungs[0];
      expect(rung.elements.length).toBe(2);
      expect(rung.elements[1].variable).toBe('T0');
      expect(rung.elements[1].id).not.toBe('timer-1');
    });

    it('should not duplicate when no element is selected', () => {
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
              preset: 10,
              position: { x: 0, y: 0 },
              connections: {},
              rungId: 'rung-1',
            },
          ],
          position: 0,
        }],
      };

      const { setProject, duplicateElement } = useStore.getState();
      setProject(project);
      duplicateElement();

      expect(useStore.getState().project.rungs[0].elements.length).toBe(1);
    });
  });
});
