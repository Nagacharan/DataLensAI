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
      <div className="rounded-2xl p-6 border border-orange-200/80 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/40 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-orange-100 text-coral-600 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ask Your Data</h2>
            <p className="text-xs text-slate-600">
              Natural-language analytics co-pilot grounded strictly in verified mathematical computations.
            </p>
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="mt-4 pt-3 border-t border-orange-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
            Suggested Queries for "{activeDataset.fileName}":
          </span>
          <div className="flex flex-wrap gap-2">
            {suggested.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleAskQuestion(s.question)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/70 text-xs text-slate-700 transition text-left shadow-2xs"
              >
                {s.question}
              </button>
            ))}
            <button
              onClick={() => handleAskQuestion('What is standard deviation and IQR?')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/70 text-xs text-slate-700 transition text-left shadow-2xs"
            >
              What is standard deviation and IQR?
            </button>
            <button
              onClick={() => handleAskQuestion('What are the key limitations of this dataset?')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/70 text-xs text-slate-700 transition text-left shadow-2xs"
            >
              What are the limitations of this dataset?
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Display Box */}
      <div className="bg-white rounded-2xl border border-slate-100 min-h-[420px] max-h-[600px] flex flex-col justify-between overflow-hidden shadow-sm">
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-coral-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-coral-500 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className={`text-[10px] font-semibold ${isUser ? 'text-orange-100' : 'text-slate-500'}`}>
                      {isUser ? 'You' : msg.provider || 'DataLens Co-pilot'}
                    </span>
                    <span className={`text-[10px] ${isUser ? 'text-orange-200' : 'text-slate-400'}`}>{msg.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Evidence Pills */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {msg.evidence.map((ev, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-[11px]"
                        >
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">
                            {ev.label}
                          </span>
                          <span className="font-semibold text-coral-600 font-mono">
                            {typeof ev.value === 'number' ? ev.value.toLocaleString() : ev.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Supporting Mini Chart if returned */}
                  {msg.chartData && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
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
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-500 text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin text-coral-500" />
              <span>Analyzing dataset & verifying mathematical calculations...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about your dataset or insights..."
              disabled={isLoading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-24 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-coral-500 focus:bg-white shadow-inner"
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
