"use client";

import React from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ text, children, position = "top" }: TooltipProps) {
  const positionClasses = {
    top: "bottom-full mb-2.5 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2.5 left-1/2 -translate-x-1/2",
    left: "right-full mr-2.5 top-1/2 -translate-y-1/2",
    right: "left-full ml-2.5 top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    top: "w-2.5 h-2.5 -mt-1.5 mx-auto rotate-45 bg-slate-950 border-r border-b border-sky-400/80 shadow-md",
    bottom: "w-2.5 h-2.5 -mb-1.5 -order-1 mx-auto rotate-45 bg-slate-950 border-l border-t border-sky-400/80 shadow-md",
    left: "w-2.5 h-2.5 -mr-1.5 -order-1 my-auto rotate-45 bg-slate-950 border-t border-r border-sky-400/80 shadow-md",
    right: "w-2.5 h-2.5 -ml-1.5 my-auto rotate-45 bg-slate-950 border-b border-l border-sky-400/80 shadow-md",
  };

  const transformAnimation = {
    top: "group-hover/tooltip:-translate-y-1",
    bottom: "group-hover/tooltip:translate-y-1",
    left: "group-hover/tooltip:-translate-x-1",
    right: "group-hover/tooltip:translate-x-1",
  };

  return (
    <div className="group/tooltip relative inline-flex items-center justify-center">
      {children}
      <div
        className={`absolute pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 ease-out scale-90 group-hover/tooltip:scale-100 z-[9999] whitespace-nowrap transform ${transformAnimation[position]} ${positionClasses[position]}`}
      >
        <div className="bg-slate-950/95 text-white text-xs font-black px-3 py-1.5 rounded-xl border border-sky-400/80 shadow-2xl shadow-sky-500/40 backdrop-blur-2xl flex items-center gap-2 ring-1 ring-white/30">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0 shadow-sm shadow-sky-400" />
          <span className="tracking-wide text-sky-100">{text}</span>
        </div>
        <div className={arrowClasses[position]} />
      </div>
    </div>
  );
}

export default Tooltip;
