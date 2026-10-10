import assert from 'node:assert';
import { executeDatasetQuery } from '../src/utils/ask-data/queryEngine.js';
import { profileDataset } from '../src/utils/analysis/statistics.js';
import { salesDataset } from '../src/utils/sample-datasets/salesData.js';
import { normalizeDataset } from '../src/utils/file-parsers/normalizer.js';

export function testQueryEngine() {
  console.log('--- Testing "Ask Your Data" Query Engine ---');

  const normalized = normalizeDataset(salesDataset.data, salesDataset.name);
  const profile = profileDataset(normalized);

  // 1. Overview Question
  const overviewRes = executeDatasetQuery('What does this dataset tell me?', normalized, profile);
  assert.strictEqual(overviewRes.intent, 'DATASET_OVERVIEW');
  assert.ok(overviewRes.answer.includes('rows'));
  console.log('✓ Overview inquiry executes and reports total observation volume and features.');

  // 2. Highest ranking category
  const rankingRes = executeDatasetQuery('Which region generated the highest revenue?', normalized, profile);
  assert.strictEqual(rankingRes.intent, 'RANKING');
  assert.ok(rankingRes.chartData !== null);
  assert.ok(rankingRes.evidence.length >= 2);
  console.log('✓ Ranking inquiry calculates correct group aggregates and includes supporting chart data.');

  // 3. Average metric
  const avgRes = executeDatasetQuery('What is the average revenue?', normalized, profile);
  assert.strictEqual(avgRes.intent, 'NUMERIC_SUMMARY');
  assert.ok(avgRes.answer.includes('average Revenue'));
  console.log('✓ Metric summary query computes verified mean and median.');

  // 4. Missing values
  const missingRes = executeDatasetQuery('Are there missing values in this dataset?', normalized, profile);
  assert.strictEqual(missingRes.intent, 'DATA_QUALITY');
  assert.ok(missingRes.answer.includes('missing cells'));
  console.log('✓ Data quality question details exact missing cell counts.');

  // 5. Improper / Gibberish questions rejection
  const gibberish1 = executeDatasetQuery('uyff', normalized, profile);
  assert.strictEqual(gibberish1.intent, 'IMPROPER_QUESTION');
  assert.strictEqual(gibberish1.answer, 'Please give the question properly.');
  assert.strictEqual(gibberish1.evidence.length, 0);

  const gibberish2 = executeDatasetQuery('asdf', normalized, profile);
  assert.strictEqual(gibberish2.intent, 'IMPROPER_QUESTION');
  assert.strictEqual(gibberish2.answer, 'Please give the question properly.');

  const improperEmpty = executeDatasetQuery('   ', normalized, profile);
  assert.strictEqual(improperEmpty.intent, 'IMPROPER_QUESTION');
  assert.strictEqual(improperEmpty.answer, 'Please give the question properly.');

  const improperSymbols = executeDatasetQuery('???', normalized, profile);
  assert.strictEqual(improperSymbols.intent, 'IMPROPER_QUESTION');
  assert.strictEqual(improperSymbols.answer, 'Please give the question properly.');

  const improperRandom = executeDatasetQuery('hello', normalized, profile);
  assert.strictEqual(improperRandom.intent, 'IMPROPER_QUESTION');
  assert.strictEqual(improperRandom.answer, 'Please give the question properly.');

  console.log('✓ Improper and gibberish queries correctly rejected with "Please give the question properly." and empty evidence.');

  // 6. Conversational dataset inquiry ("tell about the dataset")
  const tellAboutRes = executeDatasetQuery('tell about the dataset', normalized, profile);
  assert.strictEqual(tellAboutRes.intent, 'DATASET_OVERVIEW');
  assert.ok(tellAboutRes.answer.includes('rows'));
  assert.ok(!tellAboutRes.answer.includes('Please give the question properly'));
  console.log('✓ Conversational inquiry "tell about the dataset" correctly analyzed and answered.');

  // 7. Insight follow-up inquiry ("Tell me more about: High Integrity: Pristine Dataset")
  const insightFollowUp = executeDatasetQuery('Tell me more about: High Integrity: Pristine Dataset', normalized, profile);
  assert.ok(insightFollowUp.intent === 'INSIGHT_EXPLANATION' || insightFollowUp.intent === 'DATA_QUALITY');
  assert.ok(!insightFollowUp.answer.includes('Please give the question properly'));
  console.log('✓ Insight follow-up "Tell me more about: High Integrity: Pristine Dataset" correctly analyzed.');

  // 8. General insights query
  const generalInsights = executeDatasetQuery('What are the key insights?', normalized, profile);
  assert.strictEqual(generalInsights.intent, 'INSIGHTS_SUMMARY');
  assert.ok(generalInsights.evidence.length > 0);
  console.log('✓ General insights query correctly answered with supporting evidence.');

  console.log('All Query Engine tests passed!\n');
}
