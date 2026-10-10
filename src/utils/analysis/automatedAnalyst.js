/**
 * Autonomous Analytical Engine.
 * Intelligently analyzes the dataset schema and automatically selects the most
 * relevant, high-value calculations and visual configurations.
 */

import { calculateNumericStats } from './statistics.js';
import { aggregateByGroup, aggregateByTime } from './aggregations.js';
import { buildCorrelationMatrix } from './correlations.js';
import { computeHistogramBins } from './distributions.js';

export function runAutomatedAnalysis(dataset, profile, semanticUnderstanding) {
  const { rows, totalRows } = dataset;
  if (!rows || rows.length === 0) return null;

  const { primaryMetric, primaryCategory, primaryDate, columns } = semanticUnderstanding;

  const allNumCols = columns.filter(c => c.type === 'number');
  const allCatCols = columns.filter(c => c.type === 'string' || c.type === 'boolean');
  const numCols = columns.filter(c => c.type === 'number' && !c.isIdentifier).length > 0
    ? columns.filter(c => c.type === 'number' && !c.isIdentifier)
    : allNumCols;
  const catCols = columns.filter(c => (c.type === 'string' || c.type === 'boolean') && !c.isIdentifier).length > 0
    ? columns.filter(c => (c.type === 'string' || c.type === 'boolean') && !c.isIdentifier)
    : allCatCols;
  const dateCols = columns.filter(c => c.type === 'date');

  // 1. Primary Metric Descriptive Analysis
  const metricName = primaryMetric ? primaryMetric.name : numCols[0]?.name;
  const primaryStats = metricName
    ? calculateNumericStats(rows.map(r => r[metricName]))
    : null;

  // 2. Automated Category Volume Aggregation (Bar Chart)
  let categoryBarChart = null;
  const categoryCol = primaryCategory || catCols[0];
  if (categoryCol && metricName) {
    const grouped = aggregateByGroup(rows, categoryCol.name, metricName, 'sum', 8);
    if (grouped.length > 0) {
      const totalVolume = grouped.reduce((sum, g) => sum + g.value, 0);
      const topGroup = grouped[0];
      const topPct = totalVolume > 0 ? ((topGroup.value / totalVolume) * 100).toFixed(1) : 0;

      categoryBarChart = {
        title: `Total ${metricName} by ${categoryCol.name}`,
        subtitle: `Top performer "${topGroup.group}" accounts for ${topPct}% of aggregate volume`,
        data: grouped,
        xKey: 'group',
        yKey: 'value',
        topGroup,
        totalVolume,
      };
    }
  }

  // 3. Automated Category Proportions (Donut Chart)
  let categoryDonutChart = null;
  const donutCat = catCols.find(c => c.uniqueCount >= 2 && c.uniqueCount <= 7) || categoryCol;
  if (donutCat) {
    const donutData = aggregateByGroup(
      rows,
      donutCat.name,
      metricName || null,
      metricName ? 'sum' : 'count',
      6
    ).map(g => ({ name: g.group, value: g.value }));

    if (donutData.length >= 2) {
      categoryDonutChart = {
        title: `${donutCat.name} Share & Distribution`,
        subtitle: `Proportional breakdown across ${donutCat.uniqueCount} segments`,
        data: donutData,
      };
    }
  }

  // 4. Automated Time Trend Analysis (Line Chart)
  let timeSeriesChart = null;
  if (primaryDate && metricName) {
    const trendData = aggregateByTime(rows, primaryDate.name, metricName, 'sum', 'month');
    if (trendData.length >= 2) {
      const first = trendData[0];
      const last = trendData[trendData.length - 1];
      const changePct = first.value > 0 ? (((last.value - first.value) / first.value) * 100).toFixed(1) : 0;

      timeSeriesChart = {
        title: `${metricName} Historical Progression`,
        subtitle: `Trajectory from ${first.date} to ${last.date} (${changePct >= 0 ? '+' : ''}${changePct}%)`,
        data: trendData,
        xKey: 'date',
        yKey: 'value',
        firstPeriod: first,
        lastPeriod: last,
        changePct,
      };
    }
  }

  // 5. Automated Frequency Distribution (Histogram)
  let distributionHistogram = null;
  if (metricName && primaryStats && primaryStats.count >= 2) {
    const metricVals = rows.map(r => r[metricName]).filter(v => typeof v === 'number');
    const bins = computeHistogramBins(metricVals, 8);
    distributionHistogram = {
      title: `${metricName} Frequency Distribution`,
      subtitle: `Equal-width binned observation counts (Median: ${primaryStats.median.toLocaleString()})`,
      values: metricVals,
      bins,
      stats: primaryStats,
    };
  }

  // 6. Automated Correlation & Scatter Analysis
  let correlationAnalysis = null;
  let scatterPlot = null;
  if (numCols.length >= 2) {
    const nonIdNames = numCols.map(c => c.name);
    const corrMatrix = buildCorrelationMatrix(rows, nonIdNames);
    const strongest = corrMatrix[0] || {
      columnA: numCols[0].name,
      columnB: numCols[1].name,
      correlation: 0,
      strength: 'neutral',
      direction: 'independent',
    };

    correlationAnalysis = {
      matrix: corrMatrix.slice(0, 5),
      strongest,
    };

    // Scatter plot of strongest pair or first pair
    const colX = strongest.columnA;
    const colY = strongest.columnB;
    const scatterPoints = rows
      .filter(r => typeof r[colX] === 'number' && typeof r[colY] === 'number')
      .slice(0, 150)
      .map(r => ({ x: r[colX], y: r[colY] }));

    scatterPlot = {
      title: `Relationship: ${colX} vs ${colY}`,
      subtitle: `Bivariate correlation scatter plot (Pearson r = ${strongest.correlation})`,
      data: scatterPoints,
      xLabel: colX,
      yLabel: colY,
      r: strongest.correlation,
    };
  }

  return {
    primaryMetricName: metricName,
    primaryStats,
    categoryBarChart,
    categoryDonutChart,
    timeSeriesChart,
    distributionHistogram,
    correlationAnalysis,
    scatterPlot,
  };
}
