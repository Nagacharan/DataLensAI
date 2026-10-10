/**
 * Semantic Dataset Understanding Profiler.
 * Distinguishes observed mathematical facts from inferred semantic column meanings.
 */

export function inferSemanticRole(colDef, uniqueCount, totalRows, sampleValues = []) {
  const nameLower = colDef.name.toLowerCase().trim();
  const type = colDef.type;

  // 1. Primary Identifier
  const idKeywords = ['id', 'key', 'uuid', 'code', 'ref', 'index', 'number', 'no', 'hash'];
  const hasIdKeyword = idKeywords.some(kw => nameLower === kw || nameLower.endsWith(`_${kw}`) || nameLower.startsWith(`${kw}_`));
  const uniqueRatio = totalRows > 0 ? uniqueCount / totalRows : 0;

  if (hasIdKeyword && (uniqueRatio > 0.6 || totalRows > 10)) {
    return {
      role: 'identifier',
      label: 'Unique Identifier',
      observedFacts: `${uniqueCount.toLocaleString()} distinct values across ${totalRows.toLocaleString()} rows (${(uniqueRatio * 100).toFixed(0)}% uniqueness).`,
      inferredMeaning: `Acts as a record-level tracking key or primary identifier (e.g., transaction/student ID). Recommended to exclude from arithmetic aggregations.`,
      confidence: 'High',
    };
  }

  // 2. Monetary / Financial Metric
  const moneyKeywords = ['revenue', 'sales', 'price', 'amount', 'cost', 'spend', 'expense', 'salary', 'budget', 'fee', 'total', 'profit'];
  if (type === 'number' && moneyKeywords.some(kw => nameLower.includes(kw))) {
    return {
      role: 'monetary_metric',
      label: 'Financial / Monetary Metric',
      observedFacts: `Continuous numeric measurement. Values range from ${colDef.stats ? colDef.stats.min.toLocaleString() : 'N/A'} to ${colDef.stats ? colDef.stats.max.toLocaleString() : 'N/A'} (Average: ${colDef.stats ? colDef.stats.mean.toLocaleString() : 'N/A'}).`,
      inferredMeaning: `Represents currency, financial revenue, or transactional monetary amounts. Highly suitable for revenue sums, averages, and profitability analysis.`,
      confidence: 'High',
    };
  }

  // 3. Quantitative Measurement
  if (type === 'number') {
    const isRatio = nameLower.includes('pct') || nameLower.includes('percent') || nameLower.includes('rate') || nameLower.includes('discount');
    return {
      role: isRatio ? 'ratio_metric' : 'quantity_metric',
      label: isRatio ? 'Ratio / Percentage Metric' : 'Quantitative Measurement',
      observedFacts: `Continuous numeric feature with ${uniqueCount} distinct levels. Mean: ${colDef.stats ? colDef.stats.mean.toLocaleString() : 'N/A'}, Median: ${colDef.stats ? colDef.stats.median.toLocaleString() : 'N/A'}, StdDev: ${colDef.stats ? colDef.stats.stdDev.toLocaleString() : 'N/A'}.`,
      inferredMeaning: isRatio
        ? `Represents a normalized rate, proportion, or percentage discount.`
        : `Represents physical quantities, scores, hours, or volume counters. Optimal for distribution histograms, statistical testing, and correlation checks.`,
      confidence: 'High',
    };
  }

  // 4. Temporal / Date
  if (type === 'date') {
    return {
      role: 'temporal',
      label: 'Timeline / Chronological Feature',
      observedFacts: `Chronological timestamp field with ${uniqueCount} recorded date instances.`,
      inferredMeaning: `Represents real-world transaction or recording dates. Essential for identifying seasonality, monthly growth trajectories, and time-series line charts.`,
      confidence: 'High',
    };
  }

  // 5. Categorical Segment / Dimension
  const geoKeywords = ['country', 'region', 'city', 'state', 'territory', 'location'];
  const isGeo = geoKeywords.some(kw => nameLower.includes(kw));

  if (type === 'string' || type === 'boolean') {
    return {
      role: isGeo ? 'geographic_dimension' : 'categorical_dimension',
      label: isGeo ? 'Geographic Dimension' : 'Categorical Segment',
      observedFacts: `${uniqueCount} distinct categories observed (${sampleValues.slice(0, 4).join(', ')}${sampleValues.length > 4 ? '...' : ''}).`,
      inferredMeaning: isGeo
        ? `Represents spatial or geographic boundaries. Ideal for regional performance comparisons and territory breakdowns.`
        : `Represents qualitative grouping segments (departments, product lines, tiers, or status flags). Best visualized using bar charts or proportion donuts.`,
      confidence: uniqueCount <= 20 ? 'High' : 'Moderate',
    };
  }

  return {
    role: 'attribute',
    label: 'Descriptive Attribute',
    observedFacts: `${type} attribute with ${uniqueCount} unique records.`,
    inferredMeaning: `General tabular attribute.`,
    confidence: 'Moderate',
  };
}

