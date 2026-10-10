/**
 * Grouped aggregations, cross-tabulations, and time-based bucketing.
 */

export function aggregateByGroup(rows, groupCol, valueCol = null, method = 'count', limit = 15) {
  if (!rows || rows.length === 0 || !groupCol) return [];

  const groups = new Map();

  rows.forEach(row => {
    const rawKey = row[groupCol];
    const key = rawKey === null || rawKey === undefined || rawKey === '' ? '(Blank)' : String(rawKey);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    if (valueCol) {
      const val = row[valueCol];
      if (typeof val === 'number' && !isNaN(val)) {
        groups.get(key).push(val);
      }
    } else {
      groups.get(key).push(1);
    }
  });

  const results = [];

  for (const [key, vals] of groups.entries()) {
    if (vals.length === 0 && method !== 'count') continue;

    let aggregateVal = 0;
    if (method === 'count') {
      aggregateVal = vals.length;
    } else if (method === 'sum') {
      aggregateVal = vals.reduce((acc, v) => acc + v, 0);
    } else if (method === 'mean' || method === 'avg') {
      aggregateVal = vals.length > 0 ? vals.reduce((acc, v) => acc + v, 0) / vals.length : 0;
    } else if (method === 'min') {
      aggregateVal = vals.length > 0 ? Math.min(...vals) : 0;
    } else if (method === 'max') {
      aggregateVal = vals.length > 0 ? Math.max(...vals) : 0;
    }

    results.push({
      group: key,
      value: Number(aggregateVal.toFixed(2)),
      count: vals.length,
    });
  }

  // Sort descending by value
  results.sort((a, b) => b.value - a.value);

  if (results.length > limit) {
    const top = results.slice(0, limit);
    const otherValues = results.slice(limit);
    const otherSum = otherValues.reduce((sum, r) => sum + r.value, 0);
    top.push({
      group: 'Other',
      value: Number(otherSum.toFixed(2)),
      count: otherValues.reduce((sum, r) => sum + r.count, 0),
    });
    return top;
  }

  return results;
}

/**
 * Time-series aggregation (by Month, Day, or Year)
 */
export function aggregateByTime(rows, dateCol, valueCol = null, method = 'sum', interval = 'month') {
  if (!rows || rows.length === 0 || !dateCol) return [];

  const timeBuckets = new Map();

  rows.forEach(row => {
    const rawDate = row[dateCol];
    if (!rawDate) return;

    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return;

    let bucketKey;
    if (interval === 'year') {
      bucketKey = `${d.getFullYear()}`;
    } else if (interval === 'day') {
      bucketKey = d.toISOString().split('T')[0];
    } else {
      // month
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      bucketKey = `${y}-${m}`;
    }

    if (!timeBuckets.has(bucketKey)) {
      timeBuckets.set(bucketKey, []);
    }

    if (valueCol) {
      const val = row[valueCol];
      if (typeof val === 'number' && !isNaN(val)) {
        timeBuckets.get(bucketKey).push(val);
      }
    } else {
      timeBuckets.get(bucketKey).push(1);
    }
  });

  const sortedKeys = Array.from(timeBuckets.keys()).sort();

  return sortedKeys.map(key => {
    const vals = timeBuckets.get(key);
    let aggregateVal = 0;
    if (method === 'count') {
      aggregateVal = vals.length;
    } else if (method === 'sum') {
      aggregateVal = vals.reduce((acc, v) => acc + v, 0);
    } else if (method === 'mean') {
      aggregateVal = vals.length > 0 ? vals.reduce((acc, v) => acc + v, 0) / vals.length : 0;
    }

    return {
      date: key,
      value: Number(aggregateVal.toFixed(2)),
      count: vals.length,
    };
  });
}
