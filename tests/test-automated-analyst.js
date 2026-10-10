import assert from 'node:assert';
import { salesDataset } from '../src/utils/sample-datasets/salesData.js';
import { normalizeDataset } from '../src/utils/file-parsers/normalizer.js';
import { profileDataset } from '../src/utils/analysis/statistics.js';
import { buildDatasetUnderstanding } from '../src/utils/analysis/semanticProfiler.js';
import {
  generateQualityRecommendations,
  applyRecommendationsBatch,
} from '../src/utils/data-cleaning/recommendations.js';
import { runAutomatedAnalysis } from '../src/utils/analysis/automatedAnalyst.js';
import { executeDatasetQuery } from '../src/utils/ask-data/queryEngine.js';

export function testAutomatedAnalyst() {
  console.log('--- Testing Semantic Profiler & Automated Analyst Engine ---');

  const normalized = normalizeDataset(salesDataset.data, salesDataset.name);
  const profile = profileDataset(normalized);

  // 1. Semantic Understanding & Observed Facts vs Inferred Meanings
  const understanding = buildDatasetUnderstanding(normalized, profile);
  assert.ok(understanding.columns.length > 0);
  assert.ok(understanding.executiveSummary.includes('sales') || understanding.executiveSummary.includes('Sales'));

  const idCol = understanding.columns.find(c => c.name === 'Order_ID');
  assert.strictEqual(idCol.semanticRole, 'identifier');
  assert.ok(idCol.observedFacts.includes('distinct values'));
  assert.ok(idCol.inferredMeaning.includes('tracking key') || idCol.inferredMeaning.includes('identifier'));

  const revCol = understanding.columns.find(c => c.name === 'Revenue');
  assert.strictEqual(revCol.semanticRole, 'monetary_metric');
  assert.ok(revCol.observedFacts.includes('range') || revCol.observedFacts.includes('Values'));
  assert.ok(revCol.inferredMeaning.includes('financial') || revCol.inferredMeaning.includes('currency'));
  console.log('✓ Semantic Profiler accurately distinguishes observed facts from inferred meanings.');

  // 2. Automated Quality Recommendations
  const recs = generateQualityRecommendations(normalized, profile);
  assert.ok(recs.length >= 2, 'Should identify duplicates, missing values, and outliers in sales dataset');

  const dupRec = recs.find(r => r.type === 'REMOVE_DUPLICATES');
  assert.ok(dupRec, 'Should recommend removing duplicate row');

  const missingRec = recs.find(r => r.type === 'HANDLE_MISSING');
  assert.ok(missingRec, 'Should recommend imputing missing values');
  console.log(`✓ Quality Recommendations Engine generated ${recs.length} context-aware recommendations.`);

  // 3. Batch 1-Click Execution of Recommendations
  const batchRes = applyRecommendationsBatch(normalized, recs);
  assert.strictEqual(batchRes.dataset.totalRows, 24, 'Duplicate removal should purge 1 duplicate row');
  const cleanedProfile = profileDataset(batchRes.dataset);
  assert.strictEqual(cleanedProfile.totalMissingCells, 0, 'All missing values should be resolved');
  assert.strictEqual(cleanedProfile.duplicateRowsCount, 0, 'All duplicates should be resolved');
  console.log('✓ 1-Click batch recommendation application resolved all quality issues cleanly.');

  // 4. Automated Analysis Pipeline
  const autoAnalysis = runAutomatedAnalysis(normalized, profile, understanding);
  assert.ok(autoAnalysis.categoryBarChart !== null, 'Should produce category volume bar chart');
  assert.ok(autoAnalysis.categoryDonutChart !== null, 'Should produce category share donut chart');
  assert.ok(autoAnalysis.distributionHistogram !== null, 'Should produce distribution histogram');
  assert.ok(autoAnalysis.correlationAnalysis !== null, 'Should produce correlation matrix');
  console.log('✓ Automated Analysis Pipeline selected and computed all verified visualization configs.');

  // 5. Terminology Questions in Query Engine
  const stdDevQ = executeDatasetQuery('What is standard deviation?', normalized, profile);
  assert.strictEqual(stdDevQ.intent, 'TERMINOLOGY_EXPLANATION');
  assert.ok(stdDevQ.answer.includes('dispersion') || stdDevQ.answer.includes('variation'));

  const iqrQ = executeDatasetQuery('What is IQR?', normalized, profile);
  assert.strictEqual(iqrQ.intent, 'TERMINOLOGY_EXPLANATION');
  assert.ok(iqrQ.answer.includes('Q3 - Q1'));
  console.log('✓ Ask Your Data handles analytical terminology questions accurately.');

  console.log('All Automated Analyst tests passed!\n');
}
