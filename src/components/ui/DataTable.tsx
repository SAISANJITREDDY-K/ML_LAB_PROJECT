import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  records: Record<string, any>[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  records,
  totalRecords,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter local preview records by search term
  const filteredRecords = searchTerm.trim()
    ? records.filter((r) =>
        Object.values(r).some((val) =>
          String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : records;

  const handleDownloadPage = () => {
    if (!records || records.length === 0) return;
    const header = columns.join(',');
    const rows = records.map((r) =>
      columns.map((c) => JSON.stringify(r[c] ?? '')).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `preview_page_${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-xs">
      {/* Table Toolbar */}
      <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search in visible rows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-mono tabular-nums">
            Showing {filteredRecords.length} of {totalRecords} total records
          </span>
          <button
            onClick={handleDownloadPage}
            title="Download visible page as CSV"
            className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Page</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading dataset records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {searchTerm ? 'No matching rows found in this page.' : 'No records available.'}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-3 w-12 text-center font-mono">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map((row, rIdx) => {
                const rowIndex = (currentPage - 1) * 20 + rIdx + 1;
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-indigo-50/30 transition-colors h-10"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px] tabular-nums">
                      {rowIndex}
                    </td>
                    {columns.map((col, cIdx) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined;
                      const isNum = typeof val === 'number';

                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-3 whitespace-nowrap ${
                            isNum ? 'text-right font-mono tabular-nums text-slate-800' : 'text-slate-700'
                          }`}
                        >
                          {isNull ? (
                            <span className="text-amber-600 font-mono text-[11px] italic bg-amber-50 px-1 py-0.5 rounded">
                              null
                            </span>
                          ) : isNum ? (
                            Number.isInteger(val) ? val : Number(val).toFixed(2)
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/40 text-xs text-slate-500">
        <span className="font-mono tabular-nums">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono tabular-nums text-slate-700 font-medium">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
