/**
 * Mathematical binning and distribution utilities.
 */

export function computeHistogramBins(values, binCount = 8) {
  const nums = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (nums.length === 0) return [];

  const min = nums[0];
  const max = nums[nums.length - 1];
  if (min === max) {
    return [{ bin: `${min}`, count: nums.length }];
  }

  const binWidth = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => {
    const low = min + i * binWidth;
    const high = low + binWidth;
    return {
      bin: `${low >= 1000 ? (low / 1000).toFixed(1) + 'k' : low.toFixed(0)}-${high >= 1000 ? (high / 1000).toFixed(1) + 'k' : high.toFixed(0)}`,
      count: 0,
    };
  });

  nums.forEach(v => {
    let idx = Math.floor((v - min) / binWidth);
    if (idx >= binCount) idx = binCount - 1;
    bins[idx].count++;
  });

  return bins;
}
