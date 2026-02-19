import { useCallback, useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Toolbar, Canvas } from './components/Editor';
import { ComponentPalette } from './components/Palette';
import { useStore } from './store/useStore';
import { loadDraft, clearDraft, saveProjectToFile } from './hooks/useSaveLoad';

function AppContent() {
  const project = useStore((state) => state.project);
  const setProject = useStore((state) => state.setProject);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const canUndo = useStore((state) => state.canUndo);
  const canRedo = useStore((state) => state.canRedo);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftInfo, setDraftInfo] = useState<{ savedAt: string } | null>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProjectToFile(project);
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, undo, redo, canUndo, canRedo]);

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
      {/* Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Component Palette */}
        <ComponentPalette />

        {/* Canvas - handles drop internally */}
        <Canvas />
      </div>

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
