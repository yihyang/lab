import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { LadderNodeData, ContactElement } from '../../core/schema/types';

function ContactNodeComponent({ data, selected }: NodeProps<LadderNodeData>) {
  const element = data.element as ContactElement;
  const isNO = element.contactType === 'no';
  const hasPower = data.hasPower ?? false;

  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onVariableChange?.(element.id, e.target.value);
  };

  return (
    <div
      className={`
        relative flex items-center justify-center
        bg-white border-2 rounded shadow-sm
        min-w-[80px] h-[50px]
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

      {/* Symbol */}
      <div className="flex items-center gap-1 px-2">
        <span className="text-lg font-mono">
          {isNO ? '┤ ─' : '┤/├'}
        </span>
        <input
          type="text"
          value={element.variable}
          onChange={handleVariableChange}
          className="w-12 text-center text-sm font-mono bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
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

export const ContactNode = memo(ContactNodeComponent);
