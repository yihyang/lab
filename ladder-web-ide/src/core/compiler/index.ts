// Ladder Logic Compiler / Exporters
export { type LadderExporter, type ExportResult, type VendorType, VENDOR_INFO } from './types';
export { KeyenceExporter, keyenceExporter } from './keyence';

import type { LadderProject } from '../schema/types';
import type { ExportResult, VendorType } from './types';
import { keyenceExporter } from './keyence';

// Export function that routes to the correct exporter
export function exportProject(project: LadderProject, vendor: VendorType): ExportResult {
  try {
    let content: string;
    let extension: string;

    switch (vendor) {
      case 'keyence':
        content = keyenceExporter.export(project);
        extension = keyenceExporter.fileExtension;
        break;

      // Future exporters will be added here
      // case 'siemens':
      //   content = siemensExporter.export(project);
      //   extension = siemensExporter.fileExtension;
      //   break;

      default:
        return {
          success: false,
          content: '',
          filename: '',
          error: `Exporter for "${vendor}" not yet implemented`,
        };
    }

    // Generate filename
    const baseName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${baseName}${extension}`;

    return {
      success: true,
      content,
      filename,
    };
  } catch (err) {
    return {
      success: false,
      content: '',
      filename: '',
      error: err instanceof Error ? err.message : 'Unknown export error',
    };
  }
}

// Download exported file
export function downloadExport(result: ExportResult): void {
  if (!result.success) {
    console.error('Export failed:', result.error);
    return;
  }

  const blob = new Blob([result.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
