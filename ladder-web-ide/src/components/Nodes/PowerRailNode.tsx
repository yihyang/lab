import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { RUNG_SPACING } from '../Editor/Canvas';

interface PowerRailData {
  side: 'left' | 'right';
  height?: number;
  rungCount?: number;
}

function PowerRailNodeComponent({ data }: NodeProps<PowerRailData>) {
  const height = data.height || 2000;
  const rungCount = data.rungCount || 10;

  // Generate handles at each rung position
  const handles = [];
  for (let i = 0; i < rungCount; i++) {
    const y = 80 + i * RUNG_SPACING; // Match element Y positions
    handles.push(
      <Handle
        key={`${data.side}-rung-${i}`}
        type={data.side === 'left' ? 'source' : 'target'}
        position={data.side === 'left' ? Position.Right : Position.Left}
        id={data.side === 'left' ? 'right' : 'left'}
        style={{
          top: y,
          background: '#374151',
          width: 8,
          height: 8,
        }}
      />
    );
  }

  return (
    <div
      className="relative"
      style={{
        height,
        width: 6,
        backgroundColor: '#1f2937',
        borderRadius: 3,
      }}
    >
      {/* Power rail label */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600 whitespace-nowrap bg-white px-1"
        style={{ top: -24 }}
      >
        {data.side === 'left' ? 'L' : 'N'}
      </div>
      {/* Connection handles at each rung */}
      {handles}
    </div>
  );
}

export const PowerRailNode = memo(PowerRailNodeComponent);
