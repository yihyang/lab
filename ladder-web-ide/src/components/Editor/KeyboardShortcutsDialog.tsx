import { useEffect } from 'react';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  category: string;
  shortcuts: { keys: string; action: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    category: 'File',
    shortcuts: [
      { keys: 'Ctrl+N', action: 'New project' },
      { keys: 'Ctrl+O', action: 'Open project' },
      { keys: 'Ctrl+S', action: 'Save project' },
    ],
  },
  {
    category: 'Edit',
    shortcuts: [
      { keys: 'Ctrl+Z', action: 'Undo' },
      { keys: 'Ctrl+Y', action: 'Redo' },
      { keys: 'Ctrl+Shift+Z', action: 'Redo (alt)' },
      { keys: 'Ctrl+C', action: 'Copy element' },
      { keys: 'Ctrl+V', action: 'Paste element' },
      { keys: 'Ctrl+D', action: 'Duplicate element' },
      { keys: 'Delete', action: 'Delete selected' },
      { keys: 'Backspace', action: 'Delete selected' },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { keys: '?', action: 'Show this help' },
      { keys: 'Esc', action: 'Close dialog' },
    ],
  },
  {
    category: 'Elements',
    shortcuts: [
      { keys: 'Ctrl+A', action: 'Select all elements' },
    ],
  },
];

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {shortcutGroups.map((group) => (
            <div key={group.category}>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {group.category}
              </h4>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">{shortcut.action}</span>
                    <kbd className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-mono border border-gray-200">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
