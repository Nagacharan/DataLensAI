import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { parseCSV } from '../src/utils/file-parsers/csvParser.js';
import { parseTSV } from '../src/utils/file-parsers/tsvParser.js';
import { parseJSON } from '../src/utils/file-parsers/jsonParser.js';
import { inspectXLSX, parseWorksheet } from '../src/utils/file-parsers/xlsxParser.js';

export async function testDiskFiles() {
  console.log('--- Testing Physical Sample Files on Disk ---');
  const baseDir = path.resolve(process.cwd(), 'sample-datasets');

  // 1. CSV
  const csvPath = path.join(baseDir, 'Global_Tech_Sales_2024.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const csvRes = await parseCSV(csvText, { fileName: 'Global_Tech_Sales_2024.csv' });
  assert.ok(csvRes.totalRows >= 20, 'Sales CSV should have >= 20 rows');
  console.log(`✓ Read and parsed ${csvPath} (${csvRes.totalRows} rows, ${csvRes.totalColumns} cols).`);

  // 2. TSV
  const tsvPath = path.join(baseDir, 'Corporate_Expenses_Q1_2024.tsv');
  const tsvText = fs.readFileSync(tsvPath, 'utf-8');
  const tsvRes = await parseTSV(tsvText, { fileName: 'Corporate_Expenses_Q1_2024.tsv' });
  assert.ok(tsvRes.totalRows >= 15, 'Expenses TSV should have >= 15 rows');
  console.log(`✓ Read and parsed ${tsvPath} (${tsvRes.totalRows} rows, ${tsvRes.totalColumns} cols).`);

  // 3. JSON
  const jsonPath = path.join(baseDir, 'Orders_Nested_Data.json');
  const jsonText = fs.readFileSync(jsonPath, 'utf-8');
  const jsonRes = await parseJSON(jsonText, { fileName: 'Orders_Nested_Data.json' });
  assert.strictEqual(jsonRes.totalRows, 5);
  assert.ok(jsonRes.columns.some(c => c.name === 'customer_name'));
  console.log(`✓ Read and parsed ${jsonPath} with nested objects (${jsonRes.totalRows} rows).`);

  // 4. Multi-sheet XLSX
  const xlsxPath = path.join(baseDir, 'Multi_Sheet_Enterprise_Book.xlsx');
  const xlsxBuffer = fs.readFileSync(xlsxPath);
  const { sheetNames, workbook } = await inspectXLSX(xlsxBuffer);
  assert.strictEqual(sheetNames.length, 2, 'Workbook should have 2 sheets');
  assert.strictEqual(sheetNames[0], 'Tech_Sales');
  assert.strictEqual(sheetNames[1], 'Corp_Expenses');

  const sheet1Parsed = parseWorksheet(workbook, 'Tech_Sales', 'Multi_Sheet_Enterprise_Book.xlsx');
  assert.ok(sheet1Parsed.totalRows >= 20);
  const sheet2Parsed = parseWorksheet(workbook, 'Corp_Expenses', 'Multi_Sheet_Enterprise_Book.xlsx');
  assert.ok(sheet2Parsed.totalRows >= 15);
  console.log(`✓ Read and parsed ${xlsxPath} multi-sheet workbook (Tech_Sales: ${sheet1Parsed.totalRows} rows, Corp_Expenses: ${sheet2Parsed.totalRows} rows).`);

  console.log('All Disk Sample File tests passed!\n');
}
