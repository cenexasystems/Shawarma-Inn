import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableSystemProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function TableSystem<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyMessage = "No data available.",
  onRowClick
}: TableSystemProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-erp-bg border-b border-erp-border">
            {columns.map((col, i) => (
              <th 
                key={i} 
                className={`px-[24px] h-[48px] font-inter text-[13px] font-[700] uppercase tracking-[1px] text-erp-muted sticky top-0 bg-erp-bg z-10 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-erp-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-[24px] py-[48px] text-center">
                <span className="font-inter text-[15px] font-[500] text-erp-muted">{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr 
                key={keyExtractor(row)} 
                onClick={() => onRowClick?.(row)}
                className={`h-[72px] transition-colors hover:bg-erp-bg ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, i) => (
                  <td 
                    key={i} 
                    className={`px-[24px] font-inter text-[15px] font-[500] text-erp-text ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
