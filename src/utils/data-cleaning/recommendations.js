/**
 * Automated Data Quality Recommendations Engine.
 * Automatically scans the dataset for hygiene issues and recommends tailored,
 * context-aware fixes without silently corrupting or deleting valid data.
 */

import {
  handleMissingValues,
  removeDuplicates,
  handleOutliers,
  getMode,
} from './cleaner.js';

/**
 * Generate intelligent, context-aware cleaning recommendations
 */
export function generateQualityRecommendations(dataset, profile) {
  const recommendations = [];
  const { totalRows } = dataset;

  // 1. Duplicate Records
  if (profile.duplicateRowsCount > 0) {
    recommendations.push({
      id: 'rec-duplicates',
      type: 'REMOVE_DUPLICATES',
      title: 'Purge Exact Duplicate Records',
      issue: `Found ${profile.duplicateRowsCount} duplicate row(s) (${profile.duplicateRowsPercent}% of dataset).`,
      impact: 'High',
      suggestedAction: 'Remove duplicate rows',
      rationale: 'Exact row duplicates artificially inflate category counts and distort summary statistics.',
      params: {},
    });
  }

  // 2. Missing Values in Columns
  profile.columns.forEach(col => {
    if (col.nullCount > 0) {
      if (col.type === 'number') {
        const stats = col.stats;
        const isSkewed = stats && stats.stdDev > 0 && Math.abs(stats.mean - stats.median) / stats.stdDev > 0.25;
        const strategy = isSkewed || col.outlierCount > 0 ? 'median' : 'mean';

        recommendations.push({
          id: `rec-missing-${col.name}`,
          type: 'HANDLE_MISSING',
          column: col.name,
          title: `Impute Missing Values in "${col.name}"`,
          issue: `${col.nullCount} missing numerical cell(s) (${col.nullPercentage}%).`,
          impact: col.nullPercentage > 15 ? 'High' : 'Medium',
          suggestedAction: `Fill with ${strategy} (${strategy === 'median' ? stats?.median : stats?.mean})`,
          rationale: strategy === 'median'
            ? `Column distribution is skewed or contains outliers; median (${stats?.median}) is mathematically robust to extreme values.`
            : `Column distribution is relatively symmetrical; mean (${stats?.mean}) preserves the overall sample average.`,
          params: { column: col.name, strategy, constantValue: '' },
        });
      } else {
        // String / Categorical column
        const modeVal = getMode(dataset.rows.map(r => r[col.name]));
        recommendations.push({
          id: `rec-missing-${col.name}`,
          type: 'HANDLE_MISSING',
          column: col.name,
          title: `Impute Missing Categories in "${col.name}"`,
          issue: `${col.nullCount} missing categorical cell(s) (${col.nullPercentage}%).`,
          impact: col.nullPercentage > 15 ? 'High' : 'Low',
          suggestedAction: modeVal ? `Fill with mode ("${modeVal}")` : 'Fill with "Unknown"',
          rationale: modeVal
            ? `Replaces missing entries with the most frequently observed category ("${modeVal}").`
            : 'Fills missing text values with a clear "Unknown" constant placeholder.',
          params: { column: col.name, strategy: modeVal ? 'mode' : 'constant', constantValue: 'Unknown' },
        });
      }
    }
  });

  // 3. Outlier Fences (Continuous Metrics)
  profile.columns.forEach(col => {
    if (col.type === 'number' && col.outlierCount > 0 && !col.isIdentifier) {
      const stats = col.stats;
      const lower = stats.q1 - 1.5 * stats.iqr;
      const upper = stats.q3 + 1.5 * stats.iqr;

      recommendations.push({
        id: `rec-outlier-${col.name}`,
        type: 'HANDLE_OUTLIERS',
        column: col.name,
        title: `Calibrate Statistical Outliers in "${col.name}"`,
        issue: `${col.outlierCount} extreme observation(s) outside 1.5x IQR boundaries [${lower.toFixed(1)}, ${upper.toFixed(1)}].`,
        impact: 'Medium',
        suggestedAction: 'Winsorize / Cap to 1.5x IQR bounds',
        rationale: 'Winsorization prevents extreme values from distorting linear models and averages while safely preserving valid observation rows without data deletion.',
        params: { column: col.name, action: 'cap' },
      });
    }
  });

  return recommendations;
}

/**
 * Applies a list of recommendations in batch
 */
export function applyRecommendationsBatch(dataset, selectedRecs) {
  let currentDataset = dataset;
  const appliedTransformations = [];

  for (const rec of selectedRecs) {
    if (rec.type === 'REMOVE_DUPLICATES') {
      const res = removeDuplicates(currentDataset);
      currentDataset = res.dataset;
      appliedTransformations.push(res.transformation);
    } else if (rec.type === 'HANDLE_MISSING') {
      const res = handleMissingValues(
        currentDataset,
        rec.params.column,
        rec.params.strategy,
        rec.params.constantValue
      );
      currentDataset = res.dataset;
      appliedTransformations.push(res.transformation);
    } else if (rec.type === 'HANDLE_OUTLIERS') {
      const res = handleOutliers(currentDataset, rec.params.column, rec.params.action);
      currentDataset = res.dataset;
      appliedTransformations.push(res.transformation);
    }
  }

  return {
    dataset: currentDataset,
    transformations: appliedTransformations,
  };
}
