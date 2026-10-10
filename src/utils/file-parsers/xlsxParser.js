import * as XLSX from 'xlsx';
import { normalizeDataset } from './normalizer.js';

/**
 * Inspect an XLSX file to get the list of sheet names
 * @param {File|ArrayBuffer} input
 * @returns {Promise<{ sheetNames: string[], workbook: any }>}
 */
export async function inspectXLSX(input) {
  let data;
  if (input instanceof File) {
    data = await input.arrayBuffer();
  } else if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
    data = input;
  } else {
    throw new Error('Unsupported XLSX input format.');
  }

  const workbook = XLSX.read(data, { type: 'array' });
  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('The Excel workbook contains no visible sheets.');
  }

  return { sheetNames, workbook };
}

/**
 * Parse a specific worksheet from a workbook into a normalized dataset
 * @param {any} workbook
 * @param {string} sheetName
 * @param {string} fileName
 * @returns {NormalizedDataset}
 */
export function parseWorksheet(workbook, sheetName, fileName = 'data.xlsx') {
  const targetSheet = sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheet];

  if (!worksheet) {
    throw new Error(`Sheet "${targetSheet}" was not found in the Excel workbook.`);
  }

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: false, // Formats values as strings/dates where suitable for consistent parsing
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error(`Sheet "${targetSheet}" is empty or has no data rows.`);
  }

  const dataset = normalizeDataset(rawRows, `${fileName} [${targetSheet}]`);
  dataset.sheetName = targetSheet;
  dataset.allSheets = workbook.SheetNames;
  return dataset;
}

/**
 * Full XLSX parsing workflow. If only 1 sheet, resolves immediately.
 * If multiple sheets and no sheet specified, returns a descriptor indicating user selection is needed.
 */
export async function parseXLSX(input, selectedSheet = null, fileName = 'data.xlsx') {
  const name = input instanceof File ? input.name : fileName;
  const { sheetNames, workbook } = await inspectXLSX(input);

  if (sheetNames.length > 1 && !selectedSheet) {
    return {
      requiresSheetSelection: true,
      sheetNames,
      workbook,
      fileName: name,
    };
  }

  const chosen = selectedSheet || sheetNames[0];
  return parseWorksheet(workbook, chosen, name);
}
