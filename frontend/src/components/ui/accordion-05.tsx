"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Accordion05Item {
  id: string;
  title: string;
  content: string;
}

const defaultItems: Accordion05Item[] = [
  {
    id: "1",
    title: "Who am I?",
    content:
      "I’m Ali Imam — a designer and creative developer focused on building digital experiences that are minimal, meaningful, and timeless.",
  },
  {
    id: "2",
    title: "What do I design?",
    content:
      "I create clean, functional interfaces, brand systems, and digital products. My work blends simplicity with clarity and usability.",
  },
  {
    id: "3",
    title: "My design approach",
    content:
      "For me, design isn’t just visuals — it’s how something feels and works. I focus on clarity, detail, and storytelling in every project.",
  },
  {
    id: "4",
    title: "Beyond design",
    content:
      "I bridge design and development, turning ideas into interactive experiences with modern tools and technology.",
  },
  {
    id: "5",
    title: "What inspires me",
    content:
      "Minimalism, architecture, and everyday details. I believe great design is found in the small things we often overlook.",
  },
  {
    id: "6",
    title: "Who I work with",
    content:
      "I collaborate with startups, brands, and individuals who value thoughtful design and want to create lasting impact.",
  },
  {
    id: "7",
    title: "My toolkit",
    content:
      "Figma, Next.js, and modern frameworks are part of my process — but for me, tools always serve the idea, not the other way around.",
  },
  {
    id: "8",
    title: "Let’s connect",
    content:
      "You can reach me through contact@aliimam.in or on social platforms. I’m always open to new projects, collaborations, and conversations.",
  },
];

interface Accordion05Props {
  items?: Accordion05Item[];
  defaultValue?: string;
  className?: string;
}

export function Accordion05({
  items = defaultItems,
  defaultValue = "5",
  className,
}: Accordion05Props) {
  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <Accordion type="single" defaultValue={defaultValue} collapsible className="w-full">
        {items.map((item) => (
          <AccordionItem
            value={item.id}
            key={item.id}
            className="border-b border-[#D6E4F5] last:border-b py-0.5"
          >
            <AccordionTrigger className="text-left pl-1 sm:pl-3 md:pl-4 overflow-hidden text-[#0A192F]/25 hover:text-[#0A192F]/60 duration-200 hover:no-underline cursor-pointer -space-y-2 data-[state=open]:space-y-0 data-[state=open]:text-[#0A192F] [&>svg]:hidden py-3 sm:py-4">
              <div className="flex flex-1 items-start gap-3 sm:gap-4">
                <span className="text-xs font-mono pt-1 text-[#64748B] shrink-0 font-medium">
                  {item.id}
                </span>
                <h3 className="uppercase relative text-left text-lg sm:text-2xl md:text-[28px] font-bold tracking-tight transition-colors leading-tight">
                  {item.title}
                </h3>
              </div>
            </AccordionTrigger>

            <AccordionContent className="text-[#475569] text-[14px] sm:text-[15px] leading-relaxed pb-4 pl-6 sm:pl-9 md:pl-10 pr-2 sm:pr-4">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
