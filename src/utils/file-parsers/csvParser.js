import Papa from 'papaparse';
import { normalizeDataset } from './normalizer.js';

/**
 * Parses CSV file or text using PapaParse
 * @param {File|string} input - File object or text string
 * @param {Object} options - Custom parsing options
 * @returns {Promise<NormalizedDataset>}
 */
export function parseCSV(input, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // We use custom robust type inference in normalizer
      delimitersToGuess: [',', ';', '\t', '|'],
      transformHeader: (header) => (header ? header.trim() : ''),
      complete: (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            // Check if there are fatal errors
            const fatalError = results.errors.find(e => e.type === 'Quotes' && !results.data.length);
            if (fatalError) {
              return reject(new Error(`CSV Parsing error: ${fatalError.message} at line ${fatalError.row}`));
            }
          }

          if (!results.data || results.data.length === 0) {
            return reject(new Error('The uploaded CSV file is empty or contains no valid rows.'));
          }

          const fileName = options.fileName || (input instanceof File ? input.name : 'data.csv');
          const normalized = normalizeDataset(results.data, fileName);

          if (results.errors && results.errors.length > 0) {
            normalized.parseWarnings = results.errors.slice(0, 5).map(e => `Row ${e.row}: ${e.message}`);
          }

          resolve(normalized);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(new Error(`Failed to parse CSV: ${err.message}`));
      },
      ...options,
    };

    if (input instanceof File) {
      Papa.parse(input, defaultOptions);
    } else if (typeof input === 'string') {
      Papa.parse(input, defaultOptions);
    } else {
      reject(new Error('Invalid input for CSV parser. Expected File or string.'));
    }
  });
}
