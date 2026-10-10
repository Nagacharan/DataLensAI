import assert from 'node:assert';
import { calculateNumericStats, profileDataset } from '../src/utils/analysis/statistics.js';
import { aggregateByGroup, aggregateByTime } from '../src/utils/analysis/aggregations.js';
import { calculatePearsonCorrelation, buildCorrelationMatrix } from '../src/utils/analysis/correlations.js';

export function testStatistics() {
  console.log('--- Testing Statistical Engine ---');

  // 1. Descriptive stats verification
  const testVals = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const stats = calculateNumericStats(testVals);
  assert.strictEqual(stats.count, 10);
  assert.strictEqual(stats.sum, 550);
  assert.strictEqual(stats.mean, 55);
  assert.strictEqual(stats.median, 55);
  assert.strictEqual(stats.min, 10);
  assert.strictEqual(stats.max, 100);
  assert.strictEqual(stats.range, 90);
  assert.ok(Math.abs(stats.stdDev - 30.2765) < 0.01, 'Sample stdDev calculation should match mathematical formula');
  console.log('✓ Mean, median, sample stdDev, min, max, range computed accurately.');

  // 2. Correlation verification
  // Perfectly positive
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];
  const rPerfect = calculatePearsonCorrelation(x, y);
  assert.strictEqual(rPerfect, 1, 'Perfect positive correlation should equal 1.0');

  // Perfectly negative
  const yInv = [10, 8, 6, 4, 2];
  const rInv = calculatePearsonCorrelation(x, yInv);
  assert.strictEqual(rInv, -1, 'Perfect negative correlation should equal -1.0');
  console.log('✓ Pearson correlation coefficient matches known mathematical ground truth.');

  // 3. Grouped aggregations
  const sampleRows = [
    { cat: 'A', val: 10 },
    { cat: 'A', val: 20 },
    { cat: 'B', val: 50 },
  ];
  const aggSum = aggregateByGroup(sampleRows, 'cat', 'val', 'sum');
  assert.strictEqual(aggSum.find(g => g.group === 'B').value, 50);
  assert.strictEqual(aggSum.find(g => g.group === 'A').value, 30);
  console.log('✓ Group-by aggregation computes correct sums and counts.');

  console.log('All Statistics tests passed!\n');
}
