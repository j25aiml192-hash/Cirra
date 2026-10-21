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
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyText = "No data found",
  headerStyle,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-[#D6E4F5] bg-white">
        <div style={{ background: "#F8FAFD", padding: "12px 16px", borderBottom: "1px solid #D6E4F5" }}>
          <div className="grid grid-cols-4 gap-4">
            {columns.slice(0, 4).map((_, i) => (
              <div key={i} className="animate-shimmer h-3 rounded" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-[#EBF2FA] p-2">
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
      <div className="w-full rounded-xl border border-[#D6E4F5] bg-white py-12 text-center text-xs text-[#64748B]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#D6E4F5] bg-white shadow-[0_4px_24px_-4px_rgba(12,48,96,0.05),0_1px_3px_rgba(0,0,0,0.02)]">
      <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F8FAFD", borderBottom: "1px solid #D6E4F5" }}>
            {columns.map((col, index) => (
              <th
                key={String(col.key) + index}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#334155",
                  padding: "10px 16px",
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
              className="hover:bg-[#F4F8FD] transition-colors"
              style={{
                borderBottom: "1px solid #EBF2FA",
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
                      color: "#0F1E36",
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
