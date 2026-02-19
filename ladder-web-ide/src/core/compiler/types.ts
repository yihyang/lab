import type { LadderProject } from '../schema/types';

// Base exporter interface
export interface LadderExporter {
  name: string;
  vendor: string;
  fileExtension: string;
  export(project: LadderProject): string;
}

// Export result with metadata
export interface ExportResult {
  success: boolean;
  content: string;
  filename: string;
  error?: string;
}

// Available vendors
export type VendorType = 'keyence' | 'siemens' | 'rockwell' | 'mitsubishi' | 'codesys';

// Vendor display info
export const VENDOR_INFO: Record<VendorType, { name: string; description: string; extension: string }> = {
  keyence: {
    name: 'Keyence KV Series',
    description: 'Keyence KV series ladder mnemonics (.kv)',
    extension: '.kv',
  },
  siemens: {
    name: 'Siemens S7',
    description: 'Siemens S7 STL format (.stl)',
    extension: '.stl',
  },
  rockwell: {
    name: 'Rockwell Allen-Bradley',
    description: 'Rockwell L5K format (.L5K)',
    extension: '.L5K',
  },
  mitsubishi: {
    name: 'Mitsubishi PLC',
    description: 'Mitsubishi GX Works format (.gx)',
    extension: '.gx',
  },
  codesys: {
    name: 'CODESYS',
    description: 'CODESYS Structured Text (.st)',
    extension: '.st',
  },
};
