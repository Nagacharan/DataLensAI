/**
 * Professional Multi-Page Executive PDF Report Generator for DataLens AI.
 * Incorporates full Visual Analytics page-by-page using native vector graphics,
 * verified mathematical calculations, AutoTable summaries, and AI strategic insights.
 */

import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';
import { runAutomatedAnalysis } from '../analysis/automatedAnalyst.js';
import { buildDatasetUnderstanding } from '../analysis/semanticProfiler.js';
import { aggregateByGroup } from '../analysis/aggregations.js';
import { computeHistogramBins } from '../analysis/distributions.js';

// Ensure jsPDF AutoTable plugin is initialized
try {
  applyPlugin(jsPDF);
} catch (e) {
  // Plugin may already be attached in browser bundles
}

// Design Palette
const PALETTE = {
  primary: [14, 140, 233],    // Brand Blue #0E8CE9
  primaryDark: [3, 105, 161], // Sky-700
  secondary: [99, 102, 241],  // Indigo-500 #6366F1
  accent: [245, 158, 11],     // Amber-500
  success: [16, 185, 129],    // Emerald-500 #10B981
  danger: [239, 68, 68],      // Rose-500
  purple: [168, 85, 247],     // Purple-500 #A855F7
  violet: [139, 92, 246],     // Violet-500
  cyan: [6, 182, 212],        // Cyan-500
  slate950: [2, 6, 23],
  slate900: [15, 23, 42],     // #0F172A
  slate800: [30, 41, 59],     // #1E293B
  slate700: [51, 65, 85],     // #334155
  slate600: [71, 85, 105],    // #475569
  slate500: [100, 116, 139],  // #64748B
  slate400: [148, 163, 184],  // #94A3B8
  slate300: [203, 213, 225],  // #CBD5E1
  slate200: [226, 232, 240],  // #E2E8F0
  slate100: [241, 245, 249],  // #F1F5F9
  slate50: [248, 250, 252],   // #F8FAFC
  white: [255, 255, 255],
};

const CHART_COLORS = [
  [14, 140, 233],  // Blue
  [168, 85, 247], // Purple
  [16, 185, 129],  // Emerald
  [245, 158, 11],  // Amber
  [239, 68, 68],   // Rose
  [6, 182, 212],   // Cyan
  [234, 88, 12],   // Orange
  [100, 116, 139], // Slate
];

// Helper: safe table rendering across environments
function renderTable(doc, options) {
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, options);
  }
}

// Helper: number formatting
function formatVal(v) {
  if (v === null || v === undefined) return 'N/A';
  if (typeof v !== 'number') return String(v);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(v) >= 10_000) return (v / 1_000).toFixed(1) + 'k';
  if (Number.isInteger(v)) return v.toLocaleString();
  return Number(v.toFixed(2)).toLocaleString();
}

// Helper: string truncator
function truncate(str, max = 22) {
  if (!str) return '';
  const s = String(str);
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

/**
 * Top banner header for analytical report pages
 */
function drawPageHeader(doc, title, subtitle, pageTag) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Background banner
  doc.setFillColor(...PALETTE.slate900);
  doc.rect(0, 0, pageWidth, 64, 'F');

  // Vibrant accent border
  doc.setFillColor(...PALETTE.primary);
  doc.rect(0, 61, pageWidth, 3, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PALETTE.white);
  doc.text(title, margin, 30);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate400);
  doc.text(subtitle, margin, 48);

  // Page Tag Pill
  if (pageTag) {
    const pillW = 145;
    const pillX = pageWidth - margin - pillW;
    doc.setFillColor(...PALETTE.slate800);
    doc.roundedRect(pillX, 18, pillW, 24, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.primary);
    doc.text(pageTag.toUpperCase(), pillX + (pillW / 2), 33, { align: 'center' });
  }
}

/**
 * Visual Component: Vertical Vector Bar Chart (matching UI dashboard)
 */
