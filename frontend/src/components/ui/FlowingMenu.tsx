'use client';

import * as React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

export interface FlowingMenuItem {
  text?: string;
  keyword?: string;
  subtitle?: string;
  category?: string;
  baseline?: string;
  standard?: string;
  output?: string;
  link?: string;
  image?: string;
  marquee?: string;
  meta?: string;
}

export interface FlowingMenuProps {
  items?: FlowingMenuItem[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function FlowingMenu({
  items = [],
  textColor = '#ffffff',
  bgColor = '#0D111A',
  borderColor = 'rgba(255, 255, 255, 0.10)',
  className = '',
  style
}: FlowingMenuProps) {
  // hoveredIndex: null in idle state so all 3 keywords are displayed cleanly
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div
      className={`relative w-full h-full rounded-[24px] overflow-hidden select-none flex flex-col border transition-all duration-300 ${className}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor,
        ...style
      }}
      onMouseLeave={() => setHoveredIndex(null)}
      role="region"
      aria-label="FinOps Optimization Verification Flow"
    >
      {/* Rows Container */}
      <div className="relative z-10 w-full h-full flex flex-col divide-y divide-white/10">
        {items.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const keyword = item.keyword || item.text || `Item ${index + 1}`;
          const subtitle = item.subtitle || item.meta || `${item.standard ?? 'Standard'} • ${item.output ?? 'Output'}`;
          const category = item.category || item.text || keyword;
          const baseline = item.baseline || 'Historical 90-Day Baseline';
          const standard = item.standard || 'FOCUS 1.0 Standard';
          const output = item.output || 'Realized Spend Delta';

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={(e) => {
                e.preventDefault();
                setHoveredIndex(isHovered ? null : index);
              }}
              className={`relative cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-center px-6 sm:px-8 ${
                isHovered
                  ? 'flex-[2.6] bg-[#F8FAFC] border-y border-[#1d1e1fff] shadow-lg text-[#0A192F]'
                  : hoveredIndex !== null
                  ? 'flex-[0.7] bg-transparent hover:bg-white/[0.02] border-[#1d1e1fff] text-white'
                  : 'flex-1 bg-transparent hover:bg-white/[0.02] text-white'
              }`}
            >
              <div className="relative z-10 w-full">
                {/* IDLE / COMPACT STATE: Keyword on left and subtitle on right */}
                {!isHovered ? (
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="text-[22px] sm:text-[28px] font-bold text-white tracking-[-0.02em] transition-colors duration-200">
                      {keyword}
                    </span>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[12px] sm:text-[13px] font-mono text-white/70 tracking-wide font-normal">
                        {subtitle}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/40 transition-transform duration-200" />
                    </div>
                  </div>
                ) : (
                  /* EXPANDED HOVER STATE: Off-white theme revealing all 4 columns */
                  <div className="py-2.5 space-y-3 animate-fadeIn">
                    {/* Top Row: Clean Keyword and Subtitle in dark typography */}
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[22px] sm:text-[26px] font-extrabold text-[#0A192F] tracking-[-0.025em]">
                        {keyword}
                      </h3>

                      <span className="text-[12px] sm:text-[13px] font-mono text-[#64748B] tracking-wide font-medium">
                        {subtitle}
                      </span>
                    </div>

                    {/* 4-Column Data Grid: OPTIMIZATION CATEGORY | BASELINE MODELING | STANDARD | VERIFICATION OUTPUT */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-2.5 border-t border-[#E2E8F0]">
                      {/* Column 1: OPTIMIZATION CATEGORY */}
                      <div className="space-y-0.5">
                        <div className="text-[9px] sm:text-[10px] font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                          Optimization Category
                        </div>
                        <div className="text-[12px] sm:text-[13px] font-bold text-[#0A192F] leading-tight">
                          {category}
                        </div>
                      </div>

                      {/* Column 2: BASELINE MODELING */}
                      <div className="space-y-0.5">
                        <div className="text-[9px] sm:text-[10px] font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                          Baseline Modeling
                        </div>
                        <div className="text-[12px] sm:text-[13px] font-medium text-[#334155] leading-tight">
                          {baseline}
                        </div>
                      </div>

                      {/* Column 3: STANDARD */}
                      <div className="space-y-0.5">
                        <div className="text-[9px] sm:text-[10px] font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                          Standard
                        </div>
                        <div className="text-[12px] sm:text-[13px] font-mono font-bold text-[#0062E0] leading-tight">
                          {standard}
                        </div>
                      </div>

                      {/* Column 4: VERIFICATION OUTPUT */}
                      <div className="space-y-0.5">
                        <div className="text-[9px] sm:text-[10px] font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                          Verification Output
                        </div>
                        <div className="text-[12px] sm:text-[13px] font-bold text-[#059669] flex items-center gap-1.5 leading-tight">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                          {output}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FlowingMenu;
