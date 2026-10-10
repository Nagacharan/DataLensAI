import React, { useState, useMemo } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Download, Table } from 'lucide-react';
import { exportToCSVText } from '../../utils/data-preparation/mlPreparer';

export function PreviewTable() {
  const { activeDataset } = useDataset();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (!activeDataset || !activeDataset.rows) return null;

  const handleSort = (colName) => {
    if (sortColumn === colName) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
    setPage(1);
  };

  // Filter & Sort
  const processedRows = useMemo(() => {
    let rows = [...activeDataset.rows];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(r =>
        Object.values(r).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(q))
      );
    }

    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [activeDataset.rows, searchTerm, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const paginatedRows = processedRows.slice((page - 1) * pageSize, page * pageSize);

  const handleDownloadViewCSV = () => {
    const csv = exportToCSVText(processedRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preview_${activeDataset.fileName || 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title="Data Preview & Inspection"
      subtitle={`Displaying records from "${activeDataset.fileName}" with search, sorting, and pagination`}
      icon={Table}
      action={
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter records..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadViewCSV}
            icon={Download}
            title="Download filtered view as CSV"
          >
            Export View
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto -mx-5 -mb-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-y border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-4 w-12 text-slate-500">#</th>
              {activeDataset.columns.map(col => (
                <th
                  key={col.name}
                  onClick={() => handleSort(col.name)}
                  className="py-2.5 px-4 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.name}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortColumn === col.name ? 'text-brand-400' : 'text-slate-600'}`} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-slate-300">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {activeDataset.columns.map(col => {
                    const val = row[col.name];
                    const isMissing = val === null || val === undefined || val === '';
                    return (
                      <td key={col.name} className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        {isMissing ? (
                          <span className="text-slate-600 italic">null</span>
                        ) : typeof val === 'number' ? (
                          <span className="text-brand-300">{val.toLocaleString()}</span>
                        ) : typeof val === 'boolean' ? (
                          <span className={val ? 'text-emerald-400' : 'text-rose-400'}>{String(val)}</span>
                        ) : (
                          <span>{String(val)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={activeDataset.columns.length + 1} className="py-8 text-center text-slate-500">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div>
          Showing <span className="font-medium text-slate-200">{processedRows.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-medium text-slate-200">{Math.min(page * pageSize, processedRows.length)}</span> of{' '}
          <span className="font-medium text-slate-200">{processedRows.length.toLocaleString()}</span> rows
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              icon={ChevronLeft}
            >
              Prev
            </Button>
            <span className="px-2 font-medium text-slate-300">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              icon={ChevronRight}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
