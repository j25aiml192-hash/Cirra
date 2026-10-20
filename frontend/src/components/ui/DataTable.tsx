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
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyText = "No data found",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white">
        <div style={{ background: "#F8FAFC", padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
          <div className="grid grid-cols-4 gap-4">
            {columns.slice(0, 4).map((_, i) => (
              <div key={i} className="animate-shimmer h-3 rounded" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50 p-2">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="grid grid-cols-4 gap-4 py-3 px-3">
              <div className="animate-shimmer h-4 rounded w-3/4" />
              <div className="animate-shimmer h-4 rounded w-1/2" />
              <div className="animate-shimmer h-4 rounded w-2/3" />
              <div className="animate-shimmer h-4 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full rounded-xl border border-slate-100 bg-white py-12 text-center text-xs text-slate-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
            {columns.map((col, index) => (
              <th
                key={String(col.key) + index}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#94A3B8",
                  padding: "10px 16px",
                  width: col.width,
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
              className="hover:bg-slate-50/70 transition-colors"
              style={{
                borderBottom: "1px solid #F1F5F9",
                fontSize: 13,
              }}
            >
              {columns.map((col, cIndex) => {
                const val = row[col.key];
                return (
                  <td
                    key={String(col.key) + cIndex}
                    style={{
                      padding: "12px 16px",
                      color: "#1E293B",
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
