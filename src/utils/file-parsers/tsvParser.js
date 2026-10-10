import { parseCSV } from './csvParser.js';

/**
 * Parses TSV file or string
 */
export function parseTSV(input, options = {}) {
  return parseCSV(input, {
    delimiter: '\t',
    delimitersToGuess: ['\t'],
    fileName: options.fileName || (input instanceof File ? input.name : 'data.tsv'),
    ...options,
  });
}