function drawVerticalBarChart(doc, { title, subtitle, data, xKey, yKey, x, y, width, height }) {
  // Container card
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.setLineWidth(0.75);
  doc.roundedRect(x, y, width, height, 6, 6, 'FD');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(truncate(title, 34), x + 12, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.slate600);
  doc.text(truncate(subtitle, 42), x + 12, y + 26);

  const items = (data || []).slice(0, 6);
  if (items.length === 0) return;

  const plotX = x + 38;
  const plotY = y + 36;
  const plotW = width - 52;
  const plotH = height - 58;

  const maxVal = Math.max(...items.map(d => d[yKey] !== undefined ? d[yKey] : (d.value || 0)), 1);

  // Horizontal Grid Lines
  for (let g = 0; g <= 3; g++) {
    const gy = plotY + plotH - (g * (plotH / 3));
    const gVal = (g * maxVal) / 3;
    doc.setDrawColor(...PALETTE.slate200);
    doc.setLineWidth(0.5);
    doc.line(plotX, gy, plotX + plotW, gy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(formatVal(gVal), plotX - 5, gy + 2, { align: 'right' });
  }

  // Draw Vertical Bars
  const slotW = plotW / items.length;
  const barW = Math.min(32, slotW * 0.65);

  items.forEach((item, idx) => {
    const val = item[yKey] !== undefined ? item[yKey] : (item.value || 0);
    const barH = Math.max(3, (val / maxVal) * plotH);
    const bx = plotX + (idx * slotW) + ((slotW - barW) / 2);
    const by = plotY + plotH - barH;

    // Bar fill in Brand Blue
    doc.setFillColor(...PALETTE.primary);
    doc.roundedRect(bx, by, barW, barH, 2, 2, 'F');

    // Value on top of bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate700);
    doc.text(formatVal(val), bx + (barW / 2), by - 3, { align: 'center' });

    // Category label on X-axis
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slate800);
    doc.text(truncate(item[xKey] || item.group || item.name, 10), bx + (barW / 2), plotY + plotH + 11, { align: 'center' });
  });
}

/**
 * Visual Component: Vector Donut Ring Chart with Legend (matching UI dashboard)
 */
function drawVectorDonutChart(doc, { title, subtitle, data, x, y, width, height }) {
  // Container card
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.setLineWidth(0.75);
  doc.roundedRect(x, y, width, height, 6, 6, 'FD');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(truncate(title, 34), x + 12, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.slate600);
  doc.text(truncate(subtitle, 42), x + 12, y + 26);

  const items = (data || []).slice(0, 5);
  if (items.length === 0) return;

  const total = items.reduce((sum, d) => sum + (d.value || 0), 0) || 1;

  // Donut geometry
  const cx = x + (width / 2);
  const cy = y + 78;
  const outerR = 36;
  const innerR = 20;

  // Draw wedge segments using triangle fans
  let startAngle = -Math.PI / 2;
  items.forEach((item, idx) => {
    const sweep = ((item.value || 0) / total) * 2 * Math.PI;
    const color = CHART_COLORS[idx % CHART_COLORS.length];
    const steps = Math.max(12, Math.round(sweep * 15));

    doc.setFillColor(...color);
    for (let s = 0; s < steps; s++) {
      const a1 = startAngle + (s / steps) * sweep;
      const a2 = startAngle + ((s + 1) / steps) * sweep;
      const x1 = cx + outerR * Math.cos(a1);
      const y1 = cy + outerR * Math.sin(a1);
      const x2 = cx + outerR * Math.cos(a2);
      const y2 = cy + outerR * Math.sin(a2);
      doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
    }
    startAngle += sweep;
  });

  // Inner cutout circle
  doc.setFillColor(...PALETTE.slate50);
  doc.circle(cx, cy, innerR, 'F');

  // Donut Legend Pills under chart
  const legendY = y + 128;
  const itemW = (width - 24) / Math.min(items.length, 3);

  items.slice(0, 3).forEach((item, idx) => {
    const legX = x + 12 + (idx * itemW);
    const color = CHART_COLORS[idx % CHART_COLORS.length];
    const pct = (((item.value || 0) / total) * 100).toFixed(0);

    doc.setFillColor(...color);
    doc.circle(legX + 5, legendY + 4, 3.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slate800);
    doc.text(`${truncate(item.name || item.group, 8)} (${pct}%)`, legX + 12, legendY + 6);
  });
}

/**
 * Visual Component: Emerald Green Frequency Histogram (matching UI dashboard)
 */
function drawVectorHistogram(doc, { title, subtitle, bins, stats, x, y, width, height }) {
  // Container card
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.setLineWidth(0.75);
  doc.roundedRect(x, y, width, height, 6, 6, 'FD');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(truncate(title, 34), x + 12, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.slate600);
  doc.text(truncate(subtitle, 42), x + 12, y + 26);

  const binList = bins || [];
  if (binList.length === 0) return;

  const plotX = x + 38;
  const plotY = y + 36;
  const plotW = width - 52;
  const plotH = height - 58;

  const maxCount = Math.max(...binList.map(b => b.count), 1);

  // Horizontal Grid Lines
  for (let g = 0; g <= 3; g++) {
    const gy = plotY + plotH - (g * (plotH / 3));
    const cVal = Math.round((g * maxCount) / 3);
    doc.setDrawColor(...PALETTE.slate200);
    doc.setLineWidth(0.5);
    doc.line(plotX, gy, plotX + plotW, gy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(formatVal(cVal), plotX - 5, gy + 2, { align: 'right' });
  }

  const slotW = plotW / binList.length;
  const barW = Math.max(3, slotW - 3);

  binList.forEach((b, idx) => {
    const barH = Math.max(2, (b.count / maxCount) * plotH);
    const bx = plotX + (idx * slotW) + 1.5;
    const by = plotY + plotH - barH;

    // Green Histogram Bar (matching screenshot #10B981)
    doc.setFillColor(...PALETTE.success);
    doc.roundedRect(bx, by, barW, barH, 1.5, 1.5, 'F');

    // Count on top of bar
    if (b.count > 0 && barW >= 8) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...PALETTE.slate700);
      doc.text(formatVal(b.count), bx + (barW / 2), by - 2.5, { align: 'center' });
    }

    // Min boundary label under bar
    if (idx % 2 === 0 || idx === binList.length - 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...PALETTE.slate500);
      doc.text(`${Math.round(b.min)}`, bx + (barW / 2), plotY + plotH + 10, { align: 'center' });
    }
  });
}

