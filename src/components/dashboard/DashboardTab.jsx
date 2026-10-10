import React, { useState, useMemo } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { PreviewTable } from '../overview/PreviewTable';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { aggregateByGroup, aggregateByTime } from '../../utils/analysis/aggregations.js';
import { calculateNumericStats } from '../../utils/analysis/statistics.js';
import { buildCorrelationMatrix } from '../../utils/analysis/correlations.js';
import {
  Database,
  Layers,
  Sparkles,
  TrendingUp,
  DollarSign,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  GitCommit,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

// Pastel palette matching the clean design
const PASTEL_PALETTE = {
  coral: '#FA5F38',
  peach: '#FDBA74',
  yellow: '#FBBF24',
  mint: '#34D399',
  teal: '#2DD4BF',
  sky: '#38BDF8',
  blue: '#60A5FA',
  purple: '#C084FC',
  rose: '#FB7185',
};

const DONUT_COLORS = ['#38BDF8', '#34D399', '#FBBF24', '#FA5F38', '#C084FC', '#818CF8'];
const BAR_COLORS = ['#FBBF24', '#FDBA74', '#FA5F38', '#34D399', '#38BDF8', '#C084FC'];

// Clean custom tooltip
const CleanTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-xl border border-slate-800">
        <p className="font-semibold text-coral-400">{label || payload[0]?.name}</p>
        <p className="text-slate-200 mt-0.5">
          {typeof payload[0]?.value === 'number'
            ? Number(payload[0].value).toLocaleString()
            : payload[0]?.value}
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardTab({ activeFilterVal = 'ALL' }) {
  const {
    activeDataset,
    profile,
    semanticUnderstanding,
    insights,
    setActiveTab,
    handleAskQuestion,
  } = useDataset();

  // Collapsible toggle for Custom Studio
  const [showCustomStudio, setShowCustomStudio] = useState(false);

  // Column definitions
  const numCols = useMemo(() => {
    return activeDataset?.columns.filter(c => c.type === 'number' && !c.isIdentifier) || [];
  }, [activeDataset]);

  const catCols = useMemo(() => {
    return activeDataset?.columns.filter(c => (c.type === 'string' || c.type === 'boolean') && !c.isIdentifier) || [];
  }, [activeDataset]);

  const dateCols = useMemo(() => {
    return activeDataset?.columns.filter(c => c.type === 'date') || [];
  }, [activeDataset]);

  // Primary column anchors
  const primaryCat = semanticUnderstanding?.primaryCategory?.name || catCols[0]?.name;
  const primaryMetric = semanticUnderstanding?.primaryMetric?.name || numCols[0]?.name;
  const secondaryMetric = numCols.find(c => c.name !== primaryMetric)?.name || primaryMetric;

  // Filtered rows based on top pill selection
  const filteredRows = useMemo(() => {
    if (!activeDataset?.rows) return [];
    if (!activeFilterVal || activeFilterVal === 'ALL' || !primaryCat) return activeDataset.rows;
    return activeDataset.rows.filter(r => String(r[primaryCat]) === activeFilterVal);
  }, [activeDataset?.rows, primaryCat, activeFilterVal]);

  // Descriptive statistics for primary metric
  const primaryMetricStats = useMemo(() => {
    if (!primaryMetric || filteredRows.length === 0) return null;
    const values = filteredRows.map(r => r[primaryMetric]).filter(v => typeof v === 'number');
    return calculateNumericStats(values);
  }, [filteredRows, primaryMetric]);

  // 1. Donut Chart Data (Segment Distribution)
  const donutData = useMemo(() => {
    if (!primaryCat) return [];
    const grouped = aggregateByGroup(filteredRows, primaryCat, primaryMetric, 'sum', 5);
    const total = grouped.reduce((sum, g) => sum + (g.value || 0), 0) || 1;
    return grouped.map((g, i) => ({
      name: g.group,
      value: Number(g.value?.toFixed ? g.value.toFixed(2) : g.value),
      pct: Math.round(((g.value || 0) / total) * 100),
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }));
  }, [filteredRows, primaryCat, primaryMetric]);

  const topDonutShare = donutData[0]?.pct || 0;
  const topDonutName = donutData[0]?.name || 'N/A';

  // 2. Bar Chart Data (Performance Breakdown by Category)
  const barData = useMemo(() => {
    if (!primaryCat || !primaryMetric) return [];
    const grouped = aggregateByGroup(filteredRows, primaryCat, primaryMetric, 'sum', 6);
    return grouped.map((g, i) => ({
      name: g.group,
      value: Number(g.value?.toFixed ? g.value.toFixed(2) : g.value),
      fill: BAR_COLORS[i % BAR_COLORS.length],
    }));
  }, [filteredRows, primaryCat, primaryMetric]);

  const topPerformer = barData[0]?.name || 'Leading';

  // 3. Time Series / Progression Curve
  const trajectoryData = useMemo(() => {
    if (dateCols.length > 0 && primaryMetric) {
      const grouped = aggregateByTime(filteredRows, dateCols[0].name, primaryMetric, 'sum', 'month');
      return grouped.map(g => ({
        label: g.date,
        value: Number(g.value?.toFixed ? g.value.toFixed(2) : g.value),
      }));
    }
    // Fallback: Ranked cumulative curve
    if (primaryMetric && filteredRows.length > 0) {
      const sorted = [...filteredRows]
        .map(r => r[primaryMetric])
        .filter(v => typeof v === 'number')
        .sort((a, b) => a - b);
      const step = Math.max(1, Math.floor(sorted.length / 8));
      return sorted
        .filter((_, idx) => idx % step === 0)
        .slice(0, 8)
        .map((val, idx) => ({
          label: `P${idx + 1}`,
          value: Number(val?.toFixed ? val.toFixed(2) : val),
        }));
    }
    return [];
  }, [filteredRows, dateCols, primaryMetric]);

  // 4. Frequency Distribution Histogram Bins
  const histogramData = useMemo(() => {
    if (!primaryMetric || filteredRows.length === 0) return [];
    const vals = filteredRows.map(r => r[primaryMetric]).filter(v => typeof v === 'number');
    if (vals.length === 0) return [];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min === max) return [{ bin: `${min}`, count: vals.length }];
    const binCount = 6;
    const step = (max - min) / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => {
      const low = min + i * step;
      const high = low + step;
      return {
        bin: `${Math.round(low)} - ${Math.round(high)}`,
        count: 0,
      };
    });
    vals.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / step), binCount - 1);
      if (bins[idx]) bins[idx].count += 1;
    });
    return bins;
  }, [filteredRows, primaryMetric]);

  // 5. Bivariate Scatter Plot Data
  const scatterData = useMemo(() => {
    if (numCols.length < 2) return [];
    const colX = numCols[0].name;
    const colY = numCols[1].name;
    return filteredRows
      .filter(r => typeof r[colX] === 'number' && typeof r[colY] === 'number')
      .slice(0, 100)
      .map(r => ({ x: r[colX], y: r[colY] }));
  }, [filteredRows, numCols]);

  // 6. Secondary Grouping / Average Metric Comparison
  const avgComparisonData = useMemo(() => {
    if (!primaryCat || !secondaryMetric) return [];
    const grouped = aggregateByGroup(filteredRows, primaryCat, secondaryMetric, 'mean', 6);
    return grouped.map((g, i) => ({
      name: g.group,
      value: Number(g.value?.toFixed ? g.value.toFixed(2) : g.value),
      fill: DONUT_COLORS[(i + 2) % DONUT_COLORS.length],
    }));
  }, [filteredRows, primaryCat, secondaryMetric]);

  // Correlation Matrix
  const correlations = useMemo(() => {
    if (numCols.length < 2) return [];
    return buildCorrelationMatrix(filteredRows, numCols.map(c => c.name)).slice(0, 6);
  }, [filteredRows, numCols]);

  // Custom Chart Studio State
  const [customX, setCustomX] = useState(catCols[0]?.name || activeDataset?.columns[0]?.name || '');
  const [customY, setCustomY] = useState(numCols[0]?.name || '');
  const [customChartType, setCustomChartType] = useState('bar');
  const [customAgg, setCustomAgg] = useState('sum');

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
    const res = aggregateByGroup(filteredRows, customX, customY || null, customY ? customAgg : 'count', 10);
    return res.map(g => ({ group: g.group, name: g.group, value: g.value, date: g.group }));
  }, [filteredRows, customX, customY, customChartType, customAgg, dateCols]);

  if (!activeDataset) return null;

  return (
    <div className="space-y-6">
      {/* 1. Top Executive KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Observations"
          value={filteredRows.length.toLocaleString()}
          subtext={
            activeFilterVal !== 'ALL'
              ? `Filtered from ${activeDataset.rows.length} total rows`
              : `${activeDataset.columns.length} columns verified`
          }
          icon={Database}
          variant="brand"
        />

        <StatCard
          title={primaryMetric ? `Total ${primaryMetric}` : 'Primary Metric Total'}
          value={
            primaryMetricStats?.sum !== undefined
              ? primaryMetricStats.sum >= 1000000
                ? `$${(primaryMetricStats.sum / 1000000).toFixed(2)}M`
                : primaryMetricStats.sum >= 1000
                ? `${(primaryMetricStats.sum / 1000).toFixed(1)}k`
                : primaryMetricStats.sum.toLocaleString()
              : 'N/A'
          }
          subtext="Verified deterministic sum"
          icon={DollarSign}
          variant="emerald"
        />

        <StatCard
          title={primaryMetric ? `Mean ${primaryMetric}` : 'Average Value'}
          value={
            primaryMetricStats?.mean !== undefined
              ? primaryMetricStats.mean >= 1000
                ? `${(primaryMetricStats.mean / 1000).toFixed(1)}k`
                : primaryMetricStats.mean.toFixed(2)
              : 'N/A'
          }
          subtext={
            primaryMetricStats?.stdDev
              ? `Std Dev: ±${primaryMetricStats.stdDev.toFixed(2)}`
              : 'Statistical midpoint'
          }
          icon={TrendingUp}
          variant="purple"
        />

        <StatCard
          title={primaryCat ? `Top ${primaryCat}` : 'Leading Segment'}
          value={`${topDonutShare}%`}
          subtext={`${topDonutName} volume share`}
          icon={Activity}
          variant="amber"
        />
      </div>

      {/* 2. Visual Analytics 6-Card Grid (Clean Pastel Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Segment Distribution Donut */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {primaryCat ? `${primaryCat} Share` : 'Segment Distribution'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Proportion of total {primaryMetric || 'volume'}
              </p>
            </div>
            <Badge variant="primary" size="xs">
              {donutData.length} Segments
            </Badge>
          </div>

          <div className="h-48 relative flex items-center justify-center">
            {donutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CleanTooltip />} />
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Callout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {topDonutShare}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[90px]">
                    {topDonutName}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">No categorical segments available</p>
            )}
          </div>
        </div>

        {/* Card 2: Performance Clustered Bars */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {primaryMetric} by {primaryCat}
              </h3>
              <p className="text-[11px] text-slate-400">
                Ranked breakdown by category
              </p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Top: {topPerformer}
            </span>
          </div>

          <div className="h-48">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CleanTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 flex items-center justify-center h-full">No categorical data</p>
            )}
          </div>
        </div>

        {/* Card 3: Trajectory Spline Curve */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {primaryMetric} Trajectory
              </h3>
              <p className="text-[11px] text-slate-400">
                {dateCols.length > 0 ? 'Chronological timeline progression' : 'Cumulative concentration curve'}
              </p>
            </div>
            <Badge variant="accent" size="xs">
              Trend
            </Badge>
          </div>

          <div className="h-48">
            {trajectoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="pastelAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FA5F38" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FA5F38" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CleanTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#FA5F38"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#pastelAreaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 flex items-center justify-center h-full">No progression data</p>
            )}
          </div>
        </div>

        {/* Card 4: Frequency Distribution Histogram */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {primaryMetric} Distribution
              </h3>
              <p className="text-[11px] text-slate-400">
                Frequency intervals & observation volume
              </p>
            </div>
            {primaryMetricStats?.mean !== undefined && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                μ = {primaryMetricStats.mean.toFixed(1)}
              </span>
            )}
          </div>

          <div className="h-48">
            {histogramData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="bin"
                    tick={{ fontSize: 9, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CleanTooltip />} />
                  <Bar dataKey="count" fill="#38BDF8" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 flex items-center justify-center h-full">No distribution data</p>
            )}
          </div>
        </div>

        {/* Card 5: Bivariate Correlation Scatter */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {numCols.length >= 2 ? `${numCols[0].name} vs ${numCols[1].name}` : 'Bivariate Correlation'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Cross-attribute dispersion plot
              </p>
            </div>
            {correlations[0] && (
              <span className="text-[10px] font-mono font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                r = {correlations[0].correlation}
              </span>
            )}
          </div>

          <div className="h-48">
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={numCols[0]?.name || 'X'}
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={numCols[1]?.name || 'Y'}
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CleanTooltip />} />
                  <Scatter data={scatterData} fill="#C084FC" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <span className="text-xs text-slate-400">Requires 2+ numerical columns</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 6: Average Metric by Segment Comparison */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Average {secondaryMetric}
              </h3>
              <p className="text-[11px] text-slate-400">
                Comparative unit benchmarks by {primaryCat}
              </p>
            </div>
            <Badge variant="neutral" size="xs">
              Benchmark
            </Badge>
          </div>

          <div className="h-48">
            {avgComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={avgComparisonData}
                  layout="vertical"
                  margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip content={<CleanTooltip />} />
                  <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                    {avgComparisonData.map((entry, index) => (
                      <Cell key={`avg-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 flex items-center justify-center h-full">No comparison data</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Automated Key Findings & Verified Mathematical Discoveries */}
      {insights.length > 0 && (
        <Card
          title="Automated Key Findings & Grounded Discoveries"
          subtitle={`Grounded strictly in verified mathematical computations from "${activeDataset.fileName}"`}
          icon={Sparkles}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('insights')}
              className="text-coral-600 hover:text-coral-700 font-semibold"
            >
              View All {insights.length} Insights <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 4).map((ins, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-slate-800">{ins.title}</span>
                    <Badge variant="primary" size="xs">
                      {ins.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ins.summary}</p>
                </div>

                {ins.evidence && ins.evidence.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    {ins.evidence.slice(0, 2).map((ev, i) => (
                      <div key={i} className="text-[11px] p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">
                          {ev.label}
                        </span>
                        <span className="font-semibold text-coral-600 font-mono">
                          {typeof ev.value === 'number' ? ev.value.toLocaleString() : ev.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      handleAskQuestion(`Explain: ${ins.title}`);
                      setActiveTab('ask');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-coral-600 hover:text-coral-700"
                  >
                    <span>Investigate finding</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Automated Pearson Correlation Analysis */}
      {correlations.length > 0 && (
        <Card
          title="Automated Pearson Correlation Analysis"
          subtitle="Measures linear association between numerical features without causal overreach"
          icon={GitCommit}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {correlations.map((corr, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{corr.columnA}</span>
                    <span className="text-slate-400">↔</span>
                    <span>{corr.columnB}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {corr.strength} {corr.direction}
                  </span>
                </div>
                <div className="text-right">
                  <Badge
                    variant={corr.strength === 'strong' ? 'accent' : corr.strength === 'moderate' ? 'primary' : 'neutral'}
                    size="sm"
                    className="font-mono font-bold"
                  >
                    r = {corr.correlation}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Interactive Data Preview Table */}
      <PreviewTable />

      {/* 6. Collapsible Custom Visualization Studio */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <button
          onClick={() => setShowCustomStudio(prev => !prev)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-slate-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
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
          <div className="p-5 border-t border-slate-100 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">X-Axis Feature:</label>
                <select
                  value={customX}
                  onChange={(e) => setCustomX(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-coral-500"
                >
                  {activeDataset.columns.map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Y-Axis Metric:</label>
                <select
                  value={customY}
                  onChange={(e) => setCustomY(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-coral-500"
                >
                  <option value="">-- Record Count --</option>
                  {numCols.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Chart Type:</label>
                <select
                  value={customChartType}
                  onChange={(e) => setCustomChartType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-coral-500"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie / Donut</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="histogram">Histogram</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Aggregation Function:</label>
                <select
                  value={customAgg}
                  onChange={(e) => setCustomAgg(e.target.value)}
                  disabled={!customY || customChartType === 'scatter' || customChartType === 'histogram'}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-coral-500 disabled:opacity-50"
                >
                  <option value="sum">Sum</option>
                  <option value="mean">Mean (Average)</option>
                  <option value="count">Count</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>
            </div>

            <div className="h-72 bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-center">
              {customChartType === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip content={<CleanTooltip />} />
                    <Bar dataKey="value" fill="#FA5F38" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {customChartType === 'line' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={customChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip content={<CleanTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {customChartType === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CleanTooltip />} />
                    <Pie data={customChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {customChartData.map((_, i) => (
                        <Cell key={`pie-${i}`} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              {customChartType === 'scatter' && (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" dataKey="x" name={customX} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis type="number" dataKey="y" name={customY} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip content={<CleanTooltip />} />
                    <Scatter data={customChartData} fill="#C084FC" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
              {customChartType === 'histogram' && (
                <div className="text-xs text-slate-500">
                  Computed distribution values: {customChartData.length} records processed.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
