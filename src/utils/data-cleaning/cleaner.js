/**
 * Data Cleaning & Transformation Pipeline.
 * Pure functions that produce a new dataset and a log of changes without mutating original data.
 */

import { calculateNumericStats } from '../analysis/statistics.js';
import { parseDateSafe } from '../file-parsers/normalizer.js';

/**
 * Find mode (most frequent value) of an array
 */
export function getMode(values) {
  const counts = new Map();
  let maxCount = 0;
  let modeVal = null;

  values.forEach(v => {
    if (v === null || v === undefined || v === '') return;
    const str = String(v);
    const count = (counts.get(str) || 0) + 1;
    counts.set(str, count);
    if (count > maxCount) {
      maxCount = count;
      modeVal = v;
    }
  });

  return modeVal;
}

/**
 * Remove duplicate rows
 */
export function removeDuplicates(dataset) {
  const seen = new Set();
  const cleanedRows = [];
  let duplicatesRemoved = 0;

  dataset.rows.forEach(row => {
    const serialized = JSON.stringify(row);
    if (seen.has(serialized)) {
      duplicatesRemoved++;
    } else {
      seen.add(serialized);
      cleanedRows.push({ ...row });
    }
  });

  return {
    dataset: {
      ...dataset,
      rows: cleanedRows,
      totalRows: cleanedRows.length,
    },
    transformation: {
      type: 'REMOVE_DUPLICATES',
      description: `Removed ${duplicatesRemoved} duplicate row(s).`,
      recordsAffected: duplicatesRemoved,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle missing values in a column
 * strategies: 'drop_row' | 'mean' | 'median' | 'mode' | 'constant'
 */
export function handleMissingValues(dataset, columnName, strategy, constantValue = '') {
  const colDef = dataset.columns.find(c => c.name === columnName);
  if (!colDef) throw new Error(`Column "${columnName}" not found.`);

  const originalRows = dataset.rows;
  let recordsAffected = 0;
  let fillValue = null;

  if (strategy === 'drop_row') {
    const cleanedRows = originalRows.filter(r => {
      const isMissing = r[columnName] === null || r[columnName] === undefined || r[columnName] === '';
      if (isMissing) recordsAffected++;
      return !isMissing;
    });

    return {
      dataset: {
        ...dataset,
        rows: cleanedRows,
        totalRows: cleanedRows.length,
      },
      transformation: {
        type: 'DROP_MISSING_ROWS',
        column: columnName,
        description: `Dropped ${recordsAffected} row(s) with missing values in "${columnName}".`,
        recordsAffected,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Calculate fill value
  if (strategy === 'mean' || strategy === 'median') {
    const stats = calculateNumericStats(originalRows.map(r => r[columnName]));
    fillValue = strategy === 'mean' ? stats.mean : stats.median;
  } else if (strategy === 'mode') {
    fillValue = getMode(originalRows.map(r => r[columnName]));
  } else if (strategy === 'constant') {
    if (colDef.type === 'number') {
      const num = Number(constantValue);
      fillValue = isNaN(num) ? 0 : num;
    } else {
      fillValue = constantValue;
    }
  }

  const cleanedRows = originalRows.map(r => {
    const isMissing = r[columnName] === null || r[columnName] === undefined || r[columnName] === '';
    if (isMissing) {
      recordsAffected++;
      return { ...r, [columnName]: fillValue };
    }
    return { ...r };
  });

  return {
    dataset: {
      ...dataset,
      rows: cleanedRows,
    },
    transformation: {
      type: 'IMPUTE_MISSING',
      column: columnName,
      strategy,
      fillValue,
      description: `Imputed missing values in "${columnName}" with ${strategy} (${fillValue}).`,
      recordsAffected,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Cast / convert column data type
 */
export function convertColumnType(dataset, columnName, targetType) {
  const originalRows = dataset.rows;
  let failedCount = 0;
  let convertedCount = 0;

  const cleanedRows = originalRows.map(row => {
    const val = row[columnName];
    if (val === null || val === undefined || val === '') return { ...row };

    let newVal = val;
    let failed = false;

    if (targetType === 'number') {
      const num = Number(String(val).replace(/,/g, '').trim());
      if (isNaN(num)) {
        failed = true;
        newVal = null;
      } else {
        newVal = num;
      }
    } else if (targetType === 'date') {
      const d = parseDateSafe(val);
      if (!d) {
        failed = true;
        newVal = null;
      } else {
        newVal = d.toISOString();
      }
    } else if (targetType === 'boolean') {
      const s = String(val).toLowerCase().trim();
      newVal = s === 'true' || s === '1' || s === 'yes';
    } else {
      newVal = String(val);
    }

    if (failed) failedCount++;
    else convertedCount++;

    return { ...row, [columnName]: newVal };
  });

  const updatedColumns = dataset.columns.map(c => 
    c.name === columnName ? { ...c, type: targetType } : c
  );

  return {
    dataset: {
      ...dataset,
      columns: updatedColumns,
      rows: cleanedRows,
    },
    transformation: {
      type: 'CONVERT_TYPE',
      column: columnName,
      targetType,
      recordsAffected: convertedCount,
      failedCount,
      description: `Converted "${columnName}" to ${targetType}. (${convertedCount} converted, ${failedCount} unparseable set to null).`,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle outliers (IQR)
 * action: 'cap' (Winsorization) | 'remove_row'
 */
export function handleOutliers(dataset, columnName, action = 'cap') {
  const colDef = dataset.columns.find(c => c.name === columnName);
  if (!colDef || colDef.type !== 'number') {
    throw new Error(`Outlier handling requires a numeric column.`);
  }

  const values = dataset.rows.map(r => r[columnName]).filter(v => typeof v === 'number');
  const stats = calculateNumericStats(values);

  if (stats.count < 4 || stats.iqr === 0) {
    throw new Error('Not enough variance to compute IQR bounds for outliers.');
  }

  const lowerBound = stats.q1 - 1.5 * stats.iqr;
  const upperBound = stats.q3 + 1.5 * stats.iqr;

  let affectedCount = 0;

  if (action === 'remove_row') {
    const cleanedRows = dataset.rows.filter(r => {
      const v = r[columnName];
      const isOutlier = typeof v === 'number' && (v < lowerBound || v > upperBound);
      if (isOutlier) affectedCount++;
      return !isOutlier;
    });

    return {
      dataset: {
        ...dataset,
        rows: cleanedRows,
        totalRows: cleanedRows.length,
      },
      transformation: {
        type: 'REMOVE_OUTLIERS',
        column: columnName,
        bounds: { lower: lowerBound, upper: upperBound },
        recordsAffected: affectedCount,
        description: `Removed ${affectedCount} outlier row(s) in "${columnName}" outside [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}].`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Cap / Winsorize
  const cleanedRows = dataset.rows.map(r => {
    const v = r[columnName];
    if (typeof v === 'number') {
      if (v < lowerBound) {
        affectedCount++;
        return { ...r, [columnName]: Number(lowerBound.toFixed(4)) };
      }
      if (v > upperBound) {
        affectedCount++;
        return { ...r, [columnName]: Number(upperBound.toFixed(4)) };
      }
    }
    return { ...r };
  });

  return {
    dataset: {
      ...dataset,
      rows: cleanedRows,
    },
    transformation: {
      type: 'CAP_OUTLIERS',
      column: columnName,
      bounds: { lower: lowerBound, upper: upperBound },
      recordsAffected: affectedCount,
      description: `Capped ${affectedCount} outlier(s) in "${columnName}" to IQR bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}].`,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Drop an entire column
 */
export function dropColumn(dataset, columnName) {
  const updatedColumns = dataset.columns.filter(c => c.name !== columnName);
  const updatedRows = dataset.rows.map(r => {
    const copy = { ...r };
    delete copy[columnName];
    return copy;
  });

  return {
    dataset: {
      ...dataset,
      columns: updatedColumns,
      rows: updatedRows,
      totalColumns: updatedColumns.length,
    },
    transformation: {
      type: 'DROP_COLUMN',
      column: columnName,
      description: `Dropped column "${columnName}".`,
      recordsAffected: dataset.rows.length,
      timestamp: new Date().toISOString(),
    },
  };
}
