import { parseCSV } from './csvParser.js';
import { parseTSV } from './tsvParser.js';
import { parseXLSX, parseWorksheet } from './xlsxParser.js';
import { parseJSON } from './jsonParser.js';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.json', '.tsv'];

/**
 * Universal file ingestion entry point
 * @param {File} file
 * @param {Object} options
 * @returns {Promise<NormalizedDataset | { requiresSheetSelection: true, sheetNames: string[], workbook: any }>}
 */
export async function parseFile(file, options = {}) {
  if (!file) {
    throw new Error('No file provided for parsing.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). For optimal in-browser performance, please upload datasets under 50MB.`);
  }

  const name = file.name || 'unnamed';
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith('.csv')) {
    return parseCSV(file, { fileName: name, ...options });
  } else if (lowerName.endsWith('.tsv')) {
    return parseTSV(file, { fileName: name, ...options });
  } else if (lowerName.endsWith('.xlsx')) {
    return parseXLSX(file, options.selectedSheet, name);
  } else if (lowerName.endsWith('.json')) {
    return parseJSON(file, { fileName: name, ...options });
  } else {
    throw new Error(`Unsupported file format. Please upload a .csv, .xlsx, .json, or .tsv file.`);
  }
}

export { parseCSV, parseTSV, parseXLSX, parseWorksheet, parseJSON };
