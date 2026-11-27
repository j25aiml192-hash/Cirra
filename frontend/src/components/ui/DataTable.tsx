import * as React from "react";

export interface Column<T> {
  key: keyof T;
  header: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>;
  data: T[];
  loading?: boolean;
  emptyText?: string;
  headerStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
  rowStyle?: React.CSSProperties;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyText = "No data found",
  headerStyle,
  cellStyle,
  rowStyle,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-zinc-800/80 bg-[#09090b]">
        <div style={{ background: "#050505", padding: "12px 16px", borderBottom: "1px solid #27272a" }}>
          <div className="grid grid-cols-4 gap-4">
            {columns.slice(0, 4).map((_, i) => (
              <div key={i} className="animate-pulse bg-zinc-800 h-3 rounded" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-850 p-2">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="grid grid-cols-4 gap-4 py-3 px-3">
              <div className="animate-pulse bg-zinc-800 h-4 rounded w-3/4" />
              <div className="animate-pulse bg-zinc-800 h-4 rounded w-1/2" />
              <div className="animate-pulse bg-zinc-800 h-4 rounded w-2/3" />
              <div className="animate-pulse bg-zinc-800 h-4 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-800/80 bg-[#09090b] py-12 text-center text-xs text-zinc-400 font-mono">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-800/80 bg-[#09090b]">
      <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#050505", borderBottom: "1px solid #27272a" }}>
            {columns.map((col, index) => (
              <th
                key={String(col.key) + index}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#a1a1aa",
                  padding: "12px 16px",
                  width: col.width,
                  ...headerStyle,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIndex) => (
            <tr
              key={rIndex}
              className="hover:bg-zinc-900/60 transition-colors"
              style={{
                borderBottom: "1px solid #1f1f23",
                fontSize: 13,
                ...rowStyle,
              }}
            >
              {columns.map((col, cIndex) => {
                const val = row[col.key];
                return (
                  <td
                    key={String(col.key) + cIndex}
                    style={{
                      padding: "14px 18px",
                      color: "#f4f4f5",
                      ...cellStyle,
                    }}
                  >
                    {col.render ? col.render(val, row) : (val as React.ReactNode)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
