import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyText?: string;
  loading?: boolean;
}

export function Table<T>({ columns, data, keyExtractor, emptyText = 'No data', loading }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full ">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={clsx('px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                Loading…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="border-b border-gray-50 hover:bg-gray-50/60">
                {columns.map((col) => (
                  <td key={String(col.key)} className={clsx('px-4 py-3 text-gray-700', col.className)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
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
