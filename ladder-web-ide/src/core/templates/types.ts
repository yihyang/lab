// Template Types for Ladder Web IDE

import type { LadderElement } from '../schema/types';

export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type TemplateCategory = 'motor-control' | 'timers' | 'counters' | 'logic';

export interface TemplateCategoryInfo {
  id: TemplateCategory;
  name: string;
  description: string;
  icon: string;
}

export interface TemplateRung {
  elements: Omit<LadderElement, 'id' | 'rungId'>[];
  comment?: string;
}

export interface LadderTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  rungs: TemplateRung[];
  tags: string[];
}

// For template preview generation
export interface TemplatePreviewElement {
  type: 'contact' | 'coil' | 'timer' | 'counter' | 'branch';
  variable: string;
  contactType?: 'no' | 'nc';
  coilType?: 'output' | 'set' | 'reset';
  timerType?: 'TON' | 'TOF' | 'TP';
  counterType?: 'CTU' | 'CTD';
  branchType?: 'start' | 'end' | 'junction';
}
