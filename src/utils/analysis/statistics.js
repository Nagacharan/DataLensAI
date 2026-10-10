/**
 * Deterministic mathematical and statistical calculations for DataLens AI.
 * Implements count, sum, mean, median, min, max, range, sample std-dev,
 * distinct counts, frequencies, and quartile statistics.
 */

export function calculateNumericStats(values) {
  const nums = values
    .filter(v => v !== null && v !== undefined && typeof v === 'number' && !isNaN(v))
    .sort((a, b) => a - b);

  const count = nums.length;
  if (count === 0) {
    return {
      count: 0,
      sum: 0,
      mean: 0,
      median: 0,
      min: null,
      max: null,
      range: 0,
      stdDev: 0,
      q1: null,
      q3: null,
      iqr: 0,
      validPercentage: 0,
    };
  }

  const sum = nums.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;

  // Median
  let median;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    median = (nums[mid - 1] + nums[mid]) / 2;
  } else {
    median = nums[mid];
  }

  // Quartiles (Q1 = 25th percentile, Q3 = 75th percentile)
  const getPercentile = (p) => {
    const idx = (count - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return nums[lower] * (1 - weight) + nums[upper] * weight;
  };

  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Sample Standard Deviation
  let stdDev = 0;
  if (count > 1) {
    const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count - 1);
    stdDev = Math.sqrt(variance);
  }

  return {
    count,
    sum: Number(sum.toFixed(4)),
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    min: nums[0],
    max: nums[count - 1],
    range: Number((nums[count - 1] - nums[0]).toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    q1: Number(q1.toFixed(4)),
    q3: Number(q3.toFixed(4)),
    iqr: Number(iqr.toFixed(4)),
  };
}

/**
 * Calculates frequency distribution of categorical / discrete values
 */
export function calculateFrequency(values, maxItems = 15) {
  const map = new Map();
  let totalValid = 0;

  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    const key = String(v);
    map.set(key, (map.get(key) || 0) + 1);
    totalValid++;
  }

  const sorted = Array.from(map.entries())
    .map(([val, count]) => ({
      name: val,
      value: count,
      percentage: totalValid > 0 ? Number(((count / totalValid) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const topItems = sorted.slice(0, maxItems);
  if (sorted.length > maxItems) {
    const othersCount = sorted.slice(maxItems).reduce((sum, item) => sum + item.value, 0);
    topItems.push({
      name: 'Other',
      value: othersCount,
      percentage: totalValid > 0 ? Number(((othersCount / totalValid) * 100).toFixed(1)) : 0,
    });
  }

  return {
    items: topItems,
    distinctCount: map.size,
    totalValid,
  };
}

/**
 * Detects whether a column looks like an identifier / primary key:
 * - high uniqueness ratio (> 95%)
 * - or column name contains 'id', 'code', 'uuid', 'guid', 'key'
 */
export function isLikelyIdentifier(columnName, uniqueCount, totalRows) {
  if (totalRows <= 1) return false;
  const lowerName = columnName.toLowerCase();
  const idKeywords = ['id', 'key', 'uuid', 'guid', 'code', 'ref', 'index', 'number', 'no', 'hash'];
  const hasIdKeyword = idKeywords.some(kw => lowerName === kw || lowerName.endsWith(`_${kw}`) || lowerName.startsWith(`${kw}_`));
  const uniqueRatio = uniqueCount / totalRows;

  if (hasIdKeyword && uniqueRatio > 0.8) return true;
  if (uniqueRatio > 0.98 && totalRows > 10) return true;
  return false;
}

/**
 * Full profile of a dataset
 */
export function profileDataset(dataset) {
  const { rows, columns, totalRows, totalColumns } = dataset;

  if (!rows || rows.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      duplicateRowsCount: 0,
      duplicateRowsPercent: 0,
      totalMissingCells: 0,
      totalCells: 0,
      dataQualityScore: 100,
      columns: [],
    };
  }

  // Duplicate rows detection
  const rowStrings = new Set();
  let duplicateCount = 0;
  rows.forEach(r => {
    const str = JSON.stringify(r);
    if (rowStrings.has(str)) {
      duplicateCount++;
    } else {
      rowStrings.add(str);
    }
  });

  let totalMissingCells = 0;
  const totalCells = totalRows * totalColumns;

  const columnProfiles = columns.map(colDef => {
    const colName = colDef.name;
    const values = rows.map(r => r[colName]);
    const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
    totalMissingCells += nullCount;

    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(nonNullValues);
    const uniqueCount = uniqueValues.size;

    let stats = null;
    let frequency = null;
    let outliers = [];

    if (colDef.type === 'number') {
      stats = calculateNumericStats(values);
      // IQR Outlier detection
      if (stats.count >= 4 && stats.iqr > 0) {
        const lowerBound = stats.q1 - 1.5 * stats.iqr;
        const upperBound = stats.q3 + 1.5 * stats.iqr;
        outliers = values.filter(v => typeof v === 'number' && (v < lowerBound || v > upperBound));
      }
    }

    if (colDef.type === 'string' || colDef.type === 'boolean' || (colDef.type === 'number' && uniqueCount <= 10)) {
      frequency = calculateFrequency(values);
    }

    const isId = isLikelyIdentifier(colName, uniqueCount, totalRows);

    return {
      name: colName,
      type: colDef.type,
      nullCount,
      nullPercentage: totalRows > 0 ? Number(((nullCount / totalRows) * 100).toFixed(1)) : 0,
      uniqueCount,
      isIdentifier: isId,
      stats,
      frequency,
      outlierCount: outliers.length,
      outlierPercentage: totalRows > 0 ? Number(((outliers.length / totalRows) * 100).toFixed(1)) : 0,
      sampleValues: Array.from(uniqueValues).slice(0, 5),
    };
  });

  // Calculate high-level Data Quality Score (0 to 100)
  // Deduct for missing values and duplicates
  const missingRatio = totalCells > 0 ? totalMissingCells / totalCells : 0;
  const duplicateRatio = totalRows > 0 ? duplicateCount / totalRows : 0;
  const qualityScore = Math.max(0, Math.round(100 - (missingRatio * 50 + duplicateRatio * 50)));

  return {
    rowCount: totalRows,
    columnCount: totalColumns,
    duplicateRowsCount: duplicateCount,
    duplicateRowsPercent: totalRows > 0 ? Number(((duplicateCount / totalRows) * 100).toFixed(1)) : 0,
    totalMissingCells,
    totalCells,
    missingCellsPercent: totalCells > 0 ? Number(((totalMissingCells / totalCells) * 100).toFixed(1)) : 0,
    dataQualityScore: qualityScore,
    columns: columnProfiles,
  };
}
