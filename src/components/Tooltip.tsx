"use client";

import React from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ text, children, position = "top" }: TooltipProps) {
  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    top: "w-2 h-2 -mt-1 mx-auto rotate-45 bg-slate-900 border-r border-b border-sky-400/40",
    bottom: "w-2 h-2 -mb-1 -order-1 mx-auto rotate-45 bg-slate-900 border-l border-t border-sky-400/40",
    left: "w-2 h-2 -mr-1 -order-1 my-auto rotate-45 bg-slate-900 border-t border-r border-sky-400/40",
    right: "w-2 h-2 -ml-1 my-auto rotate-45 bg-slate-900 border-b border-l border-sky-400/40",
  };

  return (
    <div className="group relative inline-flex items-center justify-center">
      {children}
      <div
        className={`absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out scale-95 group-hover:scale-100 z-50 whitespace-nowrap ${positionClasses[position]}`}
      >
        <div className="bg-slate-900/95 text-sky-200 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-sky-400/40 shadow-2xl backdrop-blur-xl flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
          <span>{text}</span>
        </div>
        <div className={arrowClasses[position]} />
      </div>
    </div>
  );
}

export default Tooltip;