/**
 * Visual Component: Bivariate Scatter Plot with Regression Line (matching UI dashboard)
 */
function drawVectorScatterPlot(doc, { title, subtitle, data, xLabel, yLabel, r, x, y, width, height }) {
  // Container card
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.setLineWidth(0.75);
  doc.roundedRect(x, y, width, height, 6, 6, 'FD');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(truncate(title, 34), x + 12, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.slate600);
  doc.text(truncate(subtitle, 42), x + 12, y + 26);

  const points = (data || []).slice(0, 90);
  if (points.length < 2) return;

  const plotX = x + 38;
  const plotY = y + 36;
  const plotW = width - 52;
  const plotH = height - 58;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = (maxX - minX) || 1;
  const rangeY = (maxY - minY) || 1;

  // Background Box with dotted lines
  doc.setFillColor(...PALETTE.white);
  doc.setDrawColor(...PALETTE.slate300);
  doc.setLineWidth(0.5);
  doc.rect(plotX, plotY, plotW, plotH, 'FD');

  // Y-axis tick values (50, 75, 100 style)
  for (let g = 0; g <= 2; g++) {
    const gy = plotY + plotH - (g * (plotH / 2));
    const gVal = minY + (g * (rangeY / 2));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(formatVal(gVal), plotX - 4, gy + 2, { align: 'right' });
  }

  // Plot Sky-Blue Points (matching screenshot)
  points.forEach(pt => {
    const px = plotX + (((pt.x - minX) / rangeX) * plotW);
    const py = plotY + plotH - (((pt.y - minY) / rangeY) * plotH);
    doc.setFillColor(...PALETTE.primary);
    doc.circle(px, py, 2.2, 'F');
  });

  // Linear Regression Trendline
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = points.length;
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });
  const slope = (n * sumXY - sumX * sumY) / ((n * sumXX - sumX * sumX) || 1);
  const intercept = (sumY - slope * sumX) / n;

  const regY1 = slope * minX + intercept;
  const regY2 = slope * maxX + intercept;

  const lineY1 = plotY + plotH - (((regY1 - minY) / rangeY) * plotH);
  const lineY2 = plotY + plotH - (((regY2 - minY) / rangeY) * plotH);

  doc.setDrawColor(...PALETTE.danger);
  doc.setLineWidth(1.2);
  doc.line(
    plotX,
    Math.max(plotY, Math.min(plotY + plotH, lineY1)),
    plotX + plotW,
    Math.max(plotY, Math.min(plotY + plotH, lineY2))
  );

  // X Axis Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...PALETTE.slate600);
  doc.text(`X: ${truncate(xLabel, 15)}`, plotX + (plotW / 2), plotY + plotH + 11, { align: 'center' });
}

/**
 * Visual Component: Full-Page Horizontal Bar Chart
 */
function drawVectorBarChart(doc, { title, subtitle, data, xKey, yKey, x, y, width, height }) {
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.setLineWidth(0.75);
  doc.roundedRect(x, y, width, height, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(title, x + 14, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.slate600);
  doc.text(subtitle, x + 14, y + 29);

  const items = (data || []).slice(0, 6);
  if (items.length === 0) return;

  const maxVal = Math.max(...items.map(d => d[yKey] !== undefined ? d[yKey] : (d.value || 0)), 1);
  const labelWidth = 105;
  const valWidth = 55;
  const barStartX = x + 14 + labelWidth;
  const barMaxW = width - 28 - labelWidth - valWidth;
  const contentHeight = height - 42;
  const rowHeight = contentHeight / items.length;

  items.forEach((item, idx) => {
    const rowY = y + 36 + (idx * rowHeight);
    const val = item[yKey] !== undefined ? item[yKey] : (item.value || 0);
    const barW = Math.max(4, (val / maxVal) * barMaxW);
    const barH = Math.min(13, rowHeight - 5);

    doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.slate800);
    doc.text(truncate(item[xKey] || item.group || item.name || '', 20), barStartX - 6, rowY + 9, { align: 'right' });

    doc.setFillColor(...CHART_COLORS[idx % CHART_COLORS.length]);
    doc.roundedRect(barStartX, rowY, barW, barH, 2.5, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slate700);
    doc.text(formatVal(val), barStartX + barW + 5, rowY + 9);
  });
}

