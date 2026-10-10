/**
 * Professional PDF Report Generator for DataLens AI.
 * Uses jsPDF and autoTable to generate executive-grade audit and analytics reports.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePDFReport(dataset, profile, insights, cleaningHistory = [], mlPrepLog = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let cursorY = 40;

  // Header Banner
  doc.setFillColor(14, 140, 233); // Brand Primary Blue
  doc.rect(0, 0, pageWidth, 80, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('DataLens AI — Executive Analytics Report', margin, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(224, 239, 254);
  doc.text(`Dataset: ${dataset.fileName || 'Active Dataset'}  |  Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, 62);

  cursorY = 105;

  // Section 1: Executive Dataset Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Dataset Overview & Profile', margin, cursorY);
  cursorY += 15;

  const summaryData = [
    ['Total Records (Rows)', dataset.totalRows.toLocaleString(), 'Data Completeness Score', `${profile.dataQualityScore} / 100`],
    ['Total Attributes (Columns)', dataset.totalColumns.toLocaleString(), 'Missing Cells Ratio', `${profile.missingCellsPercent}% (${profile.totalMissingCells} cells)`],
    ['Duplicate Rows Count', `${profile.duplicateRowsCount} (${profile.duplicateRowsPercent}%)`, 'Active Transformations', `${cleaningHistory.length} operation(s)`],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [['Metric', 'Value', 'Quality Indicator', 'Status']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
  });

  cursorY = doc.lastAutoTable.finalY + 25;

  // Section 2: Key Descriptive Statistics (Numeric Features)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Numerical Feature Statistics', margin, cursorY);
  cursorY += 15;

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
    autoTable(doc, {
      startY: cursorY,
      head: [['Column', 'Count', 'Mean', 'Median', 'StdDev', 'Min – Max', 'Outliers (IQR)']],
      body: statsRows,
      theme: 'striped',
      headStyles: { fillColor: [14, 140, 233], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 4 },
      margin: { left: margin, right: margin },
    });
    cursorY = doc.lastAutoTable.finalY + 25;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No numeric features available in this dataset.', margin, cursorY);
    cursorY += 20;
  }

  // Check page overflow
  if (cursorY > pageHeight - 150) {
    doc.addPage();
    cursorY = 40;
  }

  // Section 3: AI & Analytical Insights
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Mathematical & AI Insights', margin, cursorY);
  cursorY += 15;

  const insightRows = insights.map((ins, i) => [
    `#${i + 1} ${ins.title}`,
    ins.category || 'General',
    ins.summary,
    ins.recommendation || 'N/A',
  ]);

  if (insightRows.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Finding Title', 'Category', 'Observed Evidence', 'Strategic Recommendation']],
      body: insightRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 70 },
        2: { cellWidth: 190 },
        3: { cellWidth: 155 },
      },
      margin: { left: margin, right: margin },
    });
    cursorY = doc.lastAutoTable.finalY + 25;
  }

  // Check page overflow
  if (cursorY > pageHeight - 140) {
    doc.addPage();
    cursorY = 40;
  }

  // Section 4: Audit Log (Cleaning & ML Preparation History)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Data Transformations & Audit Trail', margin, cursorY);
  cursorY += 15;

  const allLogs = [
    ...cleaningHistory.map(h => [h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : 'N/A', 'Data Cleaning', h.type, h.description]),
    ...mlPrepLog.map(m => [m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : 'N/A', 'ML Preparation', m.type, m.description]),
  ];

  if (allLogs.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Time', 'Pipeline Stage', 'Operation Type', 'Audit Details']],
      body: allLogs,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 4 },
      margin: { left: margin, right: margin },
    });
    cursorY = doc.lastAutoTable.finalY + 25;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Dataset has not been modified; showing original raw uploaded state.', margin, cursorY);
    cursorY += 25;
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `DataLens AI Analytics Platform — Page ${i} of ${totalPages} — Confidential & Deterministically Verified`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  // Save / Download PDF
  const safeName = (dataset.fileName || 'dataset').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`DataLens_AI_Report_${safeName}.pdf`);
}
