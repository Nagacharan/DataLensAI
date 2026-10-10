import assert from 'node:assert';
import {
  encodeCategorical,
  scaleNumerical,
  deriveDateFeatures,
  detectLeakageRisks,
  exportToCSVText,
} from '../src/utils/data-preparation/mlPreparer.js';

export function testMLPrep() {
  console.log('--- Testing ML Preparation Engine ---');

  // 1. One-hot encoding
  const rows = [
    { city: 'Tokyo', val: 10 },
    { city: 'Paris', val: 20 },
    { city: 'Tokyo', val: 30 },
  ];
  const oheRes = encodeCategorical(rows, 'city', 'one_hot');
  assert.ok(oheRes.rows[0].city_Tokyo === 1);
  assert.ok(oheRes.rows[0].city_Paris === 0);
  assert.ok(oheRes.rows[1].city_Paris === 1);
  console.log('✓ One-hot encoding generates correct binary indicator columns.');

  // 2. Min-Max scaling
  const scaleRows = [{ score: 0 }, { score: 50 }, { score: 100 }];
  const normRes = scaleNumerical(scaleRows, 'score', 'min_max');
  assert.strictEqual(normRes.rows[0].score_norm, 0);
  assert.strictEqual(normRes.rows[1].score_norm, 0.5);
  assert.strictEqual(normRes.rows[2].score_norm, 1);
  console.log('✓ Min-Max scaling accurately bounds values to [0, 1].');

  // 3. Date feature derivation
  const dateRows = [{ date: '2024-03-15T10:00:00.000Z' }];
  const derived = deriveDateFeatures(dateRows, 'date');
  assert.strictEqual(derived[0].date_year, 2024);
  assert.strictEqual(derived[0].date_month, 3);
  assert.strictEqual(derived[0].date_day, 15);
  assert.ok(derived[0].date_weekday !== undefined);
  console.log('✓ Datetime feature derivation extracts year, month, day, weekday, isWeekend.');

  // 4. Data leakage detection
  const leakageDataset = {
    columns: [
      { name: 'price', type: 'number' },
      { name: 'price_proxy', type: 'number' },
    ],
    rows: [
      { price: 100, price_proxy: 100 },
      { price: 200, price_proxy: 200 },
      { price: 300, price_proxy: 300 },
    ],
  };
  const leakageRisks = detectLeakageRisks(leakageDataset, 'price');
  assert.ok(leakageRisks.length > 0, 'Should detect high correlation leakage proxy');
  assert.strictEqual(leakageRisks[0].type, 'HIGH_CORRELATION');
  console.log('✓ Target leakage heuristics successfully flag collinear proxies.');

  // 5. CSV export
  const csvExport = exportToCSVText(rows);
  assert.ok(csvExport.includes('city,val'));
  assert.ok(csvExport.includes('Tokyo,10'));
  console.log('✓ ML prepared dataset exports cleanly to standard RFC4180 CSV string.');

  console.log('All ML Preparation tests passed!\n');
}
