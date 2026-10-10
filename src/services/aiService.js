/**
 * Client-side AI & Server Communication Service.
 * Safely calls backend /api endpoints with automatic client-side deterministic fallback
 * if the backend is unreachable or external LLM fails.
 */

import { executeDatasetQuery } from '../utils/ask-data/queryEngine';
import { generateDeterministicInsights } from '../utils/insights/deterministicInsightEngine';

export async function fetchServerConfig() {
  try {
    const res = await fetch('/api/config', { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Server is unreachable, run pure client-side mode
  }
  return {
    aiConfigured: false,
    provider: 'Deterministic Analytics Engine (Client-side)',
    model: 'Native Local Engine',
  };
}

export async function getEnhancedInsights(dataset, profile, deterministicInsights) {
  try {
    const res = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetSummary: {
          fileName: dataset.fileName,
          totalRows: dataset.totalRows,
          totalColumns: dataset.totalColumns,
        },
        profileStats: {
          rowCount: profile.rowCount,
          columnCount: profile.columnCount,
          missingCellsPercent: profile.missingCellsPercent,
          dataQualityScore: profile.dataQualityScore,
          duplicateRowsCount: profile.duplicateRowsCount,
        },
        numericInsights: deterministicInsights,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        insights: data.insights || deterministicInsights,
        narrative: data.narrative || null,
        provider: data.provider,
      };
    }
  } catch (err) {
    // Backend unreachable, fallback smoothly
  }

  return {
    insights: deterministicInsights,
    narrative: `Executive analysis complete: Evaluated ${dataset.totalRows.toLocaleString()} rows and ${dataset.totalColumns} attributes with a DataLens quality score of ${profile.dataQualityScore}/100.`,
    provider: 'Deterministic Engine',
  };
}

export async function askDatasetQuestion(question, dataset, profile, conversationHistory = []) {
  // Step 1: Deterministically compute verified answer and evidence
  const verified = executeDatasetQuery(question, dataset, profile);

  // Step 2: Request AI narrative synthesis from backend
  try {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        verifiedCalculation: verified,
        datasetMetadata: {
          fileName: dataset.fileName,
          totalRows: dataset.totalRows,
          totalColumns: dataset.totalColumns,
        },
        conversationHistory: conversationHistory.slice(-4),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        answer: data.answer || verified.answer,
        evidence: data.evidence || verified.evidence,
        chartData: data.chartData || verified.chartData,
        provider: data.provider || 'Deterministic Engine',
      };
    }
  } catch (err) {
    // Backend unreachable, return deterministic answer
  }

  return {
    answer: verified.answer,
    evidence: verified.evidence,
    chartData: verified.chartData,
    provider: 'Deterministic Engine',
  };
}
