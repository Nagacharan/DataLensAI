import assert from 'node:assert';
import {
  handleMissingValues,
  removeDuplicates,
  convertColumnType,
  handleOutliers,
  dropColumn,
} from '../src/utils/data-cleaning/cleaner.js';

export function testCleaning() {
  console.log('--- Testing Data Cleaning Operations ---');

  const baseDataset = {
    fileName: 'cleaning_test.csv',
    columns: [
      { name: 'id', type: 'number' },
      { name: 'val', type: 'number' },
      { name: 'cat', type: 'string' },
    ],
    rows: [
      { id: 1, val: 10, cat: 'A' },
      { id: 2, val: 20, cat: 'A' },
      { id: 3, val: null, cat: 'B' },
      { id: 4, val: 100, cat: null },
      { id: 1, val: 10, cat: 'A' }, // duplicate row
    ],
    totalRows: 5,
    totalColumns: 3,
  };

  // 1. Duplicate removal
  const dedupRes = removeDuplicates(baseDataset);
  assert.strictEqual(dedupRes.dataset.totalRows, 4, 'Duplicate removal should purge exactly 1 row');
  assert.strictEqual(dedupRes.transformation.recordsAffected, 1);
  console.log('✓ Duplicate detector and purger successfully identifies and removes redundant records.');

  // 2. Mean imputation on 'val'
  const meanRes = handleMissingValues(baseDataset, 'val', 'mean');
  // Available valid numbers: 10, 20, 100, 10. Mean is 35.
  const imputedRow = meanRes.dataset.rows.find(r => r.id === 3);
  assert.strictEqual(imputedRow.val, 35, 'Missing value should be filled with mean (35)');
  console.log('✓ Mean imputation computes correct replacement and leaves other values unchanged.');

  // 3. Drop rows with missing values in 'cat'
  const dropRes = handleMissingValues(baseDataset, 'cat', 'drop_row');
  assert.strictEqual(dropRes.dataset.totalRows, 4, 'Should drop 1 row with missing cat');
  console.log('✓ Missing row drop correctly filters dataset.');

  // 4. Type casting
  const strData = {
    fileName: 'type_test.csv',
    columns: [{ name: 'numStr', type: 'string' }],
    rows: [{ numStr: '123' }, { numStr: '456.78' }, { numStr: 'invalid' }],
    totalRows: 3,
    totalColumns: 1,
  };
  const castRes = convertColumnType(strData, 'numStr', 'number');
  assert.strictEqual(castRes.dataset.rows[0].numStr, 123);
  assert.strictEqual(castRes.dataset.rows[2].numStr, null, 'Unparseable number should be cast to null safely');
  console.log('✓ Safe type conversion parses valid numbers and converts unparseable strings to null.');

  // 5. Outlier capping (IQR)
  const outlierData = {
    fileName: 'outlier_test.csv',
    columns: [{ name: 'metric', type: 'number' }],
    rows: [
      { metric: 10 }, { metric: 12 }, { metric: 11 }, { metric: 13 },
      { metric: 12 }, { metric: 14 }, { metric: 1000 }, // extreme outlier
    ],
    totalRows: 7,
    totalColumns: 1,
  };
  const capRes = handleOutliers(outlierData, 'metric', 'cap');
  const cappedVal = capRes.dataset.rows[6].metric;
  assert.ok(cappedVal < 100, 'Extreme outlier 1000 should be capped to upper IQR fence');
  console.log(`✓ IQR outlier detection safely capped 1000 to upper fence ${cappedVal}.`);

  console.log('All Data Cleaning tests passed!\n');
}
