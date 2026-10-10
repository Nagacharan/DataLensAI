/**
 * Safe Analytical Query Pipeline for "Ask Your Data".
 * Deterministically parses natural language user questions, maps them to dataset columns,
 * executes verified mathematical operations, explains terminology, and returns structured analytical results.
 */

import { calculateNumericStats } from '../analysis/statistics.js';
import { aggregateByGroup, aggregateByTime } from '../analysis/aggregations.js';
import { calculatePearsonCorrelation } from '../analysis/correlations.js';

/**
 * Fuzzy search to match words in user query to dataset column names
 */
export function findMatchingColumn(query, columns, filterType = null) {
  const cleanQuery = query.toLowerCase();
  const eligibleCols = filterType ? columns.filter(c => c.type === filterType) : columns;

  // Exact match
  for (const col of eligibleCols) {
    const colLower = col.name.toLowerCase();
    if (cleanQuery.includes(colLower)) {
      return col;
    }
  }

  // Token / stem match
  let bestCol = null;
  let maxScore = 0;

  for (const col of eligibleCols) {
    const colWords = col.name.toLowerCase().split(/[^a-z0-9]+/);
    let matchCount = 0;
    for (const w of colWords) {
      if (w.length > 2 && cleanQuery.includes(w)) {
        matchCount++;
      }
    }
    const score = matchCount / colWords.length;
    if (score > maxScore && score >= 0.5) {
      maxScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

/**
 * Handle analytical and statistical terminology questions
 */
function handleTerminologyQuestions(q) {
  if (q.includes('standard deviation') || q.includes('std dev') || q.includes('variance')) {
    return {
      intent: 'TERMINOLOGY_EXPLANATION',
      answer: `Standard Deviation (StdDev) measures the amount of variation or dispersion in a set of numerical values. A low standard deviation indicates that the values tend to be close to the mean, while a high standard deviation indicates that values are spread out over a wider range. In this dataset, we use sample standard deviation (N-1 degrees of freedom).`,
      evidence: [
        { label: 'Concept', value: 'Standard Deviation' },
        { label: 'Formula', value: 'sqrt(Σ(x - μ)² / (N - 1))' },
        { label: 'Interpretation', value: 'Spread around mean' },
      ],
      chartData: null,
    };
  }

  if (q.includes('iqr') || q.includes('interquartile') || q.includes('quartile')) {
    return {
      intent: 'TERMINOLOGY_EXPLANATION',
      answer: `Interquartile Range (IQR) is the distance between the 75th percentile (Q3) and the 25th percentile (Q1): IQR = Q3 - Q1. It measures statistical dispersion of the middle 50% of your data and is robust to extreme values. Observations beyond Q1 - 1.5×IQR or Q3 + 1.5×IQR are classified as potential statistical outliers using Tukey's rule.`,
      evidence: [
        { label: 'Concept', value: 'Interquartile Range (IQR)' },
        { label: 'Formula', value: 'Q3 - Q1' },
        { label: 'Outlier Rule', value: '1.5 × IQR fences' },
      ],
      chartData: null,
    };
  }

  if (q.includes('pearson') || (q.includes('correlation') && (q.includes('what is') || q.includes('mean by')))) {
    return {
      intent: 'TERMINOLOGY_EXPLANATION',
      answer: `Pearson correlation coefficient (r) measures the strength and direction of a linear relationship between two continuous variables, ranging from -1.0 (perfect inverse) to +1.0 (perfect positive), with 0 indicating no linear relationship. IMPORTANT: Correlation demonstrates co-movement, NOT causal effect.`,
      evidence: [
        { label: 'Range', value: '[-1.0, +1.0]' },
        { label: 'Strong', value: '|r| ≥ 0.7' },
        { label: 'Moderate', value: '0.4 ≤ |r| < 0.7' },
        { label: 'Caveat', value: 'Correlation ≠ Causation' },
      ],
      chartData: null,
    };
  }

  if (q.includes('winsoriz') || (q.includes('capping') && q.includes('outlier'))) {
    return {
      intent: 'TERMINOLOGY_EXPLANATION',
      answer: `Winsorization (outlier capping) is a non-destructive data cleaning technique that sets extreme outliers to the nearest boundary of a specified fence (such as 1.5×IQR). Unlike row deletion, Winsorization preserves the sample size of your dataset while preventing severe skewness from distorting averages and regression models.`,
      evidence: [
        { label: 'Technique', value: 'Winsorization' },
        { label: 'Data Preservation', value: '100% rows kept' },
        { label: 'Adjustment', value: 'Capped to boundary' },
      ],
      chartData: null,
    };
  }

  return null;
}

/**
 * Deterministically execute user query against active dataset
 */
export function executeDatasetQuery(query, dataset, profile, conversationHistory = []) {
  const q = query.trim().toLowerCase();
  const { rows, columns, totalRows } = dataset;
  const numCols = columns.filter(c => c.type === 'number');
  const catCols = columns.filter(c => c.type === 'string');
  const dateCols = columns.filter(c => c.type === 'date');

  // 1. Check for Terminology questions
  const termRes = handleTerminologyQuestions(q);
  if (termRes) {
    return { ...termRes, question: query };
  }

  // 2. Dataset Overview / What does this dataset tell me?
  if (q.includes('overview') || q.includes('tell me') || q.includes('summary') || q.includes('what does this dataset') || q.includes('about')) {
    return {
      intent: 'DATASET_OVERVIEW',
      question: query,
      answer: `This dataset contains ${totalRows.toLocaleString()} rows and ${columns.length} columns (${numCols.length} numerical, ${catCols.length} categorical, ${dateCols.length} date/time). Overall data health score is ${profile.dataQualityScore}/100 with ${profile.missingCellsPercent}% missing cells and ${profile.duplicateRowsCount} duplicate rows.`,
      evidence: [
        { label: 'Total Rows', value: totalRows.toLocaleString() },
        { label: 'Total Columns', value: columns.length },
        { label: 'Numeric Features', value: numCols.length },
        { label: 'Categorical Features', value: catCols.length },
        { label: 'Data Quality', value: `${profile.dataQualityScore}/100` },
      ],
      chartData: null,
    };
  }

  // 3. Data Limitations / What can't this dataset answer?
  if (q.includes('limitation') || q.includes('cannot answer') || q.includes('caveat') || q.includes('bias')) {
    const nullCols = profile.columns.filter(c => c.nullCount > 0);
    return {
      intent: 'LIMITATIONS_ANALYSIS',
      question: query,
      answer: `Key limitations of this dataset: 1) Sample size consists of ${totalRows.toLocaleString()} recorded observations, which limits generalizability across unobserved external periods. 2) Observed correlations reflect linear associations, not verified causation. 3) ${nullCols.length > 0 ? `Missing values in ${nullCols.map(c => c.name).join(', ')} require imputation.` : 'No missing values detected, but variables may still exhibit measurement bias.'}`,
      evidence: [
        { label: 'Sample Volume', value: `${totalRows.toLocaleString()} rows` },
        { label: 'Missing Fields', value: nullCols.length },
        { label: 'External Validity', value: 'Confined to observed sample' },
      ],
      chartData: null,
    };
  }

  // 4. Data Quality / Missing / Duplicates
  if (q.includes('missing') || q.includes('null') || q.includes('duplicate') || q.includes('quality') || q.includes('hygiene')) {
    const colsWithMissing = profile.columns.filter(c => c.nullCount > 0);
    return {
      intent: 'DATA_QUALITY',
      question: query,
      answer: `Found ${profile.totalMissingCells} missing cells across ${colsWithMissing.length} column(s) and ${profile.duplicateRowsCount} duplicate row(s). Health score is ${profile.dataQualityScore}/100. ${colsWithMissing.length > 0 ? `Columns with missing values: ${colsWithMissing.map(c => `${c.name} (${c.nullCount})`).join(', ')}.` : 'No columns have missing values.'}`,
      evidence: [
        { label: 'Missing Cells', value: profile.totalMissingCells },
        { label: 'Missing %', value: `${profile.missingCellsPercent}%` },
        { label: 'Duplicate Rows', value: profile.duplicateRowsCount },
        { label: 'Quality Score', value: `${profile.dataQualityScore}/100` },
      ],
      chartData: null,
    };
  }

  // 5. Correlation between two variables
  if (q.includes('correlation') || q.includes('relate') || q.includes('relationship') || q.includes('association')) {
    const matched = numCols.filter(c => q.includes(c.name.toLowerCase()));
    const colA = matched[0] || numCols[0];
    const colB = matched[1] || numCols[1];

    if (colA && colB && colA.name !== colB.name) {
      const valsA = rows.map(r => r[colA.name]);
      const valsB = rows.map(r => r[colB.name]);
      const r = calculatePearsonCorrelation(valsA, valsB);

      return {
        intent: 'CORRELATION',
        question: query,
        answer: `The Pearson correlation coefficient between "${colA.name}" and "${colB.name}" is ${r}. This represents a ${Math.abs(r) >= 0.5 ? 'strong' : Math.abs(r) >= 0.2 ? 'moderate' : 'weak'} ${r >= 0 ? 'positive' : 'negative'} linear association. Note that correlation does not establish causality.`,
        evidence: [
          { label: 'Feature 1', value: colA.name },
          { label: 'Feature 2', value: colB.name },
          { label: 'Pearson r', value: r },
          { label: 'Strength', value: Math.abs(r) >= 0.5 ? 'Strong' : 'Moderate' },
        ],
        chartData: null,
      };
    }
  }

  // 6. Outliers
  if (q.includes('outlier') || q.includes('anomaly') || q.includes('extreme')) {
    const matchedNum = findMatchingColumn(q, numCols, 'number') || numCols[0];
    if (matchedNum) {
      const pCol = profile.columns.find(c => c.name === matchedNum.name);
      return {
        intent: 'OUTLIER_INSPECTION',
        question: query,
        answer: `Column "${matchedNum.name}" has ${pCol.outlierCount} outlier(s) detected using the 1.5×IQR method. Minimum observed value is ${pCol.stats.min}, and maximum is ${pCol.stats.max} (IQR bounds: [${(pCol.stats.q1 - 1.5 * pCol.stats.iqr).toFixed(2)}, ${(pCol.stats.q3 + 1.5 * pCol.stats.iqr).toFixed(2)}]).`,
        evidence: [
          { label: 'Column', value: matchedNum.name },
          { label: 'Outlier Count', value: pCol.outlierCount },
          { label: 'IQR Boundaries', value: `[${(pCol.stats.q1 - 1.5 * pCol.stats.iqr).toFixed(2)}, ${(pCol.stats.q3 + 1.5 * pCol.stats.iqr).toFixed(2)}]` },
          { label: 'Median', value: pCol.stats.median.toLocaleString() },
        ],
        chartData: null,
      };
    }
  }

  // 7. Ranking / Top Categories / Highest / Lowest
  if (q.includes('highest') || q.includes('top') || q.includes('lowest') || q.includes('best') || q.includes('worst') || q.includes('most') || q.includes('least')) {
    const matchedCat = findMatchingColumn(q, catCols, 'string') || catCols[0];
    const matchedNum = findMatchingColumn(q, numCols, 'number') || numCols[0];

    if (matchedCat && matchedNum) {
      const isLowest = q.includes('lowest') || q.includes('worst') || q.includes('least');
      const grouped = aggregateByGroup(rows, matchedCat.name, matchedNum.name, 'sum', 10);

      if (grouped.length > 0) {
        const top = isLowest ? grouped[grouped.length - 1] : grouped[0];
        return {
          intent: 'RANKING',
          question: query,
          answer: `The ${isLowest ? 'lowest' : 'highest'} ${matchedCat.name} by total ${matchedNum.name} is "${top.group}" with a total of ${top.value.toLocaleString()} (${top.count} records).`,
          evidence: [
            { label: `${isLowest ? 'Lowest' : 'Highest'} ${matchedCat.name}`, value: top.group },
            { label: `Total ${matchedNum.name}`, value: top.value.toLocaleString() },
            { label: 'Record Count', value: top.count },
          ],
          chartData: {
            type: 'bar',
            xAxis: 'group',
            yAxis: 'value',
            data: grouped.slice(0, 8),
            title: `Total ${matchedNum.name} by ${matchedCat.name}`,
          },
        };
      }
    }
  }

  // 8. Average / Mean / Sum / Count of a specific column
  if (q.includes('average') || q.includes('mean') || q.includes('sum') || q.includes('total') || q.includes('count')) {
    const matchedNum = findMatchingColumn(q, numCols, 'number');
    if (matchedNum) {
      const stats = calculateNumericStats(rows.map(r => r[matchedNum.name]));
      const isAvg = q.includes('average') || q.includes('mean');
      const isSum = q.includes('sum') || q.includes('total');

      return {
        intent: 'NUMERIC_SUMMARY',
        question: query,
        answer: isAvg
          ? `The average ${matchedNum.name} is ${stats.mean.toLocaleString()} (Median: ${stats.median.toLocaleString()}, StdDev: ${stats.stdDev.toLocaleString()}).`
          : `The total sum of ${matchedNum.name} is ${stats.sum.toLocaleString()} across ${stats.count} valid rows (Average: ${stats.mean.toLocaleString()}).`,
        evidence: [
          { label: 'Column', value: matchedNum.name },
          { label: 'Sum', value: stats.sum.toLocaleString() },
          { label: 'Mean', value: stats.mean.toLocaleString() },
          { label: 'Median', value: stats.median.toLocaleString() },
          { label: 'Min / Max', value: `${stats.min} / ${stats.max}` },
        ],
        chartData: null,
      };
    }
  }

  // 9. Time Trends
  if (q.includes('trend') || q.includes('time') || q.includes('month') || q.includes('year') || q.includes('growth')) {
    if (dateCols.length > 0 && numCols.length > 0) {
      const dateCol = dateCols[0].name;
      const metricCol = numCols[0].name;
      const trendData = aggregateByTime(rows, dateCol, metricCol, 'sum', 'month');

      return {
        intent: 'TIME_TREND',
        question: query,
        answer: `Analyzed ${metricCol} across ${trendData.length} monthly periods recorded under "${dateCol}".`,
        evidence: [
          { label: 'Time Column', value: dateCol },
          { label: 'Metric', value: metricCol },
          { label: 'Periods Count', value: trendData.length },
        ],
        chartData: {
          type: 'line',
          xAxis: 'date',
          yAxis: 'value',
          data: trendData,
          title: `${metricCol} Trend Over Time`,
        },
      };
    }
  }

  // Fallback response with helpful recommendations
  return {
    intent: 'UNKNOWN_OR_GENERAL',
    question: query,
    answer: `I analyzed your query regarding "${query}". For the most accurate numerical calculation, you can specify column names (e.g. "${catCols[0]?.name || 'Category'}" or "${numCols[0]?.name || 'Amount'}"), ask for specific operations (sum, average, highest, lowest), check correlations, or ask about analytical terminology like standard deviation or IQR.`,
    evidence: [
      { label: 'Available Columns', value: columns.slice(0, 5).map(c => c.name).join(', ') },
      { label: 'Total Rows', value: totalRows.toLocaleString() },
    ],
    chartData: null,
  };
}
