import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { LadderNodeData, BranchElement } from '../../core/schema/types';
import { ORStartIcon, OREndIcon } from '../Palette/PaletteIcons';

function BranchNodeComponent({ data, selected }: NodeProps<LadderNodeData>) {
  const element = data.element as BranchElement;

  // Get branch icon based on type
  const getBranchIcon = () => {
    switch (element.branchType) {
      case 'start':
        return <ORStartIcon className="w-8 h-5 text-gray-700" />;
      case 'end':
        return <OREndIcon className="w-8 h-5 text-gray-700" />;
      case 'junction':
        return <ORStartIcon className="w-8 h-5 text-gray-700" />; // Fallback to start
      default:
        return <ORStartIcon className="w-8 h-5 text-gray-700" />;
    }
  };

  const getBranchLabel = () => {
    switch (element.branchType) {
      case 'start':
        return 'OR Start';
      case 'end':
        return 'OR End';
      case 'junction':
        return 'Junction';
      default:
        return 'Branch';
    }
  };

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        bg-white border-2 rounded shadow-sm
        min-w-[60px] h-[50px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-400'}
        text-gray-900
      `}
    >
      {/* Top Handle (for parallel connections) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-gray-600 border-2 border-white"
      />

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 bg-gray-600 border-2 border-white"
      />

      {/* Branch Symbol */}
      <div className="flex items-center gap-1">
        {getBranchIcon()}
      </div>

      {/* Label */}
      <div className="text-xs text-gray-500">
        {getBranchLabel()}
      </div>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 bg-gray-600 border-2 border-white"
      />

      {/* Bottom Handle (for parallel connections) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-gray-600 border-2 border-white"
      />

      {/* Delete button when selected */}
      {selected && data.onDelete && (
        <button
          onClick={() => data.onDelete?.(element.id)}
          className="node-delete-btn absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
        >
          ×
        </button>
      )}
    </div>
  );
}

export const BranchNode = memo(BranchNodeComponent);
