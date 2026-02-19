import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { LadderNodeData, CounterElement } from '../../core/schema/types';

function CounterNodeComponent({ data, selected }: NodeProps<LadderNodeData>) {
  const element = data.element as CounterElement;
  const hasPower = data.hasPower ?? false;

  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onVariableChange?.(element.id, e.target.value);
  };

  // Get counter symbol based on type
  const getCounterSymbol = () => {
    switch (element.counterType) {
      case 'CTU':
        return 'CTU'; // Count Up
      case 'CTD':
        return 'CTD'; // Count Down
      default:
        return 'CTU';
    }
  };

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        bg-white border-2 rounded shadow-sm
        min-w-[100px] h-[70px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-400'}
        ${hasPower ? 'bg-green-50 border-green-500' : ''}
        text-gray-900
        transition-colors duration-200
      `}
    >
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-600 border-2 border-white"
      />

      {/* Counter Type Label */}
      <div className="flex items-center gap-1 px-2">
        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">
          {getCounterSymbol()}
        </span>
        <input
          type="text"
          value={element.variable}
          onChange={handleVariableChange}
          className="w-12 text-center text-sm font-mono bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Preset Count Display */}
      <div className="text-xs text-gray-500 mt-1">
        Count: {element.preset}
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

export const CounterNode = memo(CounterNodeComponent);