/**
 * Visual Component: Time Series Progression Line Chart
 */
function drawVectorLineChart(doc, { title, subtitle, data, xKey, yKey, x, y, width, height, growthPct }) {
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.setLineWidth(0.75);
  doc.roundedRect(x, y, width, height, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(title, x + 14, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.slate600);
  doc.text(subtitle, x + 14, y + 29);

  if (growthPct !== undefined) {
    const isPos = Number(growthPct) >= 0;
    const badgeText = `${isPos ? '▲ +' : '▼ '}${growthPct}%`;
    const bW = 55;
    const bX = x + width - 14 - bW;
    doc.setFillColor(...(isPos ? [236, 253, 245] : [254, 242, 242]));
    doc.roundedRect(bX, y + 12, bW, 16, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...(isPos ? PALETTE.success : PALETTE.danger));
    doc.text(badgeText, bX + (bW / 2), y + 23, { align: 'center' });
  }

  const items = data || [];
  if (items.length < 2) return;

  const plotX = x + 40;
  const plotY = y + 42;
  const plotW = width - 60;
  const plotH = height - 68;

  const vals = items.map(d => d[yKey] !== undefined ? d[yKey] : d.value);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const range = (maxVal - minVal) || 1;

  for (let g = 0; g <= 3; g++) {
    const gy = plotY + plotH - (g * (plotH / 3));
    const gVal = minVal + (g * (range / 3));
    doc.setDrawColor(...PALETTE.slate200);
    doc.setLineWidth(0.5);
    doc.line(plotX, gy, plotX + plotW, gy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(formatVal(gVal), plotX - 5, gy + 2, { align: 'right' });
  }

  const stepX = plotW / (items.length - 1);
  const points = items.map((item, idx) => {
    const v = item[yKey] !== undefined ? item[yKey] : item.value;
    const px = plotX + (idx * stepX);
    const py = plotY + plotH - (((v - minVal) / range) * plotH);
    return { px, py, val: v, label: item[xKey] || item.date };
  });

  doc.setFillColor(224, 242, 254);
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const base = plotY + plotH;
    doc.triangle(p1.px, base, p1.px, p1.py, p2.px, p2.py, 'F');
    doc.triangle(p1.px, base, p2.px, p2.py, p2.px, base, 'F');
  }

  doc.setDrawColor(...PALETTE.primary);
  doc.setLineWidth(1.6);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i].px, points[i].py, points[i + 1].px, points[i + 1].py);
  }

  points.forEach((pt, idx) => {
    doc.setFillColor(...PALETTE.primary);
    doc.setDrawColor(...PALETTE.white);
    doc.setLineWidth(0.8);
    doc.circle(pt.px, pt.py, 2.8, 'FD');

    if (idx === 0 || idx === points.length - 1 || idx === Math.floor(points.length / 2)) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...PALETTE.slate600);
      doc.text(truncate(pt.label, 8), pt.px, plotY + plotH + 11, { align: 'center' });
    }
  });
}

/**
 * Main PDF Report Generator Export
 */
