import type { DragEvent } from 'react';
import type { ContactType, CoilType, TimerType, CounterType, BranchType } from '../../core/schema/types';

interface PaletteItem {
  type: 'contact' | 'coil' | 'timer' | 'counter' | 'branch';
  label: string;
  symbol: string;
  subType: ContactType | CoilType | TimerType | CounterType | BranchType;
  description: string;
}

const paletteItems: PaletteItem[] = [
  {
    type: 'contact',
    label: 'NO Contact',
    symbol: '┤ ─',
    subType: 'no',
    description: 'Normally Open contact',
  },
  {
    type: 'contact',
    label: 'NC Contact',
    symbol: '┤/├',
    subType: 'nc',
    description: 'Normally Closed contact',
  },
  {
    type: 'coil',
    label: 'Output Coil',
    symbol: '( )',
    subType: 'output',
    description: 'Output coil',
  },
  {
    type: 'coil',
    label: 'Set Coil',
    symbol: '(S)',
    subType: 'set',
    description: 'Set (latch) coil',
  },
  {
    type: 'coil',
    label: 'Reset Coil',
    symbol: '(R)',
    subType: 'reset',
    description: 'Reset (unlatch) coil',
  },
  {
    type: 'timer',
    label: 'Timer ON',
    symbol: 'TON',
    subType: 'TON',
    description: 'Timer On-Delay',
  },
  {
    type: 'timer',
    label: 'Timer OFF',
    symbol: 'TOF',
    subType: 'TOF',
    description: 'Timer Off-Delay',
  },
  {
    type: 'timer',
    label: 'Timer Pulse',
    symbol: 'TP',
    subType: 'TP',
    description: 'Timer Pulse',
  },
  {
    type: 'counter',
    label: 'Counter Up',
    symbol: 'CTU',
    subType: 'CTU',
    description: 'Count Up counter',
  },
  {
    type: 'counter',
    label: 'Counter Down',
    symbol: 'CTD',
    subType: 'CTD',
    description: 'Count Down counter',
  },
  {
    type: 'branch',
    label: 'OR Start',
    symbol: '┌',
    subType: 'start',
    description: 'Branch start (parallel path)',
  },
  {
    type: 'branch',
    label: 'OR End',
    symbol: '┐',
    subType: 'end',
    description: 'Branch end (close parallel)',
  },
];

interface ComponentPaletteProps {
  className?: string;
}

export function ComponentPalette({ className = '' }: ComponentPaletteProps) {
  const onDragStart = (event: DragEvent<HTMLDivElement>, item: PaletteItem) => {
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: item.type,
      subType: item.subType,
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Group items by type
  const contacts = paletteItems.filter(item => item.type === 'contact');
  const coils = paletteItems.filter(item => item.type === 'coil');
  const timers = paletteItems.filter(item => item.type === 'timer');
  const counters = paletteItems.filter(item => item.type === 'counter');
  const branches = paletteItems.filter(item => item.type === 'branch');

  const renderItems = (items: PaletteItem[]) => (
    items.map((item) => (
      <div
        key={`${item.type}-${item.subType}`}
        draggable
        onDragStart={(e) => onDragStart(e, item)}
        className="
          flex items-center gap-2 p-2
          bg-white border border-gray-300 rounded
          cursor-grab hover:border-blue-400 hover:shadow-sm
          transition-all duration-150
          active:cursor-grabbing
        "
        title={item.description}
      >
        <span className="text-lg font-mono text-gray-700 w-10">
          {item.symbol}
        </span>
        <span className="text-sm text-gray-600">{item.label}</span>
      </div>
    ))
  );

  return (
    <div className={`bg-gray-100 border-r border-gray-300 p-4 w-48 overflow-y-auto ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Components
      </h3>

      {/* Contacts Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Contacts
        </h4>
        <div className="space-y-2">
          {renderItems(contacts)}
        </div>
      </div>

      {/* Coils Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Coils
        </h4>
        <div className="space-y-2">
          {renderItems(coils)}
        </div>
      </div>

      {/* Timers Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Timers
        </h4>
        <div className="space-y-2">
          {renderItems(timers)}
        </div>
      </div>

      {/* Counters Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Counters
        </h4>
        <div className="space-y-2">
          {renderItems(counters)}
        </div>
      </div>

      {/* Branches Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Branches
        </h4>
        <div className="space-y-2">
          {renderItems(branches)}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Instructions
        </h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Drag components to canvas</li>
          <li>• Click to select</li>
          <li>• Edit variable name inline</li>
          <li>• Connect via handles</li>
        </ul>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Shortcuts
        </h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li><span className="font-mono bg-gray-200 px-1 rounded">Del</span> Delete selected</li>
          <li><span className="font-mono bg-gray-200 px-1 rounded">Ctrl+Z</span> Undo</li>
          <li><span className="font-mono bg-gray-200 px-1 rounded">Ctrl+Y</span> Redo</li>
          <li><span className="font-mono bg-gray-200 px-1 rounded">Ctrl+S</span> Save</li>
        </ul>
      </div>

      {/* Variable naming guide */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Variable Prefixes
        </h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li><span className="font-mono">X</span> - Inputs</li>
          <li><span className="font-mono">Y</span> - Outputs</li>
          <li><span className="font-mono">M</span> - Memory bits</li>
          <li><span className="font-mono">T</span> - Timers</li>
          <li><span className="font-mono">C</span> - Counters</li>
        </ul>
      </div>
    </div>
  );
}
