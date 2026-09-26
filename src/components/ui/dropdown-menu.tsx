"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { asChild?: boolean }) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    context.setOpen((prev) => !prev);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      "aria-expanded": context.open,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  align = "end",
  side = "bottom",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end" | "center";
  side?: "top" | "bottom" | "left" | "right";
}) {
  const context = React.useContext(DropdownMenuContext);
  if (!context?.open) return null;

  const alignStyles = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  const sideStyles = {
    bottom: "top-full mt-2",
    top: "bottom-full mb-2",
    left: "right-full mr-2 top-0",
    right: "left-full ml-2 top-0",
  };

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-1 text-slate-800 dark:text-slate-200 shadow-xl backdrop-blur-md animate-enter-modal",
        alignStyles[align] || alignStyles.end,
        sideStyles[side] || sideStyles.bottom,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  variant,
  asChild,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
  asChild?: boolean;
}) {
  const context = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    context?.setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800",
        variant === "destructive" && "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuGroup({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-0.5", className)}>{children}</div>;
}

export function DropdownMenuLabel({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400", className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-slate-200 dark:bg-white/10", className)} />;
}

interface RadioGroupContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
}) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange: onValueChange || (() => {}) }}>
      <div className="space-y-0.5">{children}</div>
    </RadioGroupContext.Provider>
  );
}

export function DropdownMenuRadioItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const menuContext = React.useContext(DropdownMenuContext);
  const groupContext = React.useContext(RadioGroupContext);
  const isChecked = groupContext?.value === value;

  const handleClick = () => {
    groupContext?.onValueChange(value);
    menuContext?.setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
        isChecked
          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
          : "text-slate-600 dark:text-slate-400",
        className
      )}
    >
      {children}
    </div>
  );
}
