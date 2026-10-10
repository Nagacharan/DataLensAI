import { normalizeDataset } from './normalizer.js';

/**
 * Flattens a nested object into a single-level object with joined keys
 * e.g., { user: { name: "Alice", address: { city: "Paris" } } }
 * => { "user_name": "Alice", "user_address_city": "Paris" }
 */
export function flattenObject(obj, prefix = '', maxDepth = 4, currentDepth = 0) {
  const result = {};

  if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) {
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const nested = flattenObject(value, newKey, maxDepth, currentDepth + 1);
      Object.assign(result, nested);
    } else if (Array.isArray(value)) {
      // If array contains primitives, join them as comma string; if objects, stringify
      if (value.every(v => typeof v !== 'object')) {
        result[newKey] = value.join(', ');
      } else {
        result[newKey] = JSON.stringify(value);
      }
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Finds the tabular array inside a JSON structure
 */
function findTabularArray(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === 'object') {
    // Check common container keys
    const candidates = ['data', 'records', 'items', 'results', 'rows', 'dataset', 'entries'];
    for (const key of candidates) {
      if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
        return parsed[key];
      }
    }

    // Look for any array value inside the object
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key]) && parsed[key].length > 0 && typeof parsed[key][0] === 'object') {
        return parsed[key];
      }
    }
  }

  return null;
}

/**
 * Parses JSON file or string into a normalized dataset
 */
export async function parseJSON(input, options = {}) {
  let content = '';
  const fileName = options.fileName || (input instanceof File ? input.name : 'data.json');

  if (input instanceof File) {
    content = await input.text();
  } else if (typeof input === 'string') {
    content = input;
  } else if (typeof input === 'object' && input !== null) {
    content = JSON.stringify(input);
  } else {
    throw new Error('Unsupported JSON input format.');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON format: ${err.message}`);
  }

  const arrayData = findTabularArray(parsed);

  if (!arrayData) {
    throw new Error(
      'Could not interpret JSON as a tabular dataset. Expected an array of objects or an object containing a data list (e.g. { data: [...] }).'
    );
  }

  if (arrayData.length === 0) {
    throw new Error('The JSON dataset contains an empty array.');
  }

  // Ensure items are objects, flatten nested objects
  const flattenedRows = arrayData.map((item, index) => {
    if (item === null || typeof item !== 'object') {
      return { value: item, index: index + 1 };
    }
    return flattenObject(item);
  });

  return normalizeDataset(flattenedRows, fileName);
}
