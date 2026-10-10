import React, { useState, useRef, useEffect } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { BarChartCard } from '../charts/BarChartCard';
import { LineChartCard } from '../charts/LineChartCard';
import { generateSuggestedQuestions } from '../../utils/insights/deterministicInsightEngine';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  HelpCircle,
  BrainCircuit,
  CornerDownLeft,
} from 'lucide-react';

export function AskDataTab() {
  const {
    activeDataset,
    chatMessages,
    handleAskQuestion,
    isLoading,
    serverConfig,
  } = useDataset();

  const [inputQuery, setInputQuery] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  if (!activeDataset) return null;

  const suggested = generateSuggestedQuestions(activeDataset);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    const q = inputQuery.trim();
    setInputQuery('');
    handleAskQuestion(q);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-brand-500/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ask Your Data</h2>
            <p className="text-xs text-slate-400">
              Natural-language analytics co-pilot grounded strictly in verified mathematical computations.
            </p>
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Suggested Queries for "{activeDataset.fileName}":
          </span>
          <div className="flex flex-wrap gap-2">
            {suggested.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleAskQuestion(s.question)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-brand-500/60 hover:bg-brand-500/10 text-xs text-slate-300 transition text-left"
              >
                {s.question}
              </button>
            ))}
            <button
              onClick={() => handleAskQuestion('What is standard deviation and IQR?')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-brand-500/60 hover:bg-brand-500/10 text-xs text-slate-300 transition text-left"
            >
              What is standard deviation and IQR?
            </button>
            <button
              onClick={() => handleAskQuestion('What are the key limitations of this dataset?')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-brand-500/60 hover:bg-brand-500/10 text-xs text-slate-300 transition text-left"
            >
              What are the limitations of this dataset?
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Display Box */}
      <div className="glass-card rounded-2xl border border-slate-800 min-h-[420px] max-h-[600px] flex flex-col justify-between overflow-hidden">
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {isUser ? 'You' : msg.provider || 'DataLens Co-pilot'}
                    </span>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Evidence Pills */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {msg.evidence.map((ev, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px]"
                        >
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                            {ev.label}
                          </span>
                          <span className="font-semibold text-brand-300 font-mono">
                            {typeof ev.value === 'number' ? ev.value.toLocaleString() : ev.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Supporting Mini Chart if returned */}
                  {msg.chartData && (
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      {msg.chartData.type === 'bar' && (
                        <BarChartCard
                          title={msg.chartData.title || 'Supporting Breakdown'}
                          data={msg.chartData.data}
                          xKey={msg.chartData.xAxis || 'group'}
                          yKey={msg.chartData.yAxis || 'value'}
                          height={220}
                        />
                      )}
                      {msg.chartData.type === 'line' && (
                        <LineChartCard
                          title={msg.chartData.title || 'Supporting Trend'}
                          data={msg.chartData.data}
                          xKey={msg.chartData.xAxis || 'date'}
                          yKey={msg.chartData.yAxis || 'value'}
                          height={220}
                        />
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              <span>Analyzing dataset & verifying mathematical calculations...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about your dataset or insights..."
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-4 pr-24 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-inner"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!inputQuery.trim() || isLoading}
                icon={Send}
              >
                Ask
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
