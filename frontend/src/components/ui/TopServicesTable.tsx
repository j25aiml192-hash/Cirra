import * as React from "react";
import type { TopService } from "@/types";
import { Badge } from "./Badge";

export interface TopServicesTableProps {
  data: TopService[];
  loading?: boolean;
}

export function TopServicesTable({ data, loading = false }: TopServicesTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 h-full">
        <div className="animate-shimmer h-5 w-40 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-shimmer h-12 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Top Consuming Cloud Services</h3>
            <p className="text-xs text-slate-400 mt-0.5">Highest billed FOCUS line items by spend volume</p>
          </div>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Real-time
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {data.map((service, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-400 w-4">#{idx + 1}</span>
                <div>
                  <div className="text-sm font-medium text-slate-800">{service.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                      {service.provider}
                    </Badge>
                    <span className="text-xs text-slate-400">{service.share}% of monthly cloud</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">
                  ${service.spend.toLocaleString()}
                </div>
                <div
                  className={`text-xs font-semibold ${
                    service.changePositive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {service.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
