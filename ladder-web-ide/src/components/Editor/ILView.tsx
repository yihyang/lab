import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { generateIL } from '../../core/compiler/il-keyence';

export function ILView() {
  const project = useStore((state) => state.project);
  const [copied, setCopied] = useState(false);

  const ilCode = generateIL(project);
  const isEmpty = !ilCode;

  const handleCopy = async () => {
    if (isEmpty) return;

    try {
      await navigator.clipboard.writeText(ilCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header with copy button */}
      <div className="flex justify-between items-center px-4 py-2 bg-white border-b border-gray-300">
        <span className="text-sm text-gray-600">Keyence KV Series Format</span>
        <button
          onClick={handleCopy}
          disabled={isEmpty}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      {/* Code display */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm min-h-full">
          {isEmpty ? (
            <span className="text-gray-500">No instructions. Add elements to your ladder diagram.</span>
          ) : (
            <pre className="whitespace-pre">{ilCode}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
