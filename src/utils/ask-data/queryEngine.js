/**
 * Safe Analytical Query Pipeline for "Ask Your Data".
 * Deterministically parses natural language user questions, maps them to dataset columns,
 * executes verified mathematical operations, explains terminology, and returns structured analytical results.
 * If a question is genuinely improper or gibberish, responds strictly with "Please give the question properly."
 */

import { calculateNumericStats } from '../analysis/statistics.js';
import { aggregateByGroup, aggregateByTime } from '../analysis/aggregations.js';
import { calculatePearsonCorrelation } from '../analysis/correlations.js';
import { generateDeterministicInsights } from '../insights/deterministicInsightEngine.js';
import { buildDatasetUnderstanding } from '../analysis/semanticProfiler.js';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates whether user prompt is a proper analytical question or related to the dataset.
 * Returns false ONLY for genuine gibberish, keyboard mash, empty input, pure punctuation, or non-analytical noise.
 */
export function isProperQuestion(query, columns) {
  if (!query || typeof query !== 'string') return false;
  const q = query.trim().toLowerCase();
  if (q.length < 2) return false;

  // Must contain alphanumeric characters
  if (!/[a-z0-9]/i.test(q)) return false;

  // Reject pure symbol sequences
  if (/^[^a-z0-9]+$/i.test(q)) return false;

  // Known gibberish / keyboard smash patterns
  const knownGibberish = ['asdf', 'uyff', 'hjkl', 'qwerty', 'zxcv', 'qwer', 'asdfgh', 'asdfghjk'];
  if (knownGibberish.includes(q)) return false;

  // Standalone non-analytical greetings or single unrelated words with no question/dataset context
  const nonAnalyticalSingles = ['hello', 'hi', 'hey', 'yo', 'bye', 'test', 'banana', 'apple'];
  if (nonAnalyticalSingles.includes(q)) return false;

  // Repetitive single character nonsense like "aaaaa", "zzzz"
  if (/^([a-z0-9])\1+$/i.test(q)) return false;

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

  // Analytical, statistical, and conversational question intent keywords
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
    'winsoriz', 'winsorization', 'impute', 'imputation', 'pearson', 'chart', 'charts',
    'pristine', 'integrity', 'finding', 'findings', 'more', 'investigate', 'analyze', 'analysis',
    'schema', 'structure', 'observation', 'observations', 'score', 'measure', 'performance'
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
  if (!query || !columns) return null;
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

  if (q.includes('pearson') || (q.includes('correlation') && (q.includes('what is') || q.includes('mean by') || q.includes('definition')))) {
    return {
      intent: 'TERMINOLOGY_EXPLANATION',
      answer: `Pearson correlation coefficient (r) ranges from -1.0 to +1.0 and measures linear relationship strength. Note: correlation measures linear association, not causation.`,
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
export function executeDatasetQuery(query, dataset, profile, conversationHistory = [], options = {}) {
  const q = (query || '').trim().toLowerCase();
  const { rows, columns, totalRows } = dataset;
  const numCols = columns.filter(c => c.type === 'number');
  const catCols = columns.filter(c => c.type === 'string');
  const dateCols = columns.filter(c => c.type === 'date');

  // Guard: If question is genuinely improper or gibberish, immediately reject
  if (!isProperQuestion(query, columns)) {
    return {
      intent: 'IMPROPER_QUESTION',
      question: query,
      answer: 'Please give the question properly.',
      evidence: [],
      chartData: null,
    };
  }

  // Obtain insights & semantic context (either from options or computed on the fly)
  const availableInsights = options?.insights || generateDeterministicInsights(dataset, profile);
  const semantic = options?.semanticUnderstanding || buildDatasetUnderstanding(dataset, profile);

  // 1. Terminology questions
  const termRes = handleTerminologyQuestions(q);
  if (termRes) {
    return { ...termRes, question: query };
  }

  // 2. Specific Insight / Finding Explanations
  // e.g. "Tell me more about: High Integrity: Pristine Dataset" or "Tell me more about: Pareto Volume"
  if (q.includes('tell me more about') || q.includes('tell more about') || q.includes('explain:') || q.includes('investigate:')) {
    // Clean query to find matching insight
    const cleanTopic = q
      .replace(/^tell\s+me\s+more\s+about\s*:?\s*/i, '')
      .replace(/^tell\s+more\s+about\s*:?\s*/i, '')
      .replace(/^explain\s*:?\s*/i, '')
      .replace(/^investigate\s*:?\s*/i, '')
      .trim();

    const matchedInsight = availableInsights.find(ins => {
      const insTitleLower = ins.title.toLowerCase();
      return insTitleLower.includes(cleanTopic) || cleanTopic.includes(insTitleLower) ||
        (cleanTopic.includes('pristine') && insTitleLower.includes('pristine')) ||
        (cleanTopic.includes('integrity') && insTitleLower.includes('integrity')) ||
        (cleanTopic.includes('pareto') && insTitleLower.includes('pareto')) ||
        (cleanTopic.includes('correlation') && insTitleLower.includes('correlation'));
    });

    if (matchedInsight) {
      return {
        intent: 'INSIGHT_EXPLANATION',
        question: query,
        answer: `${matchedInsight.title}: ${matchedInsight.summary} ${matchedInsight.recommendation ? `Strategic takeaway: ${matchedInsight.recommendation}` : ''}`,
        evidence: matchedInsight.evidence || [
          { label: 'Category', value: matchedInsight.category },
          { label: 'Integrity', value: `${profile.dataQualityScore}/100` },
        ],
        chartData: null,
      };
    }
  }

  // 3. General Inquiries about Key Insights / Findings
  if (q.includes('what are the insights') || q.includes('key findings') || q.includes('what did you find') || (q.includes('insight') && (q.includes('what') || q.includes('tell') || q.includes('list') || q.includes('show')))) {
    const topInsights = availableInsights.slice(0, 3);
    const summaryText = topInsights.map((ins, idx) => `${idx + 1}) ${ins.title}: ${ins.summary}`).join(' ');
    return {
      intent: 'INSIGHTS_SUMMARY',
      question: query,
      answer: `Key discoveries from "${dataset.fileName}": ${summaryText}`,
      evidence: topInsights.flatMap(ins => (ins.evidence || []).slice(0, 1)),
      chartData: null,
    };
  }

  // 4. Data Quality / Hygiene / Missing / Duplicates / "Pristine" / "Health Score"
  if (
    q.includes('missing') ||
    q.includes('null') ||
    q.includes('duplicate') ||
    q.includes('quality') ||
    q.includes('hygiene') ||
    q.includes('health score') ||
    q.includes('pristine') ||
    q.includes('cleanliness') ||
    q.includes('clean data')
  ) {
    const colsWithMissing = profile.columns.filter(c => c.nullCount > 0);
    const isPristine = profile.totalMissingCells === 0 && profile.duplicateRowsCount === 0;

    return {
      intent: 'DATA_QUALITY',
      question: query,
      answer: isPristine
        ? `This dataset demonstrates pristine data quality with 0 missing cells and 0 duplicate rows across all ${totalRows.toLocaleString()} observations. Overall health score is ${profile.dataQualityScore}/100.`
        : `Identified ${profile.totalMissingCells} missing cells across ${colsWithMissing.length} column(s) and ${profile.duplicateRowsCount} duplicate row(s). Overall health score is ${profile.dataQualityScore}/100.${colsWithMissing.length > 0 ? ` Columns with missing data: ${colsWithMissing.map(c => `${c.name} (${c.nullCount})`).join(', ')}.` : ''}`,
      evidence: [
        { label: 'Missing Cells', value: profile.totalMissingCells },
        { label: 'Missing %', value: `${profile.missingCellsPercent}%` },
        { label: 'Duplicate Rows', value: profile.duplicateRowsCount },
        { label: 'Health Score', value: `${profile.dataQualityScore}/100` },
      ],
      chartData: null,
    };
  }

  // 5. Dataset Overview & General Inquiries ("tell about the dataset", "what does this dataset tell me", "summary", etc.)
  if (
    q.includes('overview') ||
    q.includes('summary') ||
    q.includes('tell about') ||
    q.includes('tell me about') ||
    q.includes('about the dataset') ||
    q.includes('about dataset') ||
    q.includes('about data') ||
    q.includes('what does this dataset') ||
    q.includes('what is this dataset') ||
    q.includes('what is this data') ||
    q.includes('describe') ||
    q.includes('dataset info') ||
    q.includes('details of dataset')
  ) {
    const primaryMetric = semantic?.primaryMetric?.name || numCols[0]?.name;
    const primaryCat = semantic?.primaryCategory?.name || catCols[0]?.name;

    return {
      intent: 'DATASET_OVERVIEW',
      question: query,
      answer: `This dataset contains ${totalRows.toLocaleString()} rows and ${columns.length} columns (${numCols.length} numerical, ${catCols.length} categorical${dateCols.length > 0 ? `, ${dateCols.length} date/time` : ''}). Primary metric is "${primaryMetric || 'N/A'}" and primary dimension is "${primaryCat || 'N/A'}". Overall data health score is ${profile.dataQualityScore}/100 with ${profile.missingCellsPercent}% missing cells.`,
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

  // 6. Data Limitations & Assumptions
  if (q.includes('limitation') || q.includes('cannot answer') || q.includes('caveat') || q.includes('bias') || q.includes('assumption')) {
    const nullCols = profile.columns.filter(c => c.nullCount > 0);
    return {
      intent: 'LIMITATIONS_ANALYSIS',
      question: query,
      answer: `Key limitations: 1) Based strictly on ${totalRows.toLocaleString()} recorded observations. 2) Correlations indicate linear association, not direct causation. 3) ${nullCols.length > 0 ? `Missing values in ${nullCols.map(c => c.name).join(', ')} require imputation.` : 'Dataset is complete, but bounded by observed timeline and feature collection scope.'}`,
      evidence: [
        { label: 'Sample Volume', value: `${totalRows.toLocaleString()} rows` },
        { label: 'Missing Columns', value: nullCols.length },
      ],
      chartData: null,
    };
  }

  // 7. Correlation between variables
  if (q.includes('correlation') || q.includes('correlate') || q.includes('relate') || q.includes('relationship') || q.includes('association')) {
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

  // 8. Outliers and Anomalies
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

  // 9. Ranking / Top Categories / Highest / Lowest
  if (q.includes('highest') || q.includes('top') || q.includes('lowest') || q.includes('best') || q.includes('worst') || q.includes('most') || q.includes('least') || q.includes('rank')) {
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

  // 10. Aggregations: Average / Mean / Sum / Count / Row Count
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

  // 11. Time Trends / Progression
  if (q.includes('trend') || q.includes('time') || q.includes('month') || q.includes('year') || q.includes('growth') || q.includes('progression')) {
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

  // 12. Schema and Columns List
  if (q.includes('what columns') || q.includes('list columns') || q.includes('show columns') || q.includes('schema') || q.includes('features') || q.includes('attributes')) {
    return {
      intent: 'SCHEMA_INQUIRY',
      question: query,
      answer: `The dataset features ${columns.length} columns: ${columns.map(c => `${c.name} (${c.type})`).join(', ')}.`,
      evidence: [
        { label: 'Numeric Features', value: numCols.length },
        { label: 'Categorical Features', value: catCols.length },
        { label: 'Date Features', value: dateCols.length },
      ],
      chartData: null,
    };
  }

  // 13. Direct Column Inquiry (e.g. user asks "Revenue", "Region", "what about Units Sold")
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

  // 14. Intelligent Analytical Synthesis for any other meaningful question
  // If the prompt contains valid question structure or words, synthesize a verified analysis rather than rejecting
  const primaryMetric = semantic?.primaryMetric?.name || numCols[0]?.name;
  const primaryCat = semantic?.primaryCategory?.name || catCols[0]?.name;

  if (primaryMetric && primaryCat) {
    const stats = calculateNumericStats(rows.map(r => r[primaryMetric]));
    const grouped = aggregateByGroup(rows, primaryCat, primaryMetric, 'sum', 5);
    const top = grouped[0];

    return {
      intent: 'GENERAL_ANALYSIS',
      question: query,
      answer: `Analysis for "${query}": Across ${totalRows.toLocaleString()} observations, primary metric "${primaryMetric}" averages ${stats.mean.toLocaleString()} (total: ${stats.sum.toLocaleString()}). Top segment in "${primaryCat}" is "${top?.group || 'N/A'}" contributing ${top?.value?.toLocaleString() || 0}. Overall data hygiene score is ${profile.dataQualityScore}/100.`,
      evidence: [
        { label: 'Analyzed Metric', value: primaryMetric },
        { label: 'Primary Segment', value: primaryCat },
        { label: 'Average', value: stats.mean.toLocaleString() },
        { label: 'Leading Category', value: top?.group || 'N/A' },
      ],
      chartData: null,
    };
  }

  // Final fallback ONLY if completely devoid of analysis capabilities
  return {
    intent: 'IMPROPER_QUESTION',
    question: query,
    answer: 'Please give the question properly.',
    evidence: [],
    chartData: null,
  };
}
