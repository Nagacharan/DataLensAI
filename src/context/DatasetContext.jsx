import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileDataset } from '../utils/analysis/statistics.js';
import { buildDatasetUnderstanding } from '../utils/analysis/semanticProfiler.js';
import {
  generateQualityRecommendations,
  applyRecommendationsBatch,
} from '../utils/data-cleaning/recommendations.js';
import { runAutomatedAnalysis } from '../utils/analysis/automatedAnalyst.js';
import { generateDeterministicInsights } from '../utils/insights/deterministicInsightEngine.js';
import { getEnhancedInsights, askDatasetQuestion, fetchServerConfig } from '../services/aiService.js';
import {
  removeDuplicates,
  handleMissingValues,
  convertColumnType,
  handleOutliers,
  dropColumn,
} from '../utils/data-cleaning/cleaner.js';
import {
  encodeCategorical,
  scaleNumerical,
  deriveDateFeatures,
  inspectFeaturesForML,
} from '../utils/data-preparation/mlPreparer.js';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [rawDataset, setRawDataset] = useState(null);
  const [activeDataset, setActiveDataset] = useState(null);
  const [profile, setProfile] = useState(null);
  const [semanticUnderstanding, setSemanticUnderstanding] = useState(null);
  const [qualityRecommendations, setQualityRecommendations] = useState([]);
  const [automatedAnalysis, setAutomatedAnalysis] = useState(null);
  const [cleaningHistory, setCleaningHistory] = useState([]);
  const [historyStack, setHistoryStack] = useState([]); // for undo

  // ML Prep state
  const [mlPreparedDataset, setMlPreparedDataset] = useState(null);
  const [mlPrepLog, setMlPrepLog] = useState([]);
  const [mlTargetColumn, setMlTargetColumn] = useState(null);

  // Default tab is 'dashboard' (the visual analytics dashboard matching the mockup)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Insights & Chat state
  const [insights, setInsights] = useState([]);
  const [aiNarrative, setAiNarrative] = useState(null);
  const [insightsProvider, setInsightsProvider] = useState('Deterministic Engine');
  const [chatMessages, setChatMessages] = useState([]);
  const [serverConfig, setServerConfig] = useState(null);

  // Global filters
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchServerConfig().then(cfg => setServerConfig(cfg));
  }, []);

  // When active dataset changes, update profile, semantic understanding, recommendations, and automated analysis
  const updateActiveData = (newDataset, newHistory = null) => {
    setIsLoading(true);
    try {
      const newProfile = profileDataset(newDataset);
      const semUnderstanding = buildDatasetUnderstanding(newDataset, newProfile);
      const recs = generateQualityRecommendations(newDataset, newProfile);
      const autoAnalysis = runAutomatedAnalysis(newDataset, newProfile, semUnderstanding);

      setActiveDataset(newDataset);
      setProfile(newProfile);
      setSemanticUnderstanding(semUnderstanding);
      setQualityRecommendations(recs);
      setAutomatedAnalysis(autoAnalysis);

      if (newHistory) {
        setCleaningHistory(newHistory);
      }

      // Generate insights
      const detInsights = generateDeterministicInsights(newDataset, newProfile);
      setInsights(detInsights);

      // Async enhance with AI if available
      getEnhancedInsights(newDataset, newProfile, detInsights).then(res => {
        if (res.narrative) setAiNarrative(res.narrative);
        if (res.provider) setInsightsProvider(res.provider);
      });
    } catch (err) {
      console.error('Error updating dataset profile:', err);
      setError(`Failed to update dataset analytics: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataset = (normalized) => {
    setError(null);
    setRawDataset(normalized);
    setHistoryStack([normalized]);
    setCleaningHistory([]);
    setMlPreparedDataset(null);
    setMlPrepLog([]);
    setMlTargetColumn(null);
    setFilters({});
    setChatMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Welcome! I've loaded and analyzed "${normalized.fileName}". I've automatically profiled its structure, generated visualizations, and extracted key insights. Ask me any question or explore the executive briefing below.`,
        timestamp: new Date().toLocaleTimeString(),
        evidence: null,
      },
    ]);

    updateActiveData(normalized);
    setActiveTab('dashboard');
  };

  // Automated 1-Click Quality Cleaning
  const applyAllQualityRecommendations = () => {
    if (!activeDataset || qualityRecommendations.length === 0) return;
    try {
      setHistoryStack(prev => [...prev, activeDataset]);
      const res = applyRecommendationsBatch(activeDataset, qualityRecommendations);
      const newHistory = [...cleaningHistory, ...res.transformations];
      updateActiveData(res.dataset, newHistory);
    } catch (err) {
      setError(`Failed to apply recommendations: ${err.message}`);
    }
  };

  const applySingleQualityRecommendation = (recId) => {
    if (!activeDataset) return;
    const rec = qualityRecommendations.find(r => r.id === recId);
    if (!rec) return;

    try {
      setHistoryStack(prev => [...prev, activeDataset]);
      const res = applyRecommendationsBatch(activeDataset, [rec]);
      const newHistory = [...cleaningHistory, ...res.transformations];
      updateActiveData(res.dataset, newHistory);
    } catch (err) {
      setError(`Failed to apply recommendation: ${err.message}`);
    }
  };

  // Manual Cleaning Actions
  const applyCleaningAction = (actionType, params) => {
    if (!activeDataset) return;
    setError(null);

    try {
      let result;
      if (actionType === 'REMOVE_DUPLICATES') {
        result = removeDuplicates(activeDataset);
      } else if (actionType === 'HANDLE_MISSING') {
        result = handleMissingValues(activeDataset, params.column, params.strategy, params.constantValue);
      } else if (actionType === 'CONVERT_TYPE') {
        result = convertColumnType(activeDataset, params.column, params.targetType);
      } else if (actionType === 'HANDLE_OUTLIERS') {
        result = handleOutliers(activeDataset, params.column, params.action);
      } else if (actionType === 'DROP_COLUMN') {
        result = dropColumn(activeDataset, params.column);
      } else {
        throw new Error(`Unsupported cleaning action: ${actionType}`);
      }

      setHistoryStack(prev => [...prev, activeDataset]);
      const newHistory = [...cleaningHistory, result.transformation];
      updateActiveData(result.dataset, newHistory);
    } catch (err) {
      setError(`Cleaning operation failed: ${err.message}`);
    }
  };

  const undoLastAction = () => {
    if (historyStack.length <= 1) return;
    const prevDataset = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, prev.length - 1));
    const newHistory = cleaningHistory.slice(0, cleaningHistory.length - 1);
    updateActiveData(prevDataset, newHistory);
  };

  const resetToRaw = () => {
    if (!rawDataset) return;
    setHistoryStack([rawDataset]);
    setCleaningHistory([]);
    updateActiveData(rawDataset, []);
  };

  // ML Preparation Actions (Optional Workflow)
  const initMLDataset = () => {
    if (!mlPreparedDataset && activeDataset) {
      setMlPreparedDataset({ ...activeDataset });
    }
  };

  const applyMLEncoding = (column, method) => {
    const baseData = mlPreparedDataset || activeDataset;
    const { rows, newColumns, categories, mapping } = encodeCategorical(baseData.rows, column, method);

    const updatedCols = [...baseData.columns];
    newColumns.forEach(c => {
      updatedCols.push({ name: c, type: 'number', isDerived: true });
    });

    const newDs = {
      ...baseData,
      columns: updatedCols,
      rows,
      totalColumns: updatedCols.length,
    };

    setMlPreparedDataset(newDs);
    setMlPrepLog(prev => [
      ...prev,
      {
        type: `ENCODE_${method.toUpperCase()}`,
        column,
        description: `Applied ${method === 'one_hot' ? 'One-Hot' : 'Label'} encoding to "${column}". Generated ${newColumns.length} feature(s).`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const applyMLScaling = (column, method) => {
    const baseData = mlPreparedDataset || activeDataset;
    const { rows, newColumn, params } = scaleNumerical(baseData.rows, column, method);

    const updatedCols = [...baseData.columns, { name: newColumn, type: 'number', isDerived: true }];
    const newDs = {
      ...baseData,
      columns: updatedCols,
      rows,
      totalColumns: updatedCols.length,
    };

    setMlPreparedDataset(newDs);
    setMlPrepLog(prev => [
      ...prev,
      {
        type: `SCALE_${method.toUpperCase()}`,
        column,
        description: `Scaled "${column}" using ${method === 'min_max' ? 'Min-Max Normalization [0,1]' : 'Standardization (Z-score)'}. Created "${newColumn}".`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const applyMLDateDerivation = (column) => {
    const baseData = mlPreparedDataset || activeDataset;
    const derivedRows = deriveDateFeatures(baseData.rows, column);
    const dateDerivedNames = [`${column}_year`, `${column}_month`, `${column}_day`, `${column}_weekday`, `${column}_isWeekend`];

    const updatedCols = [...baseData.columns];
    dateDerivedNames.forEach(c => {
      updatedCols.push({ name: c, type: 'number', isDerived: true });
    });

    const newDs = {
      ...baseData,
      columns: updatedCols,
      rows: derivedRows,
      totalColumns: updatedCols.length,
    };

    setMlPreparedDataset(newDs);
    setMlPrepLog(prev => [
      ...prev,
      {
        type: 'DERIVE_DATE_FEATURES',
        column,
        description: `Extracted temporal features (year, month, day, weekday, isWeekend) from "${column}".`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Ask Your Data
  const handleAskQuestion = async (queryText) => {
    if (!queryText.trim() || !activeDataset) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await askDatasetQuestion(queryText, activeDataset, profile, chatMessages, {
        insights,
        semanticUnderstanding,
      });

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        evidence: response.evidence,
        chartData: response.chartData,
        provider: response.provider,
        timestamp: new Date().toLocaleTimeString(),
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: `An error occurred while answering your question: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DatasetContext.Provider
      value={{
        rawDataset,
        activeDataset,
        profile,
        semanticUnderstanding,
        qualityRecommendations,
        automatedAnalysis,
        cleaningHistory,
        canUndo: historyStack.length > 1,
        mlPreparedDataset: mlPreparedDataset || activeDataset,
        mlPrepLog,
        mlTargetColumn,
        setMlTargetColumn,
        initMLDataset,
        applyMLEncoding,
        applyMLScaling,
        applyMLDateDerivation,
        activeTab,
        setActiveTab,
        isLoading,
        error,
        setError,
        insights,
        aiNarrative,
        insightsProvider,
        chatMessages,
        serverConfig,
        filters,
        setFilters,
        loadDataset,
        applyAllQualityRecommendations,
        applySingleQualityRecommendation,
        applyCleaningAction,
        undoLastAction,
        resetToRaw,
        handleAskQuestion,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
}
