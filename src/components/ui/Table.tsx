import { useState, useEffect, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  title: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  highlightRow?: (row: T) => boolean;
  emptyText?: string;
  defaultPageSize?: number;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  highlightRow,
  emptyText = '暂无数据',
  defaultPageSize = 20,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // 数据变化时重置到第1页（搜索过滤时）
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pageData = data.slice(startIndex, startIndex + pageSize);

  // 生成页码按钮列表
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (safeCurrentPage > 3) pages.push('...');
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safeCurrentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-slate-200">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ padding: '14px 24px' }}
                  className={`text-center font-semibold text-slate-600 bg-slate-50 border border-slate-200 whitespace-nowrap ${col.className || ''}`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-slate-400 border border-slate-200"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  className={`transition-colors hover:bg-sky-50/50 ${
                    highlightRow?.(row) ? 'bg-sky-50 font-medium' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ padding: '14px 24px' }}
                      className={`text-center text-slate-700 border border-slate-200 ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(row, startIndex + index)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      {data.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 4px',
            fontSize: '13px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>共 {data.length} 条</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                color: '#475569',
                backgroundColor: '#fff',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} 条/页</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: safeCurrentPage <= 1 ? '#f8fafc' : '#fff',
                color: safeCurrentPage <= 1 ? '#cbd5e1' : '#475569',
                cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              上一页
            </button>

            {getPageNumbers().map((page, i) =>
              page === '...' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '4px 6px', color: '#94a3b8' }}>...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: page === safeCurrentPage ? '#3b82f6' : '#e2e8f0',
                    backgroundColor: page === safeCurrentPage ? '#3b82f6' : '#fff',
                    color: page === safeCurrentPage ? '#fff' : '#475569',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: page === safeCurrentPage ? 600 : 400,
                  }}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: safeCurrentPage >= totalPages ? '#f8fafc' : '#fff',
                color: safeCurrentPage >= totalPages ? '#cbd5e1' : '#475569',
                cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
