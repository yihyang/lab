// Tests for Template Definitions

import { describe, it, expect } from 'vitest';
import { TEMPLATES, getTemplatesByCategory } from './templates';
import type { TemplateCategory } from './types';

describe('Template Definitions', () => {
  describe('All templates', () => {
    it('should have 16 templates', () => {
      expect(TEMPLATES).toHaveLength(16);
    });

    it('should have unique IDs', () => {
      const ids = TEMPLATES.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid required fields', () => {
      TEMPLATES.forEach(template => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(template.difficulty).toBeTruthy();
        expect(template.rungs).toBeInstanceOf(Array);
        expect(template.tags).toBeInstanceOf(Array);
      });
    });

    it('should have valid difficulty levels', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      TEMPLATES.forEach(template => {
        expect(validDifficulties).toContain(template.difficulty);
      });
    });

    it('should have valid categories', () => {
      const validCategories: TemplateCategory[] = ['motor-control', 'timers', 'counters', 'logic'];
      TEMPLATES.forEach(template => {
        expect(validCategories).toContain(template.category);
      });
    });
  });

  describe('Template elements', () => {
    it('should have valid element types in all templates', () => {
      const validTypes = ['contact', 'coil', 'timer', 'counter', 'branch'];
      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            expect(validTypes).toContain(element.type);
          });
        });
      });
    });

    it('should have variables for contacts and coils', () => {
      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            if (element.type === 'contact' || element.type === 'coil') {
              expect(element.variable).toBeTruthy();
              expect(element.variable.length).toBeGreaterThan(0);
            }
          });
        });
      });
    });

    it('should have valid contact types', () => {
      const validContactTypes = ['no', 'nc'];
      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            if (element.type === 'contact') {
              expect(validContactTypes).toContain((element as any).contactType);
            }
          });
        });
      });
    });

    it('should have valid coil types', () => {
      const validCoilTypes = ['output', 'set', 'reset'];
      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            if (element.type === 'coil') {
              expect(validCoilTypes).toContain((element as any).coilType);
            }
          });
        });
      });
    });

    it('should have branch elements with branchType and branchId', () => {
      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            if (element.type === 'branch') {
              expect((element as any).branchType).toBeDefined();
              expect(['start', 'end']).toContain((element as any).branchType);
              expect((element as any).branchId).toBeTruthy();
            }
          });
        });
      });
    });
  });

  describe('Template connections', () => {
    it('should have temp-id connections as integers', () => {
      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach((element, index) => {
            Object.values(element.connections || {}).forEach(connValue => {
              if (typeof connValue === 'string' && connValue.startsWith('temp-')) {
                const connIndex = parseInt(connValue.replace('temp-', ''));
                expect(Number.isInteger(connIndex)).toBe(true);
                expect(connIndex).toBeGreaterThanOrEqual(0);
              }
            });
          });
        });
      });
    });

    it('should have matching branch start/end pairs', () => {
      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          const branchStarts = rung.elements.filter(
            el => el.type === 'branch' && (el as any).branchType === 'start'
          );
          const branchEnds = rung.elements.filter(
            el => el.type === 'branch' && (el as any).branchType === 'end'
          );

          // Each branch start should have a matching end
          branchStarts.forEach(start => {
            const matchingEnd = branchEnds.find(
              end => (end as any).branchId === (start as any).branchId
            );
            expect(matchingEnd).toBeDefined();
          });
        });
      });
    });
  });

  describe('Category filtering', () => {
    it('should return motor-control templates', () => {
      const templates = getTemplatesByCategory('motor-control');
      expect(templates.length).toBe(4);
      templates.forEach(t => expect(t.category).toBe('motor-control'));
    });

    it('should return timer templates', () => {
      const templates = getTemplatesByCategory('timers');
      expect(templates.length).toBe(5);
      templates.forEach(t => expect(t.category).toBe('timers'));
    });

    it('should return counter templates', () => {
      const templates = getTemplatesByCategory('counters');
      expect(templates.length).toBe(3);
      templates.forEach(t => expect(t.category).toBe('counters'));
    });

    it('should return logic templates', () => {
      const templates = getTemplatesByCategory('logic');
      expect(templates.length).toBe(4);
      templates.forEach(t => expect(t.category).toBe('logic'));
    });
  });

  describe('Specific templates', () => {
    it('motor-start-stop should have correct structure', () => {
      const template = TEMPLATES.find(t => t.id === 'motor-start-stop');
      expect(template).toBeDefined();
      expect(template!.rungs).toHaveLength(1);
      expect(template!.rungs[0].elements.length).toBe(6); // Branch start, X0, Y0, branch end, X1, coil

      // Check for branch elements
      const branchElements = template!.rungs[0].elements.filter(e => e.type === 'branch');
      expect(branchElements).toHaveLength(2);
    });

    it('set-reset-latch should use SET and RESET coils', () => {
      const template = TEMPLATES.find(t => t.id === 'logic-set-reset');
      expect(template).toBeDefined();

      const coils = template!.rungs.flatMap(r => r.elements.filter(e => e.type === 'coil'));
      const coilTypes = coils.map(c => (c as any).coilType);

      expect(coilTypes).toContain('set');
      expect(coilTypes).toContain('reset');
    });

    it('timer templates should have valid timer types', () => {
      const timerTemplates = TEMPLATES.filter(t => t.category === 'timers');
      const validTimerTypes = ['TON', 'TOF', 'TP'];

      timerTemplates.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            if (element.type === 'timer') {
              expect(validTimerTypes).toContain((element as any).timerType);
            }
          });
        });
      });
    });
  });

  describe('Variable naming conventions', () => {
    it('should use valid PLC variable prefixes', () => {
      const validPrefixes = ['X', 'Y', 'M', 'T', 'C'];
      const variablePattern = /^[XYMTC]\d+$/;

      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            if (element.variable) {
              const prefix = element.variable.charAt(0);
              expect(validPrefixes).toContain(prefix);
            }
          });
        });
      });
    });

    it('should have contacts with various prefixes for different purposes', () => {
      // Count contacts by prefix
      const prefixCounts: Record<string, number> = { X: 0, Y: 0, M: 0, T: 0, C: 0 };

      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            if (element.type === 'contact' && element.variable) {
              const prefix = element.variable.charAt(0);
              prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
            }
          });
        });
      });

      // X should be used for inputs
      expect(prefixCounts['X']).toBeGreaterThan(0);
      // Y is often used for latching contacts
      expect(prefixCounts['Y']).toBeGreaterThan(0);
    });

    it('should have coils primarily use Y, M, C, or T prefixes', () => {
      const coilPrefixes: string[] = [];

      TEMPLATES.forEach(template => {
        template.rungs.forEach(rung => {
          rung.elements.forEach(element => {
            if (element.type === 'coil' && element.variable) {
              coilPrefixes.push(element.variable.charAt(0));
            }
          });
        });
      });

      // Coils can use Y (output), M (memory), C (counter done), T (timer done)
      const validCoilPrefixes = ['Y', 'M', 'C', 'T'];
      coilPrefixes.forEach(prefix => {
        expect(validCoilPrefixes).toContain(prefix);
      });
    });
  });
});
