/**
 * Deterministic Insights & Pattern Identification Engine.
 * Extracts mathematically verified facts, category rankings, correlations,
 * outliers, and quality alerts from raw dataset and statistics.
 */

import { calculateNumericStats, calculateFrequency } from '../analysis/statistics.js';
import { aggregateByGroup, aggregateByTime } from '../analysis/aggregations.js';
import { buildCorrelationMatrix } from '../analysis/correlations.js';

export function generateDeterministicInsights(dataset, profile) {
  const insights = [];
  const { rows, columns, totalRows } = dataset;
  if (!rows || rows.length === 0) return insights;

  const numCols = columns.filter(c => c.type === 'number');
  const catCols = columns.filter(c => c.type === 'string' && !c.isIdentifier);
  const dateCols = columns.filter(c => c.type === 'date');

  // 1. Data Quality & Completeness Insight
  if (profile.missingCellsPercent > 0 || profile.duplicateRowsCount > 0) {
    insights.push({
      id: 'quality-alert',
      category: 'Data Quality',
      type: 'warning',
      title: 'Data Hygiene and Integrity Alert',
      summary: `Found ${profile.totalMissingCells} missing cells (${profile.missingCellsPercent}%) across the dataset and ${profile.duplicateRowsCount} duplicate rows (${profile.duplicateRowsPercent}%).`,
      evidence: [
        { label: 'Total Rows', value: totalRows.toLocaleString() },
        { label: 'Missing Cells', value: `${profile.missingCellsPercent}%` },
        { label: 'Duplicate Rows', value: profile.duplicateRowsCount },
        { label: 'Health Score', value: `${profile.dataQualityScore}/100` },
      ],
      recommendation: 'Review missing values in the Data Cleaning tab and consider mean/median imputation or row removal before deeper downstream modeling.',
    });
  } else {
    insights.push({
      id: 'quality-pristine',
      category: 'Data Quality',
      type: 'success',
      title: 'High Integrity: Pristine Dataset',
      summary: `The dataset contains 0 missing cells and 0 duplicate rows across ${totalRows.toLocaleString()} observations and ${columns.length} features.`,
      evidence: [
        { label: 'Completeness', value: '100%' },
        { label: 'Integrity Score', value: '100/100' },
      ],
      recommendation: 'Data quality is optimal. Ready for immediate exploratory analysis.',
    });
  }

  // 2. High-Impact Category Concentration (Pareto / Concentration Analysis)
  if (catCols.length > 0 && numCols.length > 0) {
    const primaryCat = catCols[0].name;
    const primaryNum = numCols.find(c => !c.isIdentifier) ? numCols.find(c => !c.isIdentifier).name : numCols[0].name;

    const grouped = aggregateByGroup(rows, primaryCat, primaryNum, 'sum', 10);
    if (grouped.length >= 2) {
      const totalSum = grouped.reduce((acc, g) => acc + g.value, 0);
      const top1 = grouped[0];
      const top1Pct = totalSum > 0 ? ((top1.value / totalSum) * 100).toFixed(1) : 0;
      const bottom1 = grouped[grouped.length - 1];

      insights.push({
        id: 'category-concentration',
        category: 'Concentration Analysis',
        type: 'info',
        title: `Leading Category in ${primaryNum}: "${top1.group}"`,
        summary: `"${top1.group}" contributes ${top1Pct}% of the aggregate ${primaryNum} across all observed categories, exceeding the lowest segment "${bottom1.group}" by ${(top1.value / (bottom1.value || 1)).toFixed(1)}x.`,
        evidence: [
          { label: `Top Segment`, value: top1.group },
          { label: `Top Volume`, value: top1.value.toLocaleString() },
          { label: `Share of Total`, value: `${top1Pct}%` },
          { label: `Lowest Segment`, value: bottom1.group },
        ],
        relevantColumn: primaryCat,
        recommendation: `Assess whether the heavy concentration in "${top1.group}" represents strategic opportunity or dependency risk.`,
      });
    }
  }

  // 3. Significant Correlations Analysis
  if (numCols.length >= 2) {
    const nonIdNumCols = numCols.filter(c => !c.isIdentifier).map(c => c.name);
    const correlations = buildCorrelationMatrix(rows, nonIdNumCols);
    const strongCorr = correlations.find(c => Math.abs(c.correlation) >= 0.5);

    if (strongCorr) {
      const dirText = strongCorr.correlation > 0 ? 'positive' : 'inverse (negative)';
      insights.push({
        id: `correlation-${strongCorr.columnA}-${strongCorr.columnB}`,
        category: 'Statistical Association',
        type: 'trend',
        title: `Notable ${dirText} correlation: ${strongCorr.columnA} & ${strongCorr.columnB}`,
        summary: `Strong ${dirText} Pearson correlation coefficient of r = ${strongCorr.correlation} observed between "${strongCorr.columnA}" and "${strongCorr.columnB}".`,
        evidence: [
          { label: 'Pearson r', value: String(strongCorr.correlation) },
          { label: 'Relationship', value: strongCorr.strength.toUpperCase() },
          { label: 'Direction', value: strongCorr.direction.toUpperCase() },
        ],
        relevantColumn: strongCorr.columnA,
        recommendation: `Note: Correlation indicates linear co-movement, not causal effect. Investigate underlying drivers before making business interventions.`,
      });
    }
  }

  // 4. Outlier & Anomaly Detection
  numCols.forEach(col => {
    const profileCol = profile.columns.find(c => c.name === col.name);
    if (profileCol && profileCol.outlierCount > 0) {
      insights.push({
        id: `outlier-${col.name}`,
        category: 'Distribution Anomaly',
        type: 'warning',
        title: `Statistical Outliers Detected in "${col.name}"`,
        summary: `Detected ${profileCol.outlierCount} observation(s) (${profileCol.outlierPercentage}%) lying outside 1.5x IQR boundaries [${(profileCol.stats.q1 - 1.5 * profileCol.stats.iqr).toFixed(2)}, ${(profileCol.stats.q3 + 1.5 * profileCol.stats.iqr).toFixed(2)}].`,
        evidence: [
          { label: 'Outlier Count', value: profileCol.outlierCount },
          { label: 'Min Value', value: profileCol.stats.min.toLocaleString() },
          { label: 'Max Value', value: profileCol.stats.max.toLocaleString() },
          { label: 'Median', value: profileCol.stats.median.toLocaleString() },
        ],
        relevantColumn: col.name,
        recommendation: `Inspect extreme observations in the Data Cleaning tab to verify if they reflect genuine high-value events or measurement entry errors.`,
      });
    }
  });

  // 5. Time Series Trend (if date column exists)
  if (dateCols.length > 0 && numCols.length > 0) {
    const dateCol = dateCols[0].name;
    const metricCol = numCols.find(c => !c.isIdentifier) ? numCols.find(c => !c.isIdentifier).name : numCols[0].name;
    const timeTrend = aggregateByTime(rows, dateCol, metricCol, 'sum', 'month');

    if (timeTrend.length >= 2) {
      const first = timeTrend[0];
      const last = timeTrend[timeTrend.length - 1];
      const changePct = first.value > 0 ? (((last.value - first.value) / first.value) * 100).toFixed(1) : 0;
      const isGrowth = last.value >= first.value;

      insights.push({
        id: 'temporal-trend',
        category: 'Temporal Trajectory',
        type: isGrowth ? 'success' : 'trend',
        title: `${metricCol} Trajectory: ${isGrowth ? 'Expansion' : 'Contraction'} Over Time`,
        summary: `Between ${first.date} and ${last.date}, total ${metricCol} changed from ${first.value.toLocaleString()} to ${last.value.toLocaleString()} (${changePct}% shift).`,
        evidence: [
          { label: 'Start Period', value: `${first.date} (${first.value.toLocaleString()})` },
          { label: 'End Period', value: `${last.date} (${last.value.toLocaleString()})` },
          { label: 'Overall Change', value: `${changePct}%` },
        ],
        relevantColumn: dateCol,
        recommendation: 'Cross-examine seasonal peaks and historical milestones against promotional or external business cycles.',
      });
    }
  }

  return insights.slice(0, 6);
}

