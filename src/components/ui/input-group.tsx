"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const InputGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 px-3 py-1.5 focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InputGroup.displayName = "InputGroup";

export const InputGroupAddon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center text-slate-400 dark:text-slate-500 mr-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InputGroupAddon.displayName = "InputGroupAddon";

export const InputGroupInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500",
          className
        )}
        {...props}
      />
    );
  }
);
InputGroupInput.displayName = "InputGroupInput";
