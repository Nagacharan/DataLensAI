/**
 * Safe Analytical Query Pipeline for "Ask Your Data".
 * Deterministically parses natural language user questions, maps them to dataset columns,
 * executes verified mathematical operations, and returns structured analytical results.
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
 * Deterministically execute user query against active dataset
 */
export function executeDatasetQuery(query, dataset, profile) {
  const q = query.trim().toLowerCase();
  const { rows, columns, totalRows } = dataset;
  const numCols = columns.filter(c => c.type === 'number');
  const catCols = columns.filter(c => c.type === 'string');
  const dateCols = columns.filter(c => c.type === 'date');

  // 1. Overview / Summary / Key Takeaways
  if (q.includes('overview') || q.includes('tell me') || q.includes('summary') || q.includes('what does this dataset') || q.includes('about')) {
    return {
      intent: 'DATASET_OVERVIEW',
      question: query,
      answer: `This dataset contains ${totalRows.toLocaleString()} rows and ${columns.length} columns (${numCols.length} numerical, ${catCols.length} categorical, ${dateCols.length} date/time). Overall data quality score is ${profile.dataQualityScore}/100 with ${profile.missingCellsPercent}% missing cells.`,
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

  // 2. Data Quality / Missing / Duplicates
  if (q.includes('missing') || q.includes('null') || q.includes('duplicate') || q.includes('quality') || q.includes('hygiene')) {
    const colsWithMissing = profile.columns.filter(c => c.nullCount > 0);
    return {
      intent: 'DATA_QUALITY',
      question: query,
      answer: `Found ${profile.totalMissingCells} missing cells across ${colsWithMissing.length} column(s) and ${profile.duplicateRowsCount} duplicate row(s). ${colsWithMissing.length > 0 ? `Columns with missing values: ${colsWithMissing.map(c => `${c.name} (${c.nullCount})`).join(', ')}.` : 'No columns have missing values.'}`,
      evidence: [
        { label: 'Missing Cells', value: profile.totalMissingCells },
        { label: 'Missing %', value: `${profile.missingCellsPercent}%` },
        { label: 'Duplicate Rows', value: profile.duplicateRowsCount },
        { label: 'Quality Score', value: `${profile.dataQualityScore}/100` },
      ],
      chartData: null,
    };
  }

  // 3. Correlation between two variables
  if (q.includes('correlation') || q.includes('relate') || q.includes('relationship') || q.includes('association')) {
    // Find numeric columns mentioned
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
        answer: `The Pearson correlation coefficient between "${colA.name}" and "${colB.name}" is ${r}. This represents a ${Math.abs(r) >= 0.5 ? 'strong' : Math.abs(r) >= 0.2 ? 'moderate' : 'weak'} ${r >= 0 ? 'positive' : 'negative'} linear association.`,
        evidence: [
          { label: 'Feature 1', value: colA.name },
          { label: 'Feature 2', value: colB.name },
          { label: 'Pearson r', value: r },
        ],
        chartData: null,
      };
    }
  }

  // 4. Outliers
  if (q.includes('outlier') || q.includes('anomaly') || q.includes('extreme')) {
    const matchedNum = findMatchingColumn(q, numCols, 'number') || numCols[0];
    if (matchedNum) {
      const pCol = profile.columns.find(c => c.name === matchedNum.name);
      return {
        intent: 'OUTLIER_INSPECTION',
        question: query,
        answer: `Column "${matchedNum.name}" has ${pCol.outlierCount} outlier(s) detected using the 1.5x IQR method. Minimum observed value is ${pCol.stats.min}, and maximum is ${pCol.stats.max}.`,
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

  // 5. Ranking / Top Categories / Highest / Lowest
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

  // 6. Average / Mean / Sum / Count of a specific column
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

  // 7. Time Trends
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
    answer: `I analyzed your query regarding "${query}". For the most accurate numerical calculation, you can specify column names (e.g. "${catCols[0]?.name || 'Category'}" or "${numCols[0]?.name || 'Amount'}") or ask for specific operations like sum, average, highest ranking, or correlations.`,
    evidence: [
      { label: 'Available Columns', value: columns.slice(0, 5).map(c => c.name).join(', ') },
      { label: 'Total Rows', value: totalRows.toLocaleString() },
    ],
    chartData: null,
  };
}
