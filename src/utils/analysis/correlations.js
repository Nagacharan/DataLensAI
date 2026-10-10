/**
 * Correlation analysis for numerical columns.
 * Calculates Pearson correlation coefficient (r) between numeric variables.
 */

export function calculatePearsonCorrelation(xVals, yVals) {
  const paired = [];
  for (let i = 0; i < Math.min(xVals.length, yVals.length); i++) {
    const x = xVals[i];
    const y = yVals[i];
    if (x !== null && x !== undefined && !isNaN(x) && y !== null && y !== undefined && !isNaN(y)) {
      paired.push([x, y]);
    }
  }

  const n = paired.length;
  if (n < 3) return null;

  const meanX = paired.reduce((acc, p) => acc + p[0], 0) / n;
  const meanY = paired.reduce((acc, p) => acc + p[1], 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (const [x, y] of paired) {
    const dx = x - meanX;
    const dy = y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0; // constant variation

  const r = num / den;
  return Number(Math.max(-1, Math.min(1, r)).toFixed(3));
}

/**
 * Builds correlation matrix for all numeric columns in dataset
 */
export function buildCorrelationMatrix(rows, numericColumns) {
  if (!numericColumns || numericColumns.length < 2 || !rows || rows.length === 0) {
    return [];
  }

  const matrix = [];
  const columnData = {};
  numericColumns.forEach(col => {
    columnData[col] = rows.map(r => r[col]);
  });

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const colA = numericColumns[i];
      const colB = numericColumns[j];
      const r = calculatePearsonCorrelation(columnData[colA], columnData[colB]);

      if (r !== null) {
        let strength = 'negligible';
        const absR = Math.abs(r);
        if (absR >= 0.7) strength = 'strong';
        else if (absR >= 0.4) strength = 'moderate';
        else if (absR >= 0.2) strength = 'weak';

        matrix.push({
          columnA: colA,
          columnB: colB,
          correlation: r,
          strength,
          direction: r > 0 ? 'positive' : r < 0 ? 'negative' : 'neutral',
        });
      }
    }
  }

  // Sort by absolute correlation strength descending
  return matrix.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}