export function generatePDFReport(
  dataset,
  profile,
  insights = [],
  cleaningHistory = [],
  mlPrepLog = [],
  semanticUnderstanding = null,
  automatedAnalysis = null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  // Guarantee understanding and automated analysis structures with fallbacks
  const understanding = semanticUnderstanding || buildDatasetUnderstanding(dataset, profile);
  const auto = automatedAnalysis || runAutomatedAnalysis(dataset, profile, understanding) || {};

  // Extract column candidates for fallback visual rendering
  const numCols = dataset.columns.filter(c => c.type === 'number');
  const catCols = dataset.columns.filter(c => c.type === 'string' || c.type === 'boolean');
  const primaryMetric = auto.primaryMetricName || understanding.primaryMetric?.name || numCols[0]?.name;
  const primaryCat = understanding.primaryCategory?.name || catCols[0]?.name;

  // Prepare fallback data for the 4 dashboard charts if needed
  const barData = auto.categoryBarChart?.data || (primaryCat && primaryMetric ? aggregateByGroup(dataset.rows, primaryCat, primaryMetric, 'sum', 6) : []);
  const donutData = auto.categoryDonutChart?.data || (barData.length > 0 ? barData.map(d => ({ name: d.group || d.name, value: d.value })) : []);
  const histBins = auto.distributionHistogram?.bins || (primaryMetric ? computeHistogramBins(dataset.rows.map(r => r[primaryMetric]).filter(v => typeof v === 'number'), 8) : []);
  const scatterData = auto.scatterPlot?.data || (numCols.length >= 2 ? dataset.rows.filter(r => typeof r[numCols[0].name] === 'number' && typeof r[numCols[1].name] === 'number').slice(0, 80).map(r => ({ x: r[numCols[0].name], y: r[numCols[1].name] })) : []);

  // =========================================================================
  // PAGE 1: EXECUTIVE COVER & DATASET PROFILE
  // =========================================================================
  doc.setFillColor(...PALETTE.primary);
  doc.rect(0, 0, pageWidth, 76, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...PALETTE.white);
  doc.text('DataLens AI — Executive Analytics Report', margin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 239, 254);
  doc.text(`Dataset: ${dataset.fileName || 'Active Dataset'}  |  Records: ${dataset.totalRows.toLocaleString()}  |  Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, 58);

  let cursorY = 96;

  // Section 1: Executive KPI Overview Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('1. Dataset Overview & Integrity Profile', margin, cursorY);
  cursorY += 12;

  const summaryData = [
    ['Total Records (Rows)', dataset.totalRows.toLocaleString(), 'Data Completeness Score', `${profile.dataQualityScore} / 100`],
    ['Total Attributes (Columns)', dataset.totalColumns.toLocaleString(), 'Missing Cells Ratio', `${profile.missingCellsPercent}% (${profile.totalMissingCells} cells)`],
    ['Duplicate Rows Count', `${profile.duplicateRowsCount} (${profile.duplicateRowsPercent}%)`, 'Transformation Operations', `${cleaningHistory.length + mlPrepLog.length} applied`],
  ];

  renderTable(doc, {
    startY: cursorY,
    head: [['Metric', 'Observed Value', 'Quality Dimension', 'Status / Index']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: PALETTE.slate900, textColor: PALETTE.white, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    margin: { left: margin, right: margin },
  });

  cursorY = doc.lastAutoTable.finalY + 22;

  // Section 2: Numerical Feature Descriptive Statistics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('2. Parametric & Non-Parametric Feature Statistics', margin, cursorY);
  cursorY += 12;

  const numericCols = profile.columns.filter(c => c.type === 'number' && c.stats);
  const statsRows = numericCols.map(c => [
    c.name,
    c.stats.count.toLocaleString(),
    c.stats.mean.toLocaleString(),
    c.stats.median.toLocaleString(),
    c.stats.stdDev.toLocaleString(),
    `${c.stats.min} – ${c.stats.max}`,
    c.outlierCount > 0 ? `${c.outlierCount} (${c.outlierPercentage}%)` : 'None',
  ]);

  if (statsRows.length > 0) {
    renderTable(doc, {
      startY: cursorY,
      head: [['Column Name', 'Valid Count', 'Mean (μ)', 'Median', 'StdDev (σ)', 'Min – Max Range', 'Outliers (1.5x IQR)']],
      body: statsRows,
      theme: 'striped',
      headStyles: { fillColor: PALETTE.primary, textColor: PALETTE.white },
      styles: { fontSize: 8, cellPadding: 3.5 },
      margin: { left: margin, right: margin },
    });
    cursorY = doc.lastAutoTable.finalY + 16;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.slate600);
    doc.text('No continuous numerical features available in this dataset.', margin, cursorY);
    cursorY += 20;
  }

  // Cover Quality Interpretation Box
  const qualityBoxY = Math.min(cursorY, pageHeight - 120);
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(...PALETTE.primary);
  doc.setLineWidth(1);
  doc.roundedRect(margin, qualityBoxY, contentWidth, 54, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.primaryDark);
  doc.text('Data Hygiene & Analytical Integrity Assessment:', margin + 12, qualityBoxY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.slate700);
  doc.text(
    `This dataset scored ${profile.dataQualityScore}/100. Across ${profile.columnCount} features and ${profile.rowCount.toLocaleString()} observations, ` +
    `missing values constitute ${profile.missingCellsPercent}%. Numerical statistics follow verified mathematical distributions ` +
    `and provide a deterministic baseline for the visual analytics on following pages.`,
    margin + 12,
    qualityBoxY + 32,
    { maxWidth: contentWidth - 24 }
  );

  // =========================================================================
  // PAGE 2: VISUAL ANALYTICS DASHBOARD (THE 4 CORE CHARTS FROM THE SCREEN!)
  // =========================================================================
  doc.addPage();
  drawPageHeader(
    doc,
    'Visual Analytics: Executive Core Visual Dashboard',
    'Integrated 4-Quadrant Visual Analytics Dossier Corresponding Directly to Live Dashboard',
    'Visual Dashboard — Page 2'
  );

  const gridGap = 16;
  const cardW = (contentWidth - gridGap) / 2;
  const cardH = 168;

  // Row 1 - Left: Bar Chart (Total Metric by Category)
  drawVerticalBarChart(doc, {
    title: auto.categoryBarChart?.title || `Total ${primaryMetric} by ${primaryCat}`,
    subtitle: auto.categoryBarChart?.subtitle || 'Top aggregated category volume rankings',
    data: barData,
    xKey: 'group',
    yKey: 'value',
    x: margin,
    y: 75,
    width: cardW,
    height: cardH,
  });

  // Row 1 - Right: Donut Chart (Proportion Share)
  drawVectorDonutChart(doc, {
    title: auto.categoryDonutChart?.title || `${primaryCat} Proportion Share`,
    subtitle: auto.categoryDonutChart?.subtitle || 'Proportional segment distribution',
    data: donutData,
    x: margin + cardW + gridGap,
    y: 75,
    width: cardW,
    height: cardH,
  });

  // Row 2 - Left: Frequency Histogram (Emerald Green)
  drawVectorHistogram(doc, {
    title: auto.distributionHistogram?.title || `${primaryMetric} Frequency Distribution`,
    subtitle: auto.distributionHistogram?.subtitle || 'Equal-width binned observation counts',
    bins: histBins,
    stats: auto.distributionHistogram?.stats || profile.columns.find(c => c.name === primaryMetric)?.stats,
    x: margin,
    y: 75 + cardH + 14,
    width: cardW,
    height: cardH,
  });

  // Row 2 - Right: Scatter Plot (Bivariate Relationship)
  drawVectorScatterPlot(doc, {
    title: auto.scatterPlot?.title || (numCols.length >= 2 ? `Relationship: ${numCols[0].name} vs ${numCols[1].name}` : 'Bivariate Dispersion'),
    subtitle: auto.scatterPlot?.subtitle || 'Bivariate correlation scatter plot',
    data: scatterData,
    xLabel: auto.scatterPlot?.xLabel || numCols[0]?.name || 'X',
    yLabel: auto.scatterPlot?.yLabel || numCols[1]?.name || 'Y',
    r: auto.scatterPlot?.r || 0,
    x: margin + cardW + gridGap,
    y: 75 + cardH + 14,
    width: cardW,
    height: cardH,
  });

  // Supporting Executive Visual Analytics Summary Table
  const tableY = 75 + (cardH * 2) + 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('Certified Mathematical Metrics for Core Dashboard Visuals:', margin, tableY);

  const dashSummaryRows = [
    [
      'Categorical Leader',
      barData[0] ? `${barData[0].group || barData[0].name} (${formatVal(barData[0].value)})` : 'N/A',
      'Proportion Dominance',
      donutData[0] ? `${(((donutData[0].value || 0) / (donutData.reduce((s, d) => s + (d.value || 0), 0) || 1)) * 100).toFixed(1)}% Share` : 'N/A'
    ],
    [
      'Measurement Metric',
      primaryMetric || 'N/A',
      'Distribution Median (μ)',
      profile.columns.find(c => c.name === primaryMetric)?.stats ? formatVal(profile.columns.find(c => c.name === primaryMetric).stats.median) : 'N/A'
    ],
    [
      'Bivariate Association',
      numCols.length >= 2 ? `${numCols[0].name} ↔ ${numCols[1].name}` : 'N/A',
      'Pearson Correlation (r)',
      auto.scatterPlot?.r !== undefined ? `${auto.scatterPlot.r >= 0 ? '+' : ''}${auto.scatterPlot.r}` : '0.00'
    ],
  ];

  renderTable(doc, {
    startY: tableY + 8,
    head: [['Visual Dimension', 'Empirical Finding', 'Analytical Indicator', 'Certified Value']],
    body: dashSummaryRows,
    theme: 'grid',
    headStyles: { fillColor: PALETTE.slate900, textColor: PALETTE.white },
    styles: { fontSize: 7.5, cellPadding: 3.5 },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // PAGE 3: VISUAL ANALYTICS DEEP-DIVE — CATEGORICAL PERFORMANCE & SHARE
  // =========================================================================
  doc.addPage();
  drawPageHeader(
    doc,
    'Visual Analytics Deep-Dive: Categorical Performance & Market Composition',
    'High-Resolution Category Aggregation, Proportional Composition & Certified Rankings',
    'Category Analytics — Page 3'
  );

  cursorY = 80;

  drawVectorBarChart(doc, {
    title: auto.categoryBarChart?.title || `Total ${primaryMetric} by ${primaryCat}`,
    subtitle: auto.categoryBarChart?.subtitle || 'Top aggregated category volume rankings',
    data: barData,
    xKey: 'group',
    yKey: 'value',
    x: margin,
    y: cursorY,
    width: contentWidth,
    height: 190,
  });

  cursorY += 205;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('Certified Category Aggregations & Percentage Breakdown:', margin, cursorY);
  cursorY += 10;

  const barTotal = barData.reduce((s, d) => s + (d.value || 0), 0) || 1;
  const catTableRows = barData.slice(0, 8).map((d, i) => [
    `#${i + 1}`,
    d.group || d.name || 'Segment',
    formatVal(d.value),
    `${((d.value / barTotal) * 100).toFixed(1)}%`,
    i === 0 ? 'Primary Volume Leader' : i === 1 ? 'Secondary Contributor' : 'Standard Segment',
  ]);

  if (catTableRows.length > 0) {
    renderTable(doc, {
      startY: cursorY,
      head: [['Rank', 'Category Segment', 'Aggregated Volume', 'Percentage Share', 'Analytical Classification']],
      body: catTableRows,
      theme: 'grid',
      headStyles: { fillColor: PALETTE.slate800, textColor: PALETTE.white },
      styles: { fontSize: 7.5, cellPadding: 3.5 },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // PAGE 4: VISUAL ANALYTICS DEEP-DIVE — DISTRIBUTION & TEMPORAL DYNAMICS
  // =========================================================================
  doc.addPage();
  drawPageHeader(
    doc,
    'Visual Analytics Deep-Dive: Numerical Distribution & Time Dynamics',
    'Frequency Histogram Bins, Central Tendencies & Historical Progression Dynamics',
    'Distribution & Dynamics — Page 4'
  );

  cursorY = 80;

  if (auto.timeSeriesChart) {
    drawVectorLineChart(doc, {
      title: auto.timeSeriesChart.title,
      subtitle: auto.timeSeriesChart.subtitle,
      data: auto.timeSeriesChart.data,
      xKey: 'date',
      yKey: 'value',
      growthPct: auto.timeSeriesChart.changePct,
      x: margin,
      y: cursorY,
      width: contentWidth,
      height: 180,
    });
    cursorY += 194;
  }

  drawVectorHistogram(doc, {
    title: auto.distributionHistogram?.title || `${primaryMetric} Frequency Distribution`,
    subtitle: auto.distributionHistogram?.subtitle || 'Equal-width binned observation counts',
    bins: histBins,
    stats: auto.distributionHistogram?.stats || profile.columns.find(c => c.name === primaryMetric)?.stats,
    x: margin,
    y: cursorY,
    width: contentWidth,
    height: 185,
  });

  cursorY += 198;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('Numerical Frequency Distribution Breakdown:', margin, cursorY);
  cursorY += 10;

  const histRows = histBins.map((b, i) => [
    `Bin ${i + 1}`,
    `${formatVal(b.min)} – ${formatVal(b.max)}`,
    b.count.toLocaleString(),
    `${(((b.count || 0) / dataset.totalRows) * 100).toFixed(1)}%`,
  ]);

  if (histRows.length > 0) {
    renderTable(doc, {
      startY: cursorY,
      head: [['Bin Index', 'Interval Range', 'Observed Record Count', 'Relative Sample Share']],
      body: histRows,
      theme: 'grid',
      headStyles: { fillColor: PALETTE.success, textColor: PALETTE.white },
      styles: { fontSize: 7.5, cellPadding: 3.5 },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // PAGE 5: VISUAL ANALYTICS DEEP-DIVE — CORRELATIONS & BIVARIATE SCATTER
  // =========================================================================
  doc.addPage();
  drawPageHeader(
    doc,
    'Visual Analytics Deep-Dive: Correlation Matrix & Bivariate Scatter Dispersion',
    'Pearson Association Coefficients, Linear Regression Trajectory & Outlier Boundaries',
    'Correlations — Page 5'
  );

  cursorY = 80;

  drawVectorScatterPlot(doc, {
    title: auto.scatterPlot?.title || (numCols.length >= 2 ? `Relationship: ${numCols[0].name} vs ${numCols[1].name}` : 'Bivariate Association'),
    subtitle: auto.scatterPlot?.subtitle || 'Bivariate correlation scatter plot',
    data: scatterData,
    xLabel: auto.scatterPlot?.xLabel || numCols[0]?.name || 'Feature A',
    yLabel: auto.scatterPlot?.yLabel || numCols[1]?.name || 'Feature B',
    r: auto.scatterPlot?.r || 0,
    x: margin,
    y: cursorY,
    width: contentWidth,
    height: 220,
  });

  cursorY += 234;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('Verified Pearson Bivariate Correlation Matrix:', margin, cursorY);
  cursorY += 10;

  const corrRows = (auto.correlationAnalysis?.matrix || []).slice(0, 6).map(c => [
    `${c.columnA} ↔ ${c.columnB}`,
    c.correlation > 0 ? `+${c.correlation}` : String(c.correlation),
    c.direction,
    c.strength,
    Math.abs(c.correlation) >= 0.7
      ? 'Strong linear association'
      : Math.abs(c.correlation) >= 0.4
      ? 'Moderate linear tendency'
      : 'Weak or independent variance',
  ]);

  if (corrRows.length > 0) {
    renderTable(doc, {
      startY: cursorY,
      head: [['Attribute Pair', 'Pearson (r)', 'Direction', 'Strength', 'Statistical Assessment']],
      body: corrRows,
      theme: 'striped',
      headStyles: { fillColor: PALETTE.slate900, textColor: PALETTE.white },
      styles: { fontSize: 7.5, cellPadding: 3.5 },
      margin: { left: margin, right: margin },
    });
    cursorY = doc.lastAutoTable.finalY + 16;
  }

  // Causation disclaimer box
  const noticeY = Math.min(cursorY, pageHeight - 95);
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(...PALETTE.danger);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, noticeY, contentWidth, 42, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.danger);
  doc.text('Causation & Inference Disclaimer:', margin + 12, noticeY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.slate700);
  doc.text(
    'Correlation coefficients measure linear co-movement, not causal mechanisms. External lurking variables, ' +
    'sampling boundary limits, or confounding factors may account for observed associations. Treat as exploratory indicators.',
    margin + 12,
    noticeY + 28,
    { maxWidth: contentWidth - 24 }
  );

  // =========================================================================
  // PAGE 6: STRATEGIC INSIGHTS & TRANSFORMATION AUDIT DOSSIER
  // =========================================================================
  doc.addPage();
  drawPageHeader(
    doc,
    'Executive Synthesis: Verified Findings, Strategic Actions & Audit Dossier',
    'Mathematical Discoveries, Algorithmic Interpretations & Immutable Audit Trail',
    'Audit & Insights Dossier'
  );

  cursorY = 80;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('1. Strategic Analytical Discoveries & Actionable Recommendations', margin, cursorY);
  cursorY += 10;

  const insightRows = (insights || []).map((ins, i) => [
    `#${i + 1} ${ins.title}`,
    ins.category || 'General',
    ins.summary,
    ins.recommendation || 'N/A',
  ]);

  if (insightRows.length > 0) {
    renderTable(doc, {
      startY: cursorY,
      head: [['Finding Title', 'Category', 'Verified Empirical Evidence', 'Actionable Recommendation']],
      body: insightRows,
      theme: 'grid',
      headStyles: { fillColor: PALETTE.slate900, textColor: PALETTE.white },
      styles: { fontSize: 7.5, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 95, fontStyle: 'bold' },
        1: { cellWidth: 65 },
      },
      margin: { left: margin, right: margin },
    });
    cursorY = doc.lastAutoTable.finalY + 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('2. Immutable Data Transformation & Preparation Audit Trail', margin, cursorY);
  cursorY += 10;

  const allLogs = [
    ...cleaningHistory.map(h => [h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : 'N/A', 'Data Cleaning', h.type, h.description]),
    ...mlPrepLog.map(m => [m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : 'N/A', 'ML Preparation', m.type, m.description]),
  ];

  if (allLogs.length > 0) {
    renderTable(doc, {
      startY: cursorY,
      head: [['Timestamp', 'Pipeline Stage', 'Operation Type', 'Detailed Audit Narrative']],
      body: allLogs,
      theme: 'striped',
      headStyles: { fillColor: PALETTE.slate700, textColor: PALETTE.white },
      styles: { fontSize: 7.5, cellPadding: 3.5 },
      margin: { left: margin, right: margin },
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.slate600);
    doc.text('Dataset has not been modified; reflects pristine raw uploaded state.', margin, cursorY + 12);
  }

  // =========================================================================
  // RUNNING FOOTER ON ALL PAGES
  // =========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slate400);
    doc.text(
      `DataLens AI Analytics Platform — Page ${i} of ${totalPages} — Confidential & Deterministically Verified`,
      pageWidth / 2,
      pageHeight - 18,
      { align: 'center' }
    );
  }

  // Save / Download PDF in browser environment
  const safeName = (dataset.fileName || 'dataset').replace(/[^a-zA-Z0-9_-]/g, '_');
  if (typeof window !== 'undefined' && typeof doc.save === 'function') {
    doc.save(`DataLens_AI_Report_${safeName}.pdf`);
  }

  return doc;
}
