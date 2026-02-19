import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { exportProject, downloadExport, VENDOR_INFO, type VendorType } from '../../core/compiler';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const project = useStore((state) => state.project);
  const [selectedVendor, setSelectedVendor] = useState<VendorType>('keyence');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVendorChange = (vendor: VendorType) => {
    setSelectedVendor(vendor);
    setPreview(null);
    setError(null);
  };

  const handlePreview = () => {
    const result = exportProject(project, selectedVendor);
    if (result.success) {
      setPreview(result.content);
      setError(null);
    } else {
      setPreview(null);
      setError(result.error || 'Export failed');
    }
  };

  const handleExport = () => {
    const result = exportProject(project, selectedVendor);
    if (result.success) {
      downloadExport(result);
      onClose();
    } else {
      setError(result.error || 'Export failed');
    }
  };

  const vendorOptions = Object.entries(VENDOR_INFO) as [VendorType, typeof VENDOR_INFO[VendorType]][];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[600px] max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Export Project</h3>

        {/* Vendor Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Vendor Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {vendorOptions.map(([key, info]) => (
              <button
                key={key}
                onClick={() => handleVendorChange(key)}
                className={`
                  p-3 text-left rounded border transition-all
                  ${selectedVendor === key
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                  ${key !== 'keyence' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={key !== 'keyence'}
              >
                <div className="font-medium text-sm">{info.name}</div>
                <div className="text-xs text-gray-500">{info.description}</div>
              </button>
            ))}
          </div>
          {selectedVendor !== 'keyence' && (
            <p className="text-xs text-amber-600 mt-2">
              Note: Only Keyence exporter is currently implemented. Others coming soon!
            </p>
          )}
        </div>

        {/* Preview Area */}
        <div className="mb-4 flex-1 min-h-0">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Preview
            </label>
            <button
              onClick={handlePreview}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Generate Preview
            </button>
          </div>
          <div className="bg-gray-900 text-gray-100 rounded p-3 h-48 overflow-auto font-mono text-xs">
            {preview ? (
              <pre className="whitespace-pre-wrap">{preview}</pre>
            ) : error ? (
              <span className="text-red-400">{error}</span>
            ) : (
              <span className="text-gray-500">Click "Generate Preview" to see the exported code</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedVendor !== 'keyence'}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export & Download
          </button>
        </div>
      </div>
    </div>
  );
}
