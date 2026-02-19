import { memo } from 'react';
import type { NodeProps } from 'reactflow';

interface RungLabelData {
  rungNumber: number;
  comment?: string;
}

function RungLabelNodeComponent({ data }: NodeProps<RungLabelData>) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded border border-gray-300">
      <span className="text-xs font-bold text-gray-600">
        R{data.rungNumber}
      </span>
      {data.comment && (
        <span className="text-xs text-gray-500 truncate max-w-32">
          {data.comment}
        </span>
      )}
    </div>
  );
}

export const RungLabelNode = memo(RungLabelNodeComponent);
