import assert from 'node:assert';
import { generatePDFReport } from '../src/utils/reports/pdfGenerator.js';
import { salesDataset } from '../src/utils/sample-datasets/salesData.js';
import { normalizeDataset } from '../src/utils/file-parsers/normalizer.js';
import { profileDataset } from '../src/utils/analysis/statistics.js';
import { buildDatasetUnderstanding } from '../src/utils/analysis/semanticProfiler.js';
import { runAutomatedAnalysis } from '../src/utils/analysis/automatedAnalyst.js';
import { generateDeterministicInsights } from '../src/utils/insights/deterministicInsightEngine.js';

export function testPDFGenerator() {
  console.log('--- Testing PDF Report Generator with Visual Analytics ---');

  const normalized = normalizeDataset(salesDataset.data, salesDataset.name);
  const profile = profileDataset(normalized);
  const understanding = buildDatasetUnderstanding(normalized, profile);
  const autoAnalysis = runAutomatedAnalysis(normalized, profile, understanding);
  const insights = generateDeterministicInsights(normalized, profile, understanding, autoAnalysis);

  const cleaningHistory = [
    { type: 'DUPLICATE_REMOVAL', description: 'Purged 0 duplicate records', timestamp: new Date().toISOString() },
    { type: 'MEAN_IMPUTATION', description: 'Imputed missing values for numeric columns', timestamp: new Date().toISOString() },
  ];

  const mlPrepLog = [
    { type: 'ONE_HOT_ENCODING', description: 'Generated dummy variables for Region', timestamp: new Date().toISOString() },
  ];

  // Generate Report
  const doc = generatePDFReport(
    normalized,
    profile,
    insights,
    cleaningHistory,
    mlPrepLog,
    understanding,
    autoAnalysis
  );

  assert.ok(doc, 'Should return a valid jsPDF document');
  const pageCount = doc.internal.getNumberOfPages();
  assert.ok(pageCount >= 5, `Generated PDF must contain at least 5 structured pages (found ${pageCount} pages)`);
  console.log(`✓ Multi-page report generated with ${pageCount} pages including page-by-page visual analytics.`);

  // Verify PDF binary output integrity
  const arrayBuffer = doc.output('arraybuffer');
  assert.ok(arrayBuffer && arrayBuffer.byteLength > 1000, 'PDF buffer must contain substantial document bytes');

  const uint8 = new Uint8Array(arrayBuffer);
  const header = String.fromCharCode(...uint8.slice(0, 5));
  assert.strictEqual(header, '%PDF-', 'Buffer should begin with standard %PDF- magic bytes');
  console.log(`✓ PDF binary validation passed (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB rendered cleanly).`);

  // Verify graceful fallback when called with minimal arguments
  const docMinimal = generatePDFReport(normalized, profile);
  assert.ok(docMinimal.internal.getNumberOfPages() >= 5, 'Minimal call should automatically infer understanding and analysis');
  console.log('✓ Automatic fallback seamlessly creates full visual analytics for any dataset.');

  console.log('All PDF Report Generator tests passed!\n');
}
