/**
 * ML Preparation Engine.
 * Prepares tabular data for future machine learning models.
 * (Does NOT train models or generate predictions).
 */

import { calculateNumericStats } from '../analysis/statistics.js';
import { calculatePearsonCorrelation } from '../analysis/correlations.js';

/**
 * Identify feature candidates and potential target columns
 */
export function inspectFeaturesForML(dataset, currentTarget = null) {
  const { columns, rows, totalRows } = dataset;

  const features = columns.map(col => {
    const isId = col.isIdentifier;
    let mlRole = 'ignore';
    let prepRecommendation = '';

    if (col.name === currentTarget) {
      mlRole = 'target';
      prepRecommendation = 'Designated Target Variable.';
    } else if (isId) {
      mlRole = 'ignore';
      prepRecommendation = 'Identifier column: Exclude to prevent data leakage and memorization.';
    } else if (col.type === 'number') {
      mlRole = 'numeric';
      prepRecommendation = 'Continuous feature: Scaling optional depending on model type.';
    } else if (col.type === 'string' || col.type === 'boolean') {
      mlRole = 'categorical';
      prepRecommendation = 'Categorical feature: Requires One-Hot or Ordinal encoding.';
    } else if (col.type === 'date') {
      mlRole = 'datetime';
      prepRecommendation = 'Temporal feature: Extract cyclical/calendar components (year, month, weekday).';
    }

    return {
      name: col.name,
      type: col.type,
      suggestedRole: mlRole,
      prepRecommendation,
      nullCount: col.nullCount,
      uniqueCount: col.uniqueCount,
    };
  });

  return features;
}

/**
 * Check for potential target leakage risks
 */
export function detectLeakageRisks(dataset, targetColumn) {
  if (!targetColumn) return [];
  const warnings = [];
  const targetColDef = dataset.columns.find(c => c.name === targetColumn);
  if (!targetColDef) return [];

  const targetValues = dataset.rows.map(r => r[targetColumn]);

  dataset.columns.forEach(col => {
    if (col.name === targetColumn) return;

    // Check correlation if both are numeric
    if (col.type === 'number' && targetColDef.type === 'number') {
      const colValues = dataset.rows.map(r => r[col.name]);
      const r = calculatePearsonCorrelation(colValues, targetValues);
      if (r !== null && Math.abs(r) >= 0.95) {
        warnings.push({
          type: 'HIGH_CORRELATION',
          column: col.name,
          severity: 'high',
          message: `Column "${col.name}" has an extremely high correlation (|r| = ${Math.abs(r).toFixed(2)}) with target "${targetColumn}". This may represent target proxy leakage (e.g., total price vs tax).`,
        });
      }
    }

    // Check if column name hints at outcome or future event
    const lowerName = col.name.toLowerCase();
    const leakageKeywords = ['outcome', 'result', 'status', 'churn_date', 'resolution', 'completed', 'post_'];
    if (leakageKeywords.some(kw => lowerName.includes(kw))) {
      warnings.push({
        type: 'TEMPORAL_OUTCOME_NAME',
        column: col.name,
        severity: 'medium',
        message: `Column "${col.name}" contains keywords suggestive of post-event outcomes. Verify that this information would truly be available at inference time.`,
      });
    }
  });

  return warnings;
}

/**
 * Derive date features from datetime column
 */
