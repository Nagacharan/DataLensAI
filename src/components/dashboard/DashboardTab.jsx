import React, { useState, useMemo } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { BarChartCard } from '../charts/BarChartCard';
import { LineChartCard } from '../charts/LineChartCard';
import { PieChartCard } from '../charts/PieChartCard';
import { ScatterChartCard } from '../charts/ScatterChartCard';
import { HistogramChartCard } from '../charts/HistogramChartCard';
import { PreviewTable } from '../overview/PreviewTable';
import { aggregateByGroup, aggregateByTime } from '../../utils/analysis/aggregations.js';
import { calculateNumericStats } from '../../utils/analysis/statistics.js';
import { buildCorrelationMatrix } from '../../utils/analysis/correlations.js';
import {
  BarChart3,
  Sliders,
  Filter,
  DollarSign,
  TrendingUp,
  Hash,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  GitCommit,
  Table,
} from 'lucide-react';

export function DashboardTab() {
  const { activeDataset, semanticUnderstanding } = useDataset();

  // Collapsible toggle for Custom Visualization Studio
  const [showCustomStudio, setShowCustomStudio] = useState(false);

  // Column options
  const numCols = activeDataset?.columns.filter(c => c.type === 'number' && !c.isIdentifier) || [];
  const catCols = activeDataset?.columns.filter(c => (c.type === 'string' || c.type === 'boolean') && !c.isIdentifier) || [];
  const dateCols = activeDataset?.columns.filter(c => c.type === 'date') || [];

  // Active filter state
  const [filterCatCol, setFilterCatCol] = useState(catCols[0]?.name || '');
  const [filterCatVal, setFilterCatVal] = useState('ALL');

  // Custom Chart Builder state (secondary)
  const [customX, setCustomX] = useState(catCols[0]?.name || activeDataset?.columns[0]?.name || '');
  const [customY, setCustomY] = useState(numCols[0]?.name || '');
  const [customChartType, setCustomChartType] = useState('bar');
  const [customAgg, setCustomAgg] = useState('sum');

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!activeDataset?.rows) return [];
    if (!filterCatCol || filterCatVal === 'ALL') return activeDataset.rows;
    return activeDataset.rows.filter(r => String(r[filterCatCol]) === filterCatVal);
  }, [activeDataset?.rows, filterCatCol, filterCatVal]);

  // Unique values for category filter
  const filterOptions = useMemo(() => {
    if (!activeDataset?.rows || !filterCatCol) return [];
    const set = new Set();
    activeDataset.rows.forEach(r => {
      const v = r[filterCatCol];
      if (v !== null && v !== undefined && v !== '') set.add(String(v));
    });
    return Array.from(set).slice(0, 30);
  }, [activeDataset?.rows, filterCatCol]);

  // Key metrics on filtered data
  const primaryMetric = semanticUnderstanding?.primaryMetric?.name || numCols[0]?.name;
  const primaryMetricStats = useMemo(() => {
    if (!primaryMetric || filteredRows.length === 0) return null;
    return calculateNumericStats(filteredRows.map(r => r[primaryMetric]));
  }, [filteredRows, primaryMetric]);

  // Auto Charts Data
  const primaryCat = semanticUnderstanding?.primaryCategory?.name || catCols[0]?.name;
  const barData = useMemo(() => {
    if (!primaryCat || !primaryMetric) return [];
    return aggregateByGroup(filteredRows, primaryCat, primaryMetric, 'sum', 8);
  }, [filteredRows, primaryCat, primaryMetric]);

  const pieData = useMemo(() => {
    if (!primaryCat) return [];
    return aggregateByGroup(filteredRows, primaryCat, primaryMetric || null, primaryMetric ? 'sum' : 'count', 6)
      .map(g => ({ name: g.group, value: g.value }));
  }, [filteredRows, primaryCat, primaryMetric]);

  const timeData = useMemo(() => {
    if (dateCols.length === 0 || !primaryMetric) return [];
    return aggregateByTime(filteredRows, dateCols[0].name, primaryMetric, 'sum', 'month');
  }, [filteredRows, dateCols, primaryMetric]);

  const scatterData = useMemo(() => {
    if (numCols.length < 2) return [];
    const colX = numCols[0].name;
    const colY = numCols[1].name;
    return filteredRows
      .filter(r => typeof r[colX] === 'number' && typeof r[colY] === 'number')
      .slice(0, 150)
      .map(r => ({ x: r[colX], y: r[colY] }));
  }, [filteredRows, numCols]);

  // Correlation Matrix
  const correlations = useMemo(() => {
    if (numCols.length < 2) return [];
    return buildCorrelationMatrix(filteredRows, numCols.map(c => c.name)).slice(0, 6);
  }, [filteredRows, numCols]);

  // Custom Chart Data calculation
  const customChartData = useMemo(() => {
    if (customChartType === 'histogram') {
      return filteredRows.map(r => r[customY || customX]).filter(v => typeof v === 'number');
    }
    if (customChartType === 'scatter') {
      return filteredRows
        .filter(r => typeof r[customX] === 'number' && typeof r[customY] === 'number')
        .slice(0, 150)
        .map(r => ({ x: r[customX], y: r[customY] }));
    }
    if (customChartType === 'line' && dateCols.some(d => d.name === customX)) {
      return aggregateByTime(filteredRows, customX, customY, customAgg, 'month');
    }
    // Bar or Pie
    const res = aggregateByGroup(filteredRows, customX, customY || null, customY ? customAgg : 'count', 10);
    return res.map(g => ({ group: g.group, name: g.group, value: g.value, date: g.group }));
  }, [filteredRows, customX, customY, customChartType, customAgg, dateCols]);

  if (!activeDataset) return null;

  return (
    <div className="space-y-6">
      {/* Interactive Global Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Filter className="w-3.5 h-3.5 text-brand-400" />
            <span>Interactive Filter:</span>
          </div>

          {catCols.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={filterCatCol}
                onChange={(e) => {
                  setFilterCatCol(e.target.value);
                  setFilterCatVal('ALL');
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                {catCols.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>

              <select
                value={filterCatVal}
                onChange={(e) => setFilterCatVal(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Categories ({filteredRows.length})</option>
                {filterOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-200">{filteredRows.length.toLocaleString()}</span> of{' '}
          <span className="font-semibold text-slate-200">{activeDataset.totalRows.toLocaleString()}</span> records
          {filterCatVal !== 'ALL' && (
            <button
              onClick={() => setFilterCatVal('ALL')}
              className="ml-2 text-brand-400 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      {primaryMetricStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Total ${primaryMetric}`}
            value={primaryMetricStats.sum.toLocaleString()}
            subtext={`Aggregated volume`}
            icon={DollarSign}
            variant="brand"
          />
          <StatCard
            title={`Average ${primaryMetric}`}
            value={primaryMetricStats.mean.toLocaleString()}
            subtext={`Median: ${primaryMetricStats.median.toLocaleString()}`}
            icon={TrendingUp}
            variant="purple"
          />
          <StatCard
            title={`Variance / StdDev`}
            value={primaryMetricStats.stdDev.toLocaleString()}
            subtext={`Sample dispersion`}
            icon={Activity}
            variant="emerald"
          />
          <StatCard
            title={`Extreme Observed Max`}
            value={primaryMetricStats.max.toLocaleString()}
            subtext={`Min: ${primaryMetricStats.min.toLocaleString()}`}
            icon={Hash}
            variant="amber"
          />
        </div>
      )}

      {/* Auto Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Chart */}
        {barData.length > 0 && (
          <BarChartCard
            title={`Total ${primaryMetric} by ${primaryCat}`}
            subtitle="Top aggregated category volume rankings"
            data={barData}
            xKey="group"
            yKey="value"
          />
        )}

        {/* Chart 2: Category Breakdown Donut */}
        {pieData.length > 0 && (
          <PieChartCard
            title={`${primaryCat} Proportion Share`}
            subtitle="Proportional segment distribution"
            data={pieData}
            isDonut={true}
          />
        )}

        {/* Chart 3: Time Series (if available) */}
        {timeData.length > 0 && (
          <LineChartCard
            title={`${primaryMetric} Trajectory Over Time`}
            subtitle={`Chronological progression recorded across "${dateCols[0]?.name}"`}
            data={timeData}
            xKey="date"
            yKey="value"
          />
        )}

        {/* Chart 4: Numeric Histogram */}
        {primaryMetricStats && (
          <HistogramChartCard
            title={`${primaryMetric} Frequency Distribution`}
            subtitle="Equal-width binned observation counts"
            values={filteredRows.map(r => r[primaryMetric])}
          />
        )}

        {/* Chart 5: Scatter Plot */}
        {scatterData.length > 0 && (
          <ScatterChartCard
            title={`Relationship: ${numCols[0].name} vs ${numCols[1].name}`}
            subtitle="Bivariate correlation scatter plot"
            data={scatterData}
            xLabel={numCols[0].name}
            yLabel={numCols[1].name}
          />
        )}
      </div>

      {/* Correlation Summary Matrix (if 2+ numeric columns) */}
      {correlations.length > 0 && (
        <Card
          title="Automated Pearson Correlation Analysis"
          subtitle="Measures the strength and direction of linear relationships between numerical features"
          icon={GitCommit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {correlations.map((corr, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{corr.columnA}</span>
                    <span className="text-slate-500">↔</span>
                    <span>{corr.columnB}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 capitalize">
                    {corr.strength} {corr.direction}
                  </span>
                </div>
                <div className="text-right">
                  <Badge
                    variant={corr.strength === 'strong' ? 'accent' : corr.strength === 'moderate' ? 'primary' : 'neutral'}
                    size="sm"
                    className="font-mono"
                  >
                    r = {corr.correlation}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Interactive Data Table Explorer */}
      <PreviewTable />

      {/* Collapsible Custom Visualization Studio (Secondary Tool) */}
      <div className="border border-slate-800 rounded-xl overflow-hidden glass-card">
        <button
          onClick={() => setShowCustomStudio(prev => !prev)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-slate-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Custom Chart Builder Studio (Optional)
              </h3>
              <p className="text-xs text-slate-500">
                Tailor custom charts by manually selecting attributes, aggregations, and visual types.
              </p>
            </div>
          </div>
          {showCustomStudio ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showCustomStudio && (
          <div className="p-5 border-t border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">X-Axis Feature:</label>
                <select
                  value={customX}
                  onChange={(e) => setCustomX(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {activeDataset.columns.map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Y-Axis Metric:</label>
                <select
                  value={customY}
                  onChange={(e) => setCustomY(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Record Count --</option>
                  {numCols.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Chart Type:</label>
                <select
                  value={customChartType}
                  onChange={(e) => setCustomChartType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie / Donut</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="histogram">Histogram</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Aggregation Function:</label>
                <select
                  value={customAgg}
                  onChange={(e) => setCustomAgg(e.target.value)}
                  disabled={!customY || customChartType === 'scatter' || customChartType === 'histogram'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-50"
                >
                  <option value="sum">Sum</option>
                  <option value="mean">Mean (Average)</option>
                  <option value="count">Count</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>
            </div>

            <div>
              {customChartType === 'bar' && (
                <BarChartCard
                  title={`Custom Bar: ${customAgg.toUpperCase()} of ${customY || 'Records'} by ${customX}`}
                  data={customChartData}
                  xKey="group"
                  yKey="value"
                  height={320}
                />
              )}
              {customChartType === 'line' && (
                <LineChartCard
                  title={`Custom Line: ${customY || 'Count'} across ${customX}`}
                  data={customChartData}
                  xKey="date"
                  yKey="value"
                  height={320}
                />
              )}
              {customChartType === 'pie' && (
                <PieChartCard
                  title={`Custom Proportion: ${customX}`}
                  data={customChartData}
                  height={320}
                  isDonut={true}
                />
              )}
              {customChartType === 'scatter' && (
                <ScatterChartCard
                  title={`Custom Scatter: ${customX} vs ${customY}`}
                  data={customChartData}
                  xLabel={customX}
                  yLabel={customY}
                  height={320}
                />
              )}
              {customChartType === 'histogram' && (
                <HistogramChartCard
                  title={`Custom Histogram: Distribution of ${customY || customX}`}
                  values={customChartData}
                  height={320}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
