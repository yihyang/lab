// Template Category Definitions

import type { TemplateCategoryInfo, TemplateCategory } from './types';

export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  {
    id: 'motor-control',
    name: 'Motor Control',
    description: 'Motor starting, stopping, and control patterns',
    icon: '⚡',
  },
  {
    id: 'timers',
    name: 'Timers',
    description: 'On-delay, off-delay, and pulse timer patterns',
    icon: '⏱️',
  },
  {
    id: 'counters',
    name: 'Counters',
    description: 'Count up, count down, and cascaded counter patterns',
    icon: '🔢',
  },
  {
    id: 'logic',
    name: 'Logic',
    description: 'AND, OR, and flip-flop logic patterns',
    icon: '🔀',
  },
];

export const TEMPLATE_CATEGORY_IDS: TemplateCategory[] = [
  'motor-control',
  'timers',
  'counters',
  'logic',
];
