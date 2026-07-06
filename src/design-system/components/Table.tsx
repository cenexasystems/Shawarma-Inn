import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyMessage = "No data found.",
  onRowClick
}: TableProps<T>) {
  return (
    <div className="bg-white border border-gray-100 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#F7F8FA] border-b border-gray-100">
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-[30px] h-[56px] font-inter text-[13px] font-[700] uppercase tracking-[1px] text-[#7A7A7A] ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-[30px] py-[40px] text-center">
                  <span className="font-inter text-[15px] font-[500] text-[#7A7A7A]">{emptyMessage}</span>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr 
                  key={keyExtractor(row)} 
                  onClick={() => onRowClick?.(row)}
                  className={`h-[72px] transition-colors hover:bg-[#F7F8FA] ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, i) => (
                    <td 
                      key={i} 
                      className={`px-[30px] font-inter text-[15px] font-[500] text-[#202124] ${
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
    </div>
  );
}
