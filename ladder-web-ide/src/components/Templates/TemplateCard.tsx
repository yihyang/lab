// Template Card Component

import type { LadderTemplate } from '../../core/templates/types';
import { getDifficultyColor, getDifficultyLabel } from '../../core/templates/templateUtils';

interface TemplateCardProps {
  template: LadderTemplate;
  isSelected: boolean;
  onClick: () => void;
}

export function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(
            template.difficulty
          )}`}
        >
          {getDifficultyLabel(template.difficulty)}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {template.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