/**
 * Builds an automated semantic understanding report for the entire dataset
 */
export function buildDatasetUnderstanding(dataset, profile) {
  const { totalRows, totalColumns, fileName } = dataset;

  const columnUnderstandings = profile.columns.map(colDef => {
    const understanding = inferSemanticRole(
      colDef,
      colDef.uniqueCount,
      totalRows,
      colDef.sampleValues
    );
    return {
      ...colDef,
      semanticRole: understanding.role,
      semanticLabel: understanding.label,
      observedFacts: understanding.observedFacts,
      inferredMeaning: understanding.inferredMeaning,
      confidence: understanding.confidence,
    };
  });

  // Identify primary anchor columns
  const financialMetrics = columnUnderstandings.filter(c => c.semanticRole === 'monetary_metric');
  const quantityMetrics = columnUnderstandings.filter(c => c.semanticRole === 'quantity_metric' || c.semanticRole === 'ratio_metric');
  const primaryMetric = financialMetrics[0] || quantityMetrics[0] || columnUnderstandings.find(c => c.type === 'number' && !c.isIdentifier) || columnUnderstandings.find(c => c.type === 'number');

  const categoricalSegments = columnUnderstandings.filter(c => c.semanticRole === 'categorical_dimension' || c.semanticRole === 'geographic_dimension');
  const primaryCategory = categoricalSegments.find(c => c.uniqueCount >= 2 && c.uniqueCount <= 12) || categoricalSegments[0] || columnUnderstandings.find(c => (c.type === 'string' || c.type === 'boolean') && !c.isIdentifier) || columnUnderstandings.find(c => c.type === 'string' || c.type === 'boolean');

  const temporalColumns = columnUnderstandings.filter(c => c.semanticRole === 'temporal');
  const primaryDate = temporalColumns[0];

  // Plain-language dataset summary
  const domainHint = financialMetrics.length > 0
    ? 'Commercial & Financial Transactions'
    : quantityMetrics.some(q => q.name.toLowerCase().includes('score') || q.name.toLowerCase().includes('grade'))
    ? 'Academic / Educational Performance'
    : 'Operational & Tabular Records';

  const executiveSummary = `DataLens AI analyzed "${fileName}" (${totalRows.toLocaleString()} rows, ${totalColumns} columns). The data reflects ${domainHint}. Primary measurement metric is "${primaryMetric ? primaryMetric.name : 'N/A'}" analyzed across categorical segments such as "${primaryCategory ? primaryCategory.name : 'N/A'}"${primaryDate ? ` spanning timeline records from "${primaryDate.name}"` : ''}. Overall data health score is ${profile.dataQualityScore}/100.`;

  return {
    domainHint,
    executiveSummary,
    primaryMetric,
    primaryCategory,
    primaryDate,
    columns: columnUnderstandings,
  };
}
