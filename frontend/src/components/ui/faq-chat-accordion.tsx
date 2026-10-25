"use client";

import * as React from "react";
import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export interface FaqAccordionProps {
  data: FAQItem[];
  className?: string;
  timestamp?: string;
  questionClassName?: string;
  answerClassName?: string;
}

export function FaqAccordion({
  data,
  className,
  timestamp,
  questionClassName,
  answerClassName,
}: FaqAccordionProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(null);

  return (
    <div className={cn("p-1 sm:p-2", className)}>
      {timestamp && (
        <div className="mb-4 text-xs font-mono text-[#64748B]">{timestamp}</div>
      )}

      <Accordion.Root
        type="single"
        collapsible
        value={openItem || ""}
        onValueChange={(value) => setOpenItem(value)}
      >
        {data.map((item) => (
          <Accordion.Item
            value={item.id.toString()}
            key={item.id}
            className="mb-3.5"
          >
            <Accordion.Header>
              <Accordion.Trigger className="flex w-full items-center justify-start gap-x-3 sm:gap-x-4 cursor-pointer group">
                <div
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all text-left shadow-xs border border-[#D6E4F5]/70",
                    openItem === item.id.toString()
                      ? "bg-[#0062E0] text-white font-semibold border-[#0062E0] shadow-sm"
                      : "bg-[#F1F6FD] text-[#0A192F] hover:bg-[#E2EFFD]",
                    questionClassName
                  )}
                >
                  {item.icon && (
                    <span
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        openItem === item.id.toString()
                          ? "bg-white/20 text-white"
                          : "bg-[#EBF3FE] text-[#0062E0]"
                      )}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="font-medium text-[15px] sm:text-[16px] leading-snug">
                    {item.question}
                  </span>
                </div>

                <span
                  className={cn(
                    "text-[#64748B] transition-colors p-1.5 rounded-full hover:bg-[#E2EFFD] shrink-0",
                    openItem === item.id.toString() && "text-[#0062E0]"
                  )}
                >
                  {openItem === item.id.toString() ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content asChild forceMount>
              <motion.div
                initial="collapsed"
                animate={openItem === item.id.toString() ? "open" : "collapsed"}
                variants={{
                  open: { opacity: 1, height: "auto" },
                  collapsed: { opacity: 0, height: 0 },
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="ml-3 sm:ml-6 mt-2 mb-2">
                  <div
                    className={cn(
                      "relative max-w-xl rounded-2xl bg-[#0A192F] px-5 py-3.5 text-white text-[14px] sm:text-[15px] leading-relaxed shadow-md border border-[#1E2E4A]",
                      answerClassName
                    )}
                  >
                    {item.answer}
                  </div>
                </div>
              </motion.div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
