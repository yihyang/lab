import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { validateProject, getValidationSummary } from '../../core/validation';

export function ValidationStatus() {
  const project = useStore((state) => state.project);
  const [expanded, setExpanded] = useState(false);

  const result = useMemo(() => validateProject(project), [project]);
  const summary = getValidationSummary(result);

  const errorCount = result.errors.filter(e => e.type === 'error').length;

  if (result.errors.length === 0) {
    return (
      <div className="flex items-center gap-1 text-sm text-green-600">
        <span>✓</span>
        <span>No issues</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1 px-2 py-1 text-sm rounded transition-colors ${
          errorCount > 0
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
        }`}
      >
        {errorCount > 0 ? <span>✗</span> : <span>⚠</span>}
        <span>{summary}</span>
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 font-medium text-sm">
            Validation Results
          </div>
          <ul className="p-2 space-y-1">
            {result.errors.map((error, index) => (
              <li
                key={index}
                className={`text-xs p-2 rounded ${
                  error.type === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                <span className="font-medium">
                  {error.type === 'error' ? 'Error: ' : 'Warning: '}
                </span>
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
