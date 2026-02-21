import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { LadderNodeData, CoilElement } from '../../core/schema/types';
import { OutputCoilIcon, SetCoilIcon, ResetCoilIcon } from '../Palette/PaletteIcons';

function CoilNodeComponent({ data, selected }: NodeProps<LadderNodeData>) {
  const element = data.element as CoilElement;
  const hasPower = data.hasPower ?? false;

  const getIcon = () => {
    switch (element.coilType) {
      case 'output':
        return <OutputCoilIcon className="w-8 h-5 text-amber-700" />;
      case 'set':
        return <SetCoilIcon className="w-8 h-5 text-amber-700" />;
      case 'reset':
        return <ResetCoilIcon className="w-8 h-5 text-amber-700" />;
      default:
        return <OutputCoilIcon className="w-8 h-5 text-amber-700" />;
    }
  };

  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onVariableChange?.(element.id, e.target.value);
  };

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        bg-amber-50 border-2 rounded shadow-sm
        min-w-[80px] h-[50px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-amber-400'}
        ${hasPower ? 'bg-green-100 border-green-500' : ''}
        transition-colors duration-200
      `}
    >
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-600 border-2 border-white"
      />

      {/* Symbol and Variable */}
      <div className="flex items-center gap-1 px-2">
        {getIcon()}
        <input
          type="text"
          value={element.variable}
          onChange={handleVariableChange}
          className="w-12 text-center text-sm font-mono bg-transparent border-b border-amber-300 focus:border-blue-500 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
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

export const CoilNode = memo(CoilNodeComponent);
