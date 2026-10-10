/**
 * Safe Analytical Query Pipeline for "Ask Your Data".
 * Deterministically parses natural language user questions, maps them to dataset columns,
 * executes verified mathematical operations, explains terminology, and returns structured analytical results.
 * If a question is improper, gibberish, or unclear, responds strictly with "Please give the question properly."
 */

import { calculateNumericStats } from '../analysis/statistics.js';
import { aggregateByGroup, aggregateByTime } from '../analysis/aggregations.js';
import { calculatePearsonCorrelation } from '../analysis/correlations.js';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates whether user prompt is a proper analytical question or related to the dataset
 */
export function isProperQuestion(query, columns) {
  if (!query || typeof query !== 'string') return false;
  const q = query.trim().toLowerCase();
  if (q.length < 2) return false;

  // Must contain alphanumeric characters
  if (!/[a-z0-9]/i.test(q)) return false;

  // Check if it matches or contains any column name in the dataset
  if (columns && Array.isArray(columns)) {
    for (const col of columns) {
      const colNameLower = col.name.toLowerCase();
      if (new RegExp(`\\b${escapeRegExp(colNameLower)}\\b`, 'i').test(q) || q === colNameLower) return true;
      const tokens = colNameLower.split(/[^a-z0-9]+/).filter(t => t.length >= 3);
      for (const tok of tokens) {
        if (new RegExp(`\\b${escapeRegExp(tok)}\\b`, 'i').test(q)) return true;
      }
    }
  }

  // Analytical, statistical, and question intent keywords
  const validKeywords = [
    'what', 'which', 'how', 'why', 'who', 'where', 'when', 'can', 'is', 'are', 'tell', 'show',
    'explain', 'give', 'find', 'list', 'calculate', 'compare', 'describe', 'about', 'details',
    'sum', 'total', 'average', 'avg', 'mean', 'median', 'mode', 'min', 'minimum', 'max',
    'maximum', 'lowest', 'highest', 'top', 'bottom', 'best', 'worst', 'most', 'least', 'count',
    'std', 'standard deviation', 'variance', 'distribution', 'range', 'iqr', 'interquartile',
    'quartile', 'percentile', 'correlation', 'correlate', 'relate', 'relationship', 'association',
    'trend', 'timeline', 'time', 'month', 'year', 'day', 'date', 'growth', 'change', 'progression',
    'missing', 'null', 'nan', 'duplicate', 'outlier', 'anomaly', 'quality', 'health', 'hygiene',
    'overview', 'summary', 'dataset', 'data', 'row', 'rows', 'column', 'columns', 'feature',
    'features', 'table', 'records', 'limitation', 'limitations', 'insight', 'insights',
    'winsoriz', 'winsorization', 'impute', 'imputation', 'pearson', 'chart', 'charts'
  ];

  return validKeywords.some(kw => {
    const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
    return regex.test(q);
  });
}

/**
 * Fuzzy search to match words in user query to dataset column names
 */
