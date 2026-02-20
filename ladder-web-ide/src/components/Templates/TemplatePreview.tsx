// Template Preview Component - Mini Ladder Diagram

import type { LadderTemplate, TemplateRung } from '../../core/templates/types';

interface TemplatePreviewProps {
  template: LadderTemplate;
}

// Type for template element (without id and rungId)
type TemplateElement = TemplateRung['elements'][number];

// Get symbol for element type
function getElementSymbol(element: TemplateElement): string {
  const type = element.type;
  switch (type) {
    case 'contact':
      return 'contactType' in element && element.contactType === 'nc' ? '|/|' : '| |';
    case 'coil':
      if ('coilType' in element) {
        if (element.coilType === 'set') return '(S)';
        if (element.coilType === 'reset') return '(R)';
      }
      return '( )';
    case 'timer':
      if ('timerType' in element) {
        return `[T${element.timerType}]`;
      }
      return '[T]';
    case 'counter':
      if ('counterType' in element) {
        return `[${element.counterType}]`;
      }
      return '[C]';
    case 'branch':
      return '+';
    default:
      return '?';
  }
}

// Get shortened variable name
function getShortVariable(variable: string): string {
  return variable || '';
}

// Render a single rung preview
function RungPreview({ rung }: { rung: TemplateRung }) {
  const elements = rung.elements;
  if (elements.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic py-2">
        Empty rung
      </div>
    );
  }

  // Group elements by y position for parallel branches
  const yGroups: Map<number, TemplateElement[]> = new Map();
  elements.forEach((el) => {
    const y = el.position?.y || 0;
    if (!yGroups.has(y)) {
      yGroups.set(y, []);
    }
    yGroups.get(y)!.push(el);
  });

  const maxElements = 6; // Limit displayed elements for space
  const sortedYs = [...yGroups.keys()].sort((a, b) => a - b);
  const hasMultipleBranches = sortedYs.length > 1;

  return (
    <div className="mb-3">
      {rung.comment && (
        <div className="text-xs text-gray-500 mb-1 italic">
          {rung.comment}
        </div>
      )}
      <div className="font-mono text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
        {hasMultipleBranches ? (
          // Render as parallel branches
          <div className="space-y-0">
            {/* Opening branch */}
            <div className="flex items-center">
              <span className="text-gray-500">|--</span>
              {sortedYs.map((y, yi) => {
                const group = yGroups.get(y) || [];
                const displayEls = group.slice(0, maxElements);
                return (
                  <span key={y} className={yi > 0 ? 'ml-8' : ''}>
                    {yi === 0 ? '' : '|--'}
                    {displayEls.map((el, i) => (
                      <span key={i} className="mx-0.5">
                        {getElementSymbol(el)}
                      </span>
                    ))}
                    {group.length > maxElements && <span>...</span>}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          // Render as series
          <div className="flex items-center whitespace-nowrap">
            <span className="text-gray-500">|--</span>
            {elements.slice(0, maxElements).map((el, i) => (
              <span key={i} className="mx-0.5">
                <span className="text-yellow-300">{getShortVariable(el.variable)}</span>
                <span>{getElementSymbol(el)}</span>
              </span>
            ))}
            {elements.length > maxElements && <span className="text-gray-500">...</span>}
            <span className="text-gray-500">--|</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{template.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mt-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Ladder Preview
        </h4>
        <div className="space-y-1">
          {template.rungs.map((rung, index) => (
            <RungPreview key={index} rung={rung} />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mt-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Variables Used
        </h4>
        <div className="flex flex-wrap gap-1">
          {Array.from(
            new Set(
              template.rungs.flatMap((r) =>
                r.elements.map((e) => e.variable).filter(Boolean)
              )
            )
          ).map((variable) => (
            <span
              key={variable}
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                variable.startsWith('X')
                  ? 'bg-blue-100 text-blue-700'
                  : variable.startsWith('Y')
                  ? 'bg-green-100 text-green-700'
                  : variable.startsWith('M')
                  ? 'bg-purple-100 text-purple-700'
                  : variable.startsWith('T')
                  ? 'bg-orange-100 text-orange-700'
                  : variable.startsWith('C')
                  ? 'bg-pink-100 text-pink-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {variable}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mt-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{template.rungs.length} rung{template.rungs.length !== 1 ? 's' : ''}</span>
          <span>
            {template.rungs.reduce((sum, r) => sum + r.elements.length, 0)} elements
          </span>
        </div>
      </div>
    </div>
  );
}
