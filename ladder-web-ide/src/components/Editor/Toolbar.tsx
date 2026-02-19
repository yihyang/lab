import { useRef, useState } from 'react';
import { useSaveLoad } from '../../hooks';
import { useStore } from '../../store/useStore';
import { ExportDialog } from '../Export';
import { ValidationStatus } from './ValidationStatus';
import { SimulationControls } from './SimulationControls';

interface ToolbarProps {
  className?: string;
}

export function Toolbar({ className = '' }: ToolbarProps) {
  const { handleSave, handleOpen, handleNew, isDirty } = useSaveLoad();
  const project = useStore((state) => state.project);
  const updateProjectName = useStore((state) => state.updateProjectName);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const canUndo = useStore((state) => state.canUndo);
  const canRedo = useStore((state) => state.canRedo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [newName, setNewName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  const handleNewClick = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Create new project anyway?')) {
        handleNew();
      }
    } else {
      handleNew();
    }
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await handleOpen(file);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to open file');
      }
    }
    // Reset input
    e.target.value = '';
  };

  const handleSaveClick = () => {
    handleSave();
  };

  const handleSaveAsClick = () => {
    setShowSaveAs(true);
  };

  const handleSaveAsConfirm = () => {
    if (newName.trim()) {
      handleSave(newName.trim());
      setShowSaveAs(false);
      setNewName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveAsConfirm();
    } else if (e.key === 'Escape') {
      setShowSaveAs(false);
      setNewName('');
    }
  };

  const handleNameDoubleClick = () => {
    setEditingName(project.name);
    setIsEditingName(true);
  };

  const handleNameBlur = () => {
    if (editingName.trim() && editingName.trim() !== project.name) {
      updateProjectName(editingName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditingName(project.name);
      setIsEditingName(false);
    }
  };

  return (
    <div className={`bg-white border-b border-gray-300 px-2 md:px-4 py-2 flex flex-wrap items-center gap-1 md:gap-2 ${className}`}>
      {/* Project Name */}
      <div className="flex items-center gap-1 md:gap-2 mr-2 md:mr-4 pr-2 md:pr-4 border-r border-gray-300">
        <span className="text-lg">⚡</span>
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="font-semibold text-gray-800 px-1 py-0.5 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px] md:min-w-[100px] text-sm"
            autoFocus
          />
        ) : (
          <span
            onDoubleClick={handleNameDoubleClick}
            className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded text-sm max-w-[120px] md:max-w-none truncate"
            title="Double-click to rename"
          >
            {project.name}
          </span>
        )}
        {isDirty && (
          <span className="text-xs text-orange-600 font-medium">●</span>
        )}
      </div>

      {/* New Button */}
      <button
        onClick={handleNewClick}
        className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="New Project"
      >
        <span className="text-base leading-none">+</span>
        <span className="hidden sm:inline">New</span>
      </button>

      {/* Open Button */}
      <button
        onClick={handleOpenClick}
        className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Open Project"
      >
        <span className="text-base leading-none">📁</span>
        <span className="hidden sm:inline">Open</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.ladder.json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Divider - hidden on small screens */}
      <div className="hidden md:block w-px h-6 bg-gray-300 mx-1" />

      {/* Undo Button */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <span className="text-base leading-none">↩</span>
      </button>

      {/* Redo Button */}
      <button
        onClick={redo}
        disabled={!canRedo}
        className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
      >
        <span className="text-base leading-none">↪</span>
      </button>

      {/* Divider - hidden on small screens */}
      <div className="hidden md:block w-px h-6 bg-gray-300 mx-1" />

      {/* Save Button */}
      <button
        onClick={handleSaveClick}
        className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Save Project"
      >
        <span className="text-base leading-none">💾</span>
        <span className="hidden sm:inline">Save</span>
      </button>

      {/* Save As Button - hidden on small screens */}
      <button
        onClick={handleSaveAsClick}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Save Project As..."
      >
        <span className="text-base leading-none">📄</span>
        Save As
      </button>

      {/* Export Button */}
      <button
        onClick={() => setShowExport(true)}
        className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        title="Export to PLC format"
      >
        <span className="text-base leading-none">📤</span>
        <span className="hidden sm:inline">Export</span>
      </button>

      {/* Divider - hidden on small screens */}
      <div className="hidden lg:block w-px h-6 bg-gray-300 mx-1" />

      {/* Simulation Controls */}
      <div className="w-full lg:w-auto mt-1 lg:mt-0">
        <SimulationControls />
      </div>

      {/* Divider - hidden on small screens */}
      <div className="hidden lg:block w-px h-6 bg-gray-300 mx-1" />

      {/* Validation Status */}
      <ValidationStatus />

      {/* Export Dialog */}
      <ExportDialog isOpen={showExport} onClose={() => setShowExport(false)} />

      {/* Save As Modal */}
      {showSaveAs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Project As</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Project name"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowSaveAs(false);
                  setNewName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsConfirm}
                disabled={!newName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
