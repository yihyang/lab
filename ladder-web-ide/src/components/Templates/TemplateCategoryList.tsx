// Template Category List Component

import { TEMPLATE_CATEGORIES } from '../../core/templates/categories';
import type { TemplateCategory } from '../../core/templates/types';

interface TemplateCategoryListProps {
  selectedCategory: TemplateCategory | 'all';
  onSelectCategory: (category: TemplateCategory | 'all') => void;
  templateCounts: Record<TemplateCategory | 'all', number>;
}

export function TemplateCategoryList({
  selectedCategory,
  onSelectCategory,
  templateCounts,
}: TemplateCategoryListProps) {
  return (
    <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1 mb-1">
        Categories
      </h3>
      <nav className="space-y-1">
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between ${
            selectedCategory === 'all'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span>All Templates</span>
          <span className="text-xs text-gray-400">{templateCounts['all']}</span>
        </button>
        {TEMPLATE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between ${
              selectedCategory === category.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-base">{category.icon}</span>
              <span>{category.name}</span>
            </span>
            <span className="text-xs text-gray-400">{templateCounts[category.id]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
