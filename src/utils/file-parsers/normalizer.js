/**
 * Normalizes tabular data from any format into a consistent internal representation.
 * - Deduplicates column names
 * - Infers basic types (number, date, boolean, string)
 * - Identifies missing values (null, undefined, '', 'NA', 'N/A', 'NaN', 'null')
 * - Preserves original values while providing cleaned typed representations
 */

const MISSING_STRINGS = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', 'nil', '-', '—']);

export function isValueEmpty(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    return MISSING_STRINGS.has(trimmed);
  }
  if (Number.isNaN(val)) return true;
  return false;
}

export function deduplicateColumnNames(headers) {
  const seen = new Map();
  return headers.map((header, index) => {
    let name = (header !== undefined && header !== null ? String(header).trim() : '') || `Column_${index + 1}`;
    // Replace problematic punctuation if necessary but keep original readable
    name = name.replace(/[\r\n\t]/g, ' ').trim();
    if (seen.has(name)) {
      const count = seen.get(name) + 1;
      seen.set(name, count);
      return `${name}_${count}`;
    } else {
      seen.set(name, 0);
      return name;
    }
  });
}

/**
 * Check if string looks like an ISO or standard date
 */
export function parseDateSafe(val) {
  if (typeof val !== 'string' && !(val instanceof Date)) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'string') {
    const s = val.trim();
    // Avoid pure numbers being parsed as epoch years (e.g. "2024" or "100")
    if (/^\d{1,6}$/.test(s)) return null;
    // Standard patterns: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, YYYY/MM/DD, etc.
    const datePattern = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})(T|\s|$)/;
    if (datePattern.test(s)) {
      const d = new Date(s);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2100) {
        return d;
      }
    }
  }
  return null;
}

/**
 * Infer data type of an array of values
 * Returns: 'number' | 'date' | 'boolean' | 'string'
 */
export function inferColumnType(values) {
  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  let stringCount = 0;
  let validCount = 0;

  for (const val of values) {
    if (isValueEmpty(val)) continue;
    validCount++;

    if (typeof val === 'boolean') {
      boolCount++;
    } else if (typeof val === 'number') {
      numCount++;
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      if (lower === 'true' || lower === 'false') {
        boolCount++;
      } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
        numCount++;
      } else if (parseDateSafe(trimmed)) {
        dateCount++;
      } else {
        stringCount++;
      }
    } else if (val instanceof Date) {
      dateCount++;
    } else {
      stringCount++;
    }
  }

  if (validCount === 0) return 'string';
  // Require >= 85% match to classify as specific type
  if (numCount / validCount >= 0.85) return 'number';
  if (dateCount / validCount >= 0.85) return 'date';
  if (boolCount / validCount >= 0.85) return 'boolean';
  return 'string';
}

/**
 * Normalizes an array of object rows into standard dataset format:
 * {
 *   fileName: string,
 *   columns: Array<{ name: string, type: 'number'|'string'|'date'|'boolean', originalType: string }>,
 *   rows: Array<Record<string, any>>,
 *   totalRows: number,
 *   totalColumns: number
 * }
 */
export function normalizeDataset(rawRows, fileName = 'dataset') {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      fileName,
      columns: [],
      rows: [],
      totalRows: 0,
      totalColumns: 0,
      isEmpty: true,
    };
  }

  // Collect all unique keys from all rows (handles sparse objects or JSON)
  const headerSet = new Set();
  rawRows.forEach(row => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach(k => headerSet.add(k));
    }
  });

  const rawHeaders = Array.from(headerSet);
  const dedupedHeaders = deduplicateColumnNames(rawHeaders);
  const headerMap = {};
  rawHeaders.forEach((orig, idx) => {
    headerMap[orig] = dedupedHeaders[idx];
  });

  // Extract column values to infer types
  const columnValues = {};
  dedupedHeaders.forEach(col => {
    columnValues[col] = [];
  });

  const normalizedRows = rawRows.map(row => {
    const normRow = {};
    dedupedHeaders.forEach((col, idx) => {
      const origKey = rawHeaders[idx];
      let val = row ? row[origKey] : null;
      if (isValueEmpty(val)) {
        val = null;
      }
      normRow[col] = val;
      columnValues[col].push(val);
    });
    return normRow;
  });

  // Infer types and cast values where appropriate
  const columnDefs = dedupedHeaders.map(col => {
    const inferredType = inferColumnType(columnValues[col]);
    return {
      name: col,
      type: inferredType,
      originalType: inferredType,
    };
  });

  // Cast values based on inferred type for smooth analytics
  const typedRows = normalizedRows.map(row => {
    const typedRow = { ...row };
    columnDefs.forEach(colDef => {
      const val = typedRow[colDef.name];
      if (val === null) return;

      if (colDef.type === 'number') {
        const num = typeof val === 'number' ? val : Number(String(val).replace(/,/g, '').trim());
        typedRow[colDef.name] = isNaN(num) ? null : num;
      } else if (colDef.type === 'date') {
        const d = parseDateSafe(val);
        typedRow[colDef.name] = d ? d.toISOString() : String(val);
      } else if (colDef.type === 'boolean') {
        if (typeof val === 'boolean') {
          typedRow[colDef.name] = val;
        } else {
          const s = String(val).toLowerCase().trim();
          typedRow[colDef.name] = s === 'true' || s === '1' || s === 'yes';
        }
      } else {
        typedRow[colDef.name] = String(val);
      }
    });
    return typedRow;
  });

  return {
    fileName,
    columns: columnDefs,
    rows: typedRows,
    totalRows: typedRows.length,
    totalColumns: columnDefs.length,
    isEmpty: typedRows.length === 0,
  };
}