export function findMatchingColumn(query, columns, filterType = null) {
  const cleanQuery = query.toLowerCase();
  const eligibleCols = filterType ? columns.filter(c => c.type === filterType) : columns;

  // 1. Exact match
  for (const col of eligibleCols) {
    const colLower = col.name.toLowerCase();
    if (cleanQuery.includes(colLower)) {
      return col;
    }
  }

  // 2. Token / stem match
  let bestCol = null;
  let maxScore = 0;

  for (const col of eligibleCols) {
    const colWords = col.name.toLowerCase().split(/[^a-z0-9]+/);
    let matchCount = 0;
    for (const w of colWords) {
      if (w.length >= 3 && cleanQuery.includes(w)) {
        matchCount++;
      }
    }
    const score = matchCount / colWords.length;
    if (score > maxScore && score >= 0.4) {
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
      answer: `Standard Deviation measures statistical dispersion and variation from the average. A low standard deviation means values cluster close to the mean; a high standard deviation indicates a wide spread.`,
      evidence: [
        { label: 'Concept', value: 'Standard Deviation' },
        { label: 'Formula', value: 'sqrt(Σ(x - μ)² / (N - 1))' },
        { label: 'Meaning', value: 'Spread around mean' },
      ],
      chartData: null,
    };
  }

  if (q.includes('iqr') || q.includes('interquartile') || q.includes('quartile')) {
    return {
      intent: 'TERMINOLOGY_EXPLANATION',
      answer: `Interquartile Range (IQR) is Q3 - Q1 (the middle 50% of values). Observations beyond 1.5×IQR from Q1 or Q3 are identified as statistical outliers.`,
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
      answer: `Pearson correlation coefficient (r) ranges from -1.0 to +1.0 and measures linear relationship strength. Note: correlation does not imply causation.`,
      evidence: [
        { label: 'Range', value: '[-1.0, +1.0]' },
        { label: 'Strong', value: '|r| ≥ 0.7' },
        { label: 'Moderate', value: '0.4 ≤ |r| < 0.7' },
      ],
      chartData: null,
    };
  }

  if (q.includes('winsoriz') || (q.includes('capping') && q.includes('outlier'))) {
    return {
      intent: 'TERMINOLOGY_EXPLANATION',
      answer: `Winsorization caps extreme outliers to the boundary fence (1.5×IQR) rather than deleting rows, preserving all observations in the dataset.`,
      evidence: [
        { label: 'Technique', value: 'Winsorization' },
        { label: 'Action', value: 'Caps to 1.5x IQR' },
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
  const q = (query || '').trim().toLowerCase();
  const { rows, columns, totalRows } = dataset;
  const numCols = columns.filter(c => c.type === 'number');
  const catCols = columns.filter(c => c.type === 'string');
  const dateCols = columns.filter(c => c.type === 'date');

  // Guard: If question is improper or gibberish, immediately reject
  if (!isProperQuestion(query, columns)) {
    return {
      intent: 'IMPROPER_QUESTION',
      question: query,
      answer: 'Please give the question properly.',
      evidence: [],
      chartData: null,
    };
  }

  // 1. Terminology questions
  const termRes = handleTerminologyQuestions(q);
  if (termRes) {
    return { ...termRes, question: query };
  }

  // 2. Dataset Overview
  if (q.includes('overview') || q.includes('summary') || q.includes('tell me about') || q.includes('what does this dataset') || q.includes('what is this data')) {
    return {
      intent: 'DATASET_OVERVIEW',
      question: query,
      answer: `This dataset contains ${totalRows.toLocaleString()} rows and ${columns.length} columns (${numCols.length} numerical, ${catCols.length} categorical, ${dateCols.length} date/time). Overall data health score is ${profile.dataQualityScore}/100 with ${profile.missingCellsPercent}% missing cells.`,
      evidence: [
        { label: 'Total Rows', value: totalRows.toLocaleString() },
        { label: 'Total Columns', value: columns.length },
        { label: 'Numeric Features', value: numCols.length },
        { label: 'Categorical Features', value: catCols.length },
        { label: 'Health Score', value: `${profile.dataQualityScore}/100` },
      ],
      chartData: null,
    };
  }

  // 3. Data Limitations
  if (q.includes('limitation') || q.includes('cannot answer') || q.includes('caveat') || q.includes('bias')) {
    const nullCols = profile.columns.filter(c => c.nullCount > 0);
    return {
      intent: 'LIMITATIONS_ANALYSIS',
      question: query,
      answer: `Key limitations: 1) Based on ${totalRows.toLocaleString()} recorded observations. 2) Correlations indicate linear association, not causation. 3) ${nullCols.length > 0 ? `Missing values in ${nullCols.map(c => c.name).join(', ')} require imputation.` : 'Dataset is complete, but may be subject to sampling boundaries.'}`,
      evidence: [
        { label: 'Sample Volume', value: `${totalRows.toLocaleString()} rows` },
        { label: 'Missing Columns', value: nullCols.length },
      ],
      chartData: null,
    };
  }

  // 4. Data Quality / Missing / Duplicates
  if (q.includes('missing') || q.includes('null') || q.includes('duplicate') || q.includes('quality') || q.includes('hygiene') || q.includes('health score')) {
    const colsWithMissing = profile.columns.filter(c => c.nullCount > 0);
    return {
      intent: 'DATA_QUALITY',
      question: query,
      answer: `There are ${profile.totalMissingCells} missing cells across ${colsWithMissing.length} column(s) and ${profile.duplicateRowsCount} duplicate row(s). Data health score is ${profile.dataQualityScore}/100.${colsWithMissing.length > 0 ? ` Columns with missing data: ${colsWithMissing.map(c => `${c.name} (${c.nullCount})`).join(', ')}.` : ''}`,
      evidence: [
        { label: 'Missing Cells', value: profile.totalMissingCells },
        { label: 'Missing %', value: `${profile.missingCellsPercent}%` },
        { label: 'Duplicate Rows', value: profile.duplicateRowsCount },
        { label: 'Health Score', value: `${profile.dataQualityScore}/100` },
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
        answer: `The Pearson correlation coefficient between "${colA.name}" and "${colB.name}" is ${r}. This represents a ${Math.abs(r) >= 0.5 ? 'strong' : Math.abs(r) >= 0.2 ? 'moderate' : 'weak'} ${r >= 0 ? 'positive' : 'negative'} relationship.`,
        evidence: [
          { label: 'Feature 1', value: colA.name },
          { label: 'Feature 2', value: colB.name },
          { label: 'Pearson r', value: r },
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
        answer: `Column "${matchedNum.name}" has ${pCol.outlierCount} outlier(s) based on 1.5×IQR fences [${(pCol.stats.q1 - 1.5 * pCol.stats.iqr).toFixed(2)}, ${(pCol.stats.q3 + 1.5 * pCol.stats.iqr).toFixed(2)}]. Min: ${pCol.stats.min}, Max: ${pCol.stats.max}.`,
        evidence: [
          { label: 'Column', value: matchedNum.name },
          { label: 'Outlier Count', value: pCol.outlierCount },
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
          answer: `The ${isLowest ? 'lowest' : 'highest'} ${matchedCat.name} by total ${matchedNum.name} is "${top.group}" with ${top.value.toLocaleString()} across ${top.count} records.`,
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
  if (q.includes('average') || q.includes('mean') || q.includes('sum') || q.includes('total') || q.includes('count') || q.includes('how many rows')) {
    if (q.includes('how many rows') || q.includes('row count') || q.includes('total rows') || (q.includes('count') && !numCols.some(c => q.includes(c.name.toLowerCase())))) {
      return {
        intent: 'ROW_COUNT',
        question: query,
        answer: `The dataset contains a total of ${totalRows.toLocaleString()} rows and ${columns.length} columns.`,
        evidence: [
          { label: 'Total Rows', value: totalRows.toLocaleString() },
          { label: 'Total Columns', value: columns.length },
        ],
        chartData: null,
      };
    }

    const matchedNum = findMatchingColumn(q, numCols, 'number') || numCols[0];
    if (matchedNum) {
      const stats = calculateNumericStats(rows.map(r => r[matchedNum.name]));
      const isAvg = q.includes('average') || q.includes('mean');

      return {
        intent: 'NUMERIC_SUMMARY',
        question: query,
        answer: isAvg
          ? `The average ${matchedNum.name} is ${stats.mean.toLocaleString()} (Median: ${stats.median.toLocaleString()}, StdDev: ${stats.stdDev.toLocaleString()}).`
          : `The total sum of ${matchedNum.name} is ${stats.sum.toLocaleString()} across ${stats.count} rows (Average: ${stats.mean.toLocaleString()}).`,
        evidence: [
          { label: 'Column', value: matchedNum.name },
          { label: 'Sum', value: stats.sum.toLocaleString() },
          { label: 'Mean', value: stats.mean.toLocaleString() },
          { label: 'Median', value: stats.median.toLocaleString() },
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
        answer: `Tracked ${metricCol} across ${trendData.length} monthly periods from "${dateCol}".`,
        evidence: [
          { label: 'Timeline', value: dateCol },
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

  // 10. Direct Column Inquiry (e.g. user just asks "Temperature" or "what about Region")
  const directCol = findMatchingColumn(q, columns);
  if (directCol) {
    if (directCol.type === 'number') {
      const stats = calculateNumericStats(rows.map(r => r[directCol.name]));
      return {
        intent: 'COLUMN_INQUIRY',
        question: query,
        answer: `Column "${directCol.name}" has ${stats.count} numeric records ranging from ${stats.min} to ${stats.max} with a mean of ${stats.mean.toLocaleString()} (median: ${stats.median.toLocaleString()}).`,
        evidence: [
          { label: 'Column', value: directCol.name },
          { label: 'Mean', value: stats.mean.toLocaleString() },
          { label: 'Median', value: stats.median.toLocaleString() },
          { label: 'Min / Max', value: `${stats.min} / ${stats.max}` },
        ],
        chartData: null,
      };
    } else {
      const grouped = aggregateByGroup(rows, directCol.name, null, 'count', 5);
      return {
        intent: 'COLUMN_INQUIRY',
        question: query,
        answer: `Column "${directCol.name}" has ${grouped.length} top categories, led by "${grouped[0]?.group || 'N/A'}" with ${grouped[0]?.value || 0} records.`,
        evidence: [
          { label: 'Column', value: directCol.name },
          { label: 'Top Category', value: grouped[0]?.group || 'N/A' },
          { label: 'Top Count', value: grouped[0]?.value || 0 },
        ],
        chartData: null,
      };
    }
  }

  // If none of the specific analytical patterns matched, it is an improper or unanswerable query
  return {
    intent: 'IMPROPER_QUESTION',
    question: query,
    answer: 'Please give the question properly.',
    evidence: [],
    chartData: null,
  };
}
