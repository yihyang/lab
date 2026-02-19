import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import type { LadderProject, RecentFile } from '../core/schema/types';

const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const STORAGE_KEYS = {
  DRAFT: 'ladder-draft',
  DRAFT_TIME: 'ladder-draft-time',
  RECENT: 'ladder-recent',
};

// Save project to file (download)
export function saveProjectToFile(project: LadderProject): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name}.ladder.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// Open project from file
export function openProjectFromFile(file: File): Promise<LadderProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Validate basic structure
        if (!data.name || !data.rungs || !Array.isArray(data.rungs)) {
          reject(new Error('Invalid ladder project file format'));
          return;
        }
        resolve(data as LadderProject);
      } catch (err) {
        reject(new Error('Failed to parse file: invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Auto-save to localStorage
export function saveDraft(project: LadderProject): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(project));
    localStorage.setItem(STORAGE_KEYS.DRAFT_TIME, new Date().toISOString());
  } catch (err) {
    console.warn('Failed to auto-save draft:', err);
  }
}

// Load auto-saved draft
export function loadDraft(): { project: LadderProject; savedAt: string } | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DRAFT);
    const savedAt = localStorage.getItem(STORAGE_KEYS.DRAFT_TIME);
    if (saved && savedAt) {
      return {
        project: JSON.parse(saved),
        savedAt,
      };
    }
  } catch (err) {
    console.warn('Failed to load draft:', err);
  }
  return null;
}

// Clear draft
export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEYS.DRAFT);
  localStorage.removeItem(STORAGE_KEYS.DRAFT_TIME);
}

// Get recent files list
export function getRecentFiles(): RecentFile[] {
  try {
    const recent = localStorage.getItem(STORAGE_KEYS.RECENT);
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
}

// Add to recent files
export function addToRecent(project: LadderProject): void {
  try {
    const recent = getRecentFiles();
    const elementCount = project.rungs.reduce(
      (sum, rung) => sum + rung.elements.length,
      0
    );

    // Remove existing entry with same name
    const filtered = recent.filter((f) => f.name !== project.name);

    // Add new entry at the beginning
    filtered.unshift({
      name: project.name,
      updatedAt: project.updatedAt,
      elementCount,
    });

    // Keep only last 10
    const trimmed = filtered.slice(0, 10);

    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to update recent files:', err);
  }
}

// Hook for save/load with auto-save
export function useSaveLoad() {
  const project = useStore((state) => state.project);
  const setProject = useStore((state) => state.setProject);
  const newProject = useStore((state) => state.newProject);
  const markClean = useStore((state) => state.markClean);
  const isDirty = useStore((state) => state.isDirty);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasDraft, setHasDraft] = useState(() => !!loadDraft());

  // Auto-save effect
  useEffect(() => {
    if (isDirty) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft(project);
      }, AUTOSAVE_INTERVAL);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [project, isDirty]);

  // Save immediately on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty) {
        saveDraft(project);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [project, isDirty]);

  // Save to file
  const handleSave = useCallback(
    (fileName?: string) => {
      const projectToSave = fileName
        ? { ...project, name: fileName }
        : project;

      saveProjectToFile(projectToSave);
      addToRecent(projectToSave);
      clearDraft(); // Clear draft after successful save
      setHasDraft(false);
      markClean();
    },
    [project, markClean]
  );

  // Open from file
  const handleOpen = useCallback(
    async (file: File) => {
      const loadedProject = await openProjectFromFile(file);
      setProject(loadedProject);
      addToRecent(loadedProject);
      clearDraft(); // Clear any existing draft
      setHasDraft(false);
    },
    [setProject]
  );

  // New project
  const handleNew = useCallback(() => {
    if (isDirty) {
      saveDraft(project);
      setHasDraft(true);
    }
    newProject();
  }, [isDirty, project, newProject]);

  // Load draft
  const handleLoadDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setProject(draft.project);
      setHasDraft(false);
    }
    return draft;
  }, [setProject]);

  return {
    handleSave,
    handleOpen,
    handleNew,
    handleLoadDraft,
    isDirty,
    recentFiles: getRecentFiles(),
    hasDraft,
  };
}
