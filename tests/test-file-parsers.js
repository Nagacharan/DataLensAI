import assert from 'node:assert';
import { parseCSV } from '../src/utils/file-parsers/csvParser.js';
import { parseTSV } from '../src/utils/file-parsers/tsvParser.js';
import { parseJSON } from '../src/utils/file-parsers/jsonParser.js';
import { normalizeDataset } from '../src/utils/file-parsers/normalizer.js';
import * as XLSX from 'xlsx';
import { parseWorksheet } from '../src/utils/file-parsers/xlsxParser.js';

export async function testFileParsers() {
  console.log('--- Testing File Parsers ---');

  // 1. CSV Parsing with quotes, commas, numbers, and missing values
  const csvContent = `Product,Price,Quantity,Category
"Cloud Suite",1200,5,Software
"AI Server",6500,2,Hardware
"Data Gateway",NA,10,Hardware
"Cloud Suite",1200,5,Software`; // contains a duplicate and an 'NA'

  const parsedCSV = await parseCSV(csvContent, { fileName: 'test.csv' });
  assert.strictEqual(parsedCSV.totalRows, 4, 'CSV should have 4 rows');
  assert.strictEqual(parsedCSV.totalColumns, 4, 'CSV should have 4 columns');
  assert.strictEqual(parsedCSV.columns.find(c => c.name === 'Price').type, 'number', 'Price should be inferred as number');
  assert.strictEqual(parsedCSV.rows[2].Price, null, 'NA string should be parsed as null');
  console.log('✓ CSV parser handles quotes, typed columns, and null conversion correctly.');

  // 2. TSV Parsing with tabs
  const tsvContent = `Student\tScore\tPassed\nAlice\t95\ttrue\nBob\t82\ttrue\nCharlie\t48\tfalse`;
  const parsedTSV = await parseTSV(tsvContent, { fileName: 'test.tsv' });
  assert.strictEqual(parsedTSV.totalRows, 3, 'TSV should have 3 rows');
  assert.strictEqual(parsedTSV.columns.find(c => c.name === 'Score').type, 'number');
  assert.strictEqual(parsedTSV.columns.find(c => c.name === 'Passed').type, 'boolean');
  console.log('✓ TSV parser correctly extracts tab-delimited records and booleans.');

  // 3. JSON Parsing with nested objects and sparse keys
  const jsonContent = JSON.stringify({
    data: [
      { id: 1, user: { name: 'Alice', city: 'NY' }, amount: 150 },
      { id: 2, user: { name: 'Bob', city: 'SF' }, amount: 280, note: 'Express' },
      { id: 3, user: { name: 'Charlie', city: 'NY' }, amount: null },
    ],
  });
  const parsedJSON = await parseJSON(jsonContent, { fileName: 'test.json' });
  assert.strictEqual(parsedJSON.totalRows, 3, 'JSON should have 3 rows');
  // Check flattened column name
  const userCityCol = parsedJSON.columns.find(c => c.name === 'user_city');
  assert.ok(userCityCol, 'JSON nested object should be flattened to user_city');
  assert.strictEqual(parsedJSON.rows[0].user_city, 'NY');
  console.log('✓ JSON parser correctly flattens nested structures and handles container keys.');

  // 4. Excel (XLSX) multi-sheet simulation
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet([{ id: 1, val: 'Sheet1Val' }]);
  const ws2 = XLSX.utils.json_to_sheet([{ id: 2, val: 'Sheet2Val', extra: 99 }]);
  XLSX.utils.book_append_sheet(wb, ws1, 'SalesData');
  XLSX.utils.book_append_sheet(wb, ws2, 'ExpenseData');

  const parsedSheet1 = parseWorksheet(wb, 'SalesData');
  assert.strictEqual(parsedSheet1.totalRows, 1);
  assert.strictEqual(parsedSheet1.sheetName, 'SalesData');

  const parsedSheet2 = parseWorksheet(wb, 'ExpenseData');
  assert.strictEqual(parsedSheet2.totalRows, 1);
  assert.strictEqual(parsedSheet2.columns.length, 3);
  console.log('✓ Excel XLSX worksheet inspector and parser parse multi-sheet workbooks accurately.');

  console.log('All File Parser tests passed!\n');
}