/**
 * Dynamically generates context-aware suggested analytical questions
 */
export function generateSuggestedQuestions(dataset) {
  const questions = [];
  const { columns } = dataset;
  const numCols = columns.filter(c => c.type === 'number' && !c.isIdentifier);
  const catCols = columns.filter(c => c.type === 'string' && !c.isIdentifier);
  const dateCols = columns.filter(c => c.type === 'date');

  // Generic exploratory question
  questions.push({
    category: 'Overview',
    question: 'What are the key takeaways and summary statistics of this dataset?',
  });

  // Category vs metric ranking
  if (catCols.length > 0 && numCols.length > 0) {
    const cat = catCols[0].name;
    const metric = numCols[0].name;
    questions.push({
      category: 'Ranking',
      question: `Which ${cat} has the highest total ${metric}?`,
    });
    questions.push({
      category: 'Comparison',
      question: `What is the average ${metric} grouped by ${cat}?`,
    });
  }

  // Correlation
  if (numCols.length >= 2) {
    questions.push({
      category: 'Correlation',
      question: `Is there a strong correlation between ${numCols[0].name} and ${numCols[1].name}?`,
    });
  }

  // Time trend
  if (dateCols.length > 0 && numCols.length > 0) {
    questions.push({
      category: 'Trend',
      question: `How has ${numCols[0].name} trended over time?`,
    });
  }

  // Data hygiene
  questions.push({
    category: 'Quality',
    question: 'Are there missing values or statistical outliers in the dataset?',
  });

  return questions;
}