export function deriveDateFeatures(rows, dateCol) {
  return rows.map(row => {
    const raw = row[dateCol];
    const copy = { ...row };
    if (!raw) {
      copy[`${dateCol}_year`] = null;
      copy[`${dateCol}_month`] = null;
      copy[`${dateCol}_day`] = null;
      copy[`${dateCol}_weekday`] = null;
      copy[`${dateCol}_isWeekend`] = null;
      return copy;
    }

    const d = new Date(raw);
    if (isNaN(d.getTime())) {
      copy[`${dateCol}_year`] = null;
      copy[`${dateCol}_month`] = null;
      copy[`${dateCol}_day`] = null;
      copy[`${dateCol}_weekday`] = null;
      copy[`${dateCol}_isWeekend`] = null;
    } else {
      copy[`${dateCol}_year`] = d.getFullYear();
      copy[`${dateCol}_month`] = d.getMonth() + 1;
      copy[`${dateCol}_day`] = d.getDate();
      copy[`${dateCol}_weekday`] = d.getDay(); // 0 is Sunday, 6 is Saturday
      copy[`${dateCol}_isWeekend`] = (d.getDay() === 0 || d.getDay() === 6) ? 1 : 0;
    }
    return copy;
  });
}

/**
 * Apply categorical encoding: 'one_hot' or 'label'
 */
export function encodeCategorical(rows, colName, method = 'one_hot', maxCategories = 10) {
  // Collect unique values
  const uniqueVals = Array.from(new Set(rows.map(r => r[colName]).filter(v => v !== null && v !== undefined)));

  if (method === 'label') {
    const valToIdx = new Map();
    uniqueVals.forEach((val, idx) => valToIdx.set(String(val), idx));

    const encodedRows = rows.map(r => {
      const v = r[colName];
      const encoded = v !== null && v !== undefined ? valToIdx.get(String(v)) : null;
      return { ...r, [`${colName}_encoded`]: encoded };
    });

    return {
      rows: encodedRows,
      newColumns: [`${colName}_encoded`],
      mapping: Object.fromEntries(valToIdx),
    };
  }

  // One-Hot Encoding
  const topCategories = uniqueVals.slice(0, maxCategories);
  const newCols = topCategories.map(cat => `${colName}_${String(cat).replace(/[^a-zA-Z0-9]/g, '_')}`);

  const encodedRows = rows.map(r => {
    const copy = { ...r };
    const rawVal = r[colName];
    const strVal = rawVal !== null && rawVal !== undefined ? String(rawVal) : null;

    topCategories.forEach((cat, idx) => {
      const colNameOHE = newCols[idx];
      copy[colNameOHE] = strVal === String(cat) ? 1 : 0;
    });

    return copy;
  });

  return {
    rows: encodedRows,
    newColumns: newCols,
    categories: topCategories,
  };
}

/**
 * Apply numerical scaling: 'min_max' or 'standardize'
 */
export function scaleNumerical(rows, colName, method = 'standardize') {
  const vals = rows.map(r => r[colName]).filter(v => typeof v === 'number');
  const stats = calculateNumericStats(vals);

  if (stats.count === 0 || stats.range === 0) {
    return {
      rows,
      newColumn: `${colName}_scaled`,
      params: stats,
    };
  }

  const newCol = `${colName}_${method === 'min_max' ? 'norm' : 'scaled'}`;

  const scaledRows = rows.map(r => {
    const v = r[colName];
    if (typeof v !== 'number') {
      return { ...r, [newCol]: null };
    }

    let scaled;
    if (method === 'min_max') {
      scaled = (v - stats.min) / (stats.max - stats.min);
    } else {
      // Standardize Z-score
      scaled = stats.stdDev > 0 ? (v - stats.mean) / stats.stdDev : 0;
    }

    return { ...r, [newCol]: Number(scaled.toFixed(4)) };
  });

  return {
    rows: scaledRows,
    newColumn: newCol,
    params: {
      min: stats.min,
      max: stats.max,
      mean: stats.mean,
      stdDev: stats.stdDev,
      method,
    },
  };
}

/**
 * Converts dataset rows to CSV text for ML-ready export
 */
export function exportToCSVText(rows, columnsToInclude = null) {
  if (!rows || rows.length === 0) return '';
  const cols = columnsToInclude || Object.keys(rows[0]);

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = cols.map(c => escapeCSV(c)).join(',');
  const rowLines = rows.map(r => cols.map(c => escapeCSV(r[c])).join(','));
  return [headerLine, ...rowLines].join('\n');
}
