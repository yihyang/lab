// Template Picker Dialog Component

import { useState, useEffect, useMemo } from 'react';
import type { LadderTemplate, TemplateCategory } from '../../core/templates/types';
import { TEMPLATES, getTemplatesByCategory } from '../../core/templates/templates';
import { TemplateCategoryList } from './TemplateCategoryList';
import { TemplateCard } from './TemplateCard';
import { TemplatePreview } from './TemplatePreview';

interface TemplatePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: LadderTemplate) => void;
  onSelectEmpty: () => void;
}

export function TemplatePickerDialog({
  isOpen,
  onClose,
  onSelectTemplate,
  onSelectEmpty,
}: TemplatePickerDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<LadderTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let templates = selectedCategory === 'all' ? TEMPLATES : getTemplatesByCategory(selectedCategory);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  // Calculate template counts
  const templateCounts = useMemo(() => {
    const counts = {
      'all': TEMPLATES.length,
      'motor-control': getTemplatesByCategory('motor-control').length,
      'timers': getTemplatesByCategory('timers').length,
      'counters': getTemplatesByCategory('counters').length,
      'logic': getTemplatesByCategory('logic').length,
    } as Record<TemplateCategory | 'all', number>;
    return counts;
  }, []);

  // Reset selection when dialog opens
  // This is a valid pattern for resetting modal state
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplate(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Project from Template</h2>
            <p className="text-sm text-gray-500">Choose a template to start your project</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* Categories Sidebar */}
          <TemplateCategoryList
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            templateCounts={templateCounts}
          />

          {/* Templates Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No templates found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate?.id === template.id}
                    onClick={() => setSelectedTemplate(template)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            {selectedTemplate ? (
              <TemplatePreview template={selectedTemplate} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center">
                <div>
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Select a template to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-lg">
          <button
            onClick={() => {
              onSelectEmpty();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Empty Project
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleUseTemplate}
              disabled={!selectedTemplate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
