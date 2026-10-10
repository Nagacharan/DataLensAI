import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { salesDataset } from '../src/utils/sample-datasets/salesData.js';
import { studentDataset } from '../src/utils/sample-datasets/studentData.js';
import { expensesDataset } from '../src/utils/sample-datasets/expensesData.js';
import { exportToCSVText } from '../src/utils/data-preparation/mlPreparer.js';

const targetDir = path.resolve(process.cwd(), 'sample-datasets');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. CSV: Global Tech Sales
const salesCSV = exportToCSVText(salesDataset.data);
fs.writeFileSync(path.join(targetDir, 'Global_Tech_Sales_2024.csv'), salesCSV, 'utf-8');

// 2. CSV: Student Academic Performance
const studentCSV = exportToCSVText(studentDataset.data);
fs.writeFileSync(path.join(targetDir, 'Student_Academic_Performance.csv'), studentCSV, 'utf-8');

// 3. TSV: Corporate Expenses
const expCols = Object.keys(expensesDataset.data[0]);
const tsvHeader = expCols.join('\t');
const tsvRows = expensesDataset.data.map(r => expCols.map(c => r[c] === null ? '' : String(r[c])).join('\t'));
fs.writeFileSync(path.join(targetDir, 'Corporate_Expenses_Q1_2024.tsv'), [tsvHeader, ...tsvRows].join('\n'), 'utf-8');

// 4. JSON: Nested customer orders
const nestedJSON = {
  status: 'success',
  records_count: 5,
  data: [
    { order_id: 'J-101', customer: { name: 'Acme Corp', tier: 'Enterprise', country: 'USA' }, item: { product: 'Analytics Hub', units: 10, unit_price: 250 }, total: 2500, active: true },
    { order_id: 'J-102', customer: { name: 'Globex Ltd', tier: 'SMB', country: 'UK' }, item: { product: 'Security Shield', units: 4, unit_price: 800 }, total: 3200, active: true },
    { order_id: 'J-103', customer: { name: 'Initech', tier: 'Enterprise', country: 'Germany' }, item: { product: 'Cloud Storage', units: 50, unit_price: 40 }, total: 2000, active: false },
    { order_id: 'J-104', customer: { name: 'Umbrella Inc', tier: 'Government', country: 'USA' }, item: { product: 'AI Server', units: 2, unit_price: 7000 }, total: 14000, active: true },
    { order_id: 'J-105', customer: { name: 'Stark Ind', tier: 'Enterprise', country: 'Japan' }, item: { product: 'Supercluster Node', units: 1, unit_price: 45000 }, total: 45000, active: true },
  ]
};
fs.writeFileSync(path.join(targetDir, 'Orders_Nested_Data.json'), JSON.stringify(nestedJSON, null, 2), 'utf-8');

// 5. Excel (.xlsx): Multi-sheet workbook with Sales & Expenses
const wb = XLSX.utils.book_new();
const wsSales = XLSX.utils.json_to_sheet(salesDataset.data);
const wsExpenses = XLSX.utils.json_to_sheet(expensesDataset.data);
XLSX.utils.book_append_sheet(wb, wsSales, 'Tech_Sales');
XLSX.utils.book_append_sheet(wb, wsExpenses, 'Corp_Expenses');
XLSX.writeFile(wb, path.join(targetDir, 'Multi_Sheet_Enterprise_Book.xlsx'));

console.log('Successfully generated 5 sample dataset files in sample-datasets/ folder:');
console.log('1. Global_Tech_Sales_2024.csv');
console.log('2. Student_Academic_Performance.csv');
console.log('3. Corporate_Expenses_Q1_2024.tsv');
console.log('4. Orders_Nested_Data.json');
console.log('5. Multi_Sheet_Enterprise_Book.xlsx');
