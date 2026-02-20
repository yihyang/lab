import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { generateIL } from '../../core/compiler/il-keyence';

interface ILExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ILExportDialog({ isOpen, onClose }: ILExportDialogProps) {
  const project = useStore((state) => state.project);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Instruction List - Keyence Format</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Code Area */}
        <div className="flex-1 min-h-0 mb-4">
          <div className="bg-gray-900 text-gray-100 rounded p-4 h-64 overflow-auto font-mono text-sm">
            {isEmpty ? (
              <span className="text-gray-500">No instructions. Add elements to your ladder diagram.</span>
            ) : (
              <pre className="whitespace-pre">{ilCode}</pre>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            disabled={isEmpty}
            className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${
              copied
                ? 'bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
