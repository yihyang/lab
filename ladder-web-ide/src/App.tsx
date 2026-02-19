import { useCallback, useEffect, useState, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Toolbar, Canvas } from './components/Editor';
import { ComponentPalette } from './components/Palette';
import { KeyboardShortcutsDialog } from './components/Editor/KeyboardShortcutsDialog';
import { useStore } from './store/useStore';
import { loadDraft, clearDraft, saveProjectToFile, openProjectFromFile } from './hooks/useSaveLoad';

function AppContent() {
  const project = useStore((state) => state.project);
  const setProject = useStore((state) => state.setProject);
  const newProject = useStore((state) => state.newProject);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const canUndo = useStore((state) => state.canUndo);
  const canRedo = useStore((state) => state.canRedo);
  const addRung = useStore((state) => state.addRung);
  const copyElement = useStore((state) => state.copyElement);
  const pasteElement = useStore((state) => state.pasteElement);
  const duplicateElement = useStore((state) => state.duplicateElement);
  const selectedElementId = useStore((state) => state.selectedElementId);
  const removeElement = useStore((state) => state.removeElement);
  const setSelectedElement = useStore((state) => state.setSelectedElement);
  const isDirty = useStore((state) => state.isDirty);
  const markClean = useStore((state) => state.markClean);

  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftInfo, setDraftInfo] = useState<{ savedAt: string } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Help: ?
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProjectToFile(project);
        markClean();
        return;
      }

      // New: Ctrl+N
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (isDirty) {
          if (confirm('Create new project? Unsaved changes will be lost.')) {
            newProject();
          }
        } else {
          newProject();
        }
        return;
      }

      // Open: Ctrl+O
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Add rung: Ctrl+R
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        addRung();
        return;
      }

      // Copy: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        copyElement();
        return;
      }

      // Paste: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.shiftKey) {
        e.preventDefault();
        pasteElement();
        return;
      }

      // Duplicate: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateElement();
        return;
      }

      // Select all: Ctrl+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (project.rungs.length > 0 && project.rungs[0].elements.length > 0) {
          setSelectedElement(project.rungs[0].elements[0].id);
        }
        return;
      }

      // Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          removeElement(selectedElementId);
          setSelectedElement(null);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, undo, redo, canUndo, canRedo, addRung, copyElement, pasteElement, duplicateElement, selectedElementId, removeElement, setSelectedElement, newProject, isDirty, markClean]);

  // Handle file open
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const loadedProject = await openProjectFromFile(file);
        setProject(loadedProject);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to open file');
      }
    }
    // Reset input
    e.target.value = '';
  }, [setProject]);

  // Check for draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && project.rungs.length === 0) {
      setDraftInfo({ savedAt: draft.savedAt });
      setShowDraftPrompt(true);
    }
  }, []);

  const handleRestoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setProject(draft.project);
      clearDraft(); // Clear after restoring
    }
    setShowDraftPrompt(false);
    setDraftInfo(null);
  }, [setProject]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft(); // Clear the draft from localStorage
    setShowDraftPrompt(false);
    setDraftInfo(null);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-200">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.ladder.json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Toolbar */}
      <Toolbar onShowShortcuts={() => setShowShortcuts(true)} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Component Palette */}
        <ComponentPalette />

        {/* Canvas */}
        <Canvas />
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Draft Recovery Modal */}
      {showDraftPrompt && draftInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-2">Recover Draft?</h3>
            <p className="text-sm text-gray-600 mb-4">
              A previous draft was saved on{' '}
              {new Date(draftInfo.savedAt).toLocaleString()}.
              Would you like to restore it?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDiscardDraft}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                onClick={handleRestoreDraft}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}

export default App;
