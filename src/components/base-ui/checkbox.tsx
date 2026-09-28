"use client"

import * as React from "react"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    const isIndeterminate = checked === "indeterminate" || props["aria-checked"] === "mixed"
    const isChecked = checked === true

    return (
      <button
        type="button"
        role="checkbox"
        ref={ref}
        aria-checked={isIndeterminate ? "mixed" : isChecked}
        data-state={isIndeterminate ? "indeterminate" : isChecked ? "checked" : "unchecked"}
        data-checked={isChecked || isIndeterminate ? "" : undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          onCheckedChange?.(!isChecked)
        }}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-[4px] border border-slate-300 dark:border-slate-600 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center cursor-pointer",
          isChecked || isIndeterminate
            ? "bg-sky-600 border-sky-600 text-white dark:bg-sky-500 dark:border-sky-500"
            : "bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500",
          className
        )}
        {...props}
      >
        {isIndeterminate ? (
          <Minus className="h-3 w-3 stroke-[3]" />
        ) : isChecked ? (
          <Check className="h-3 w-3 stroke-[3]" />
        ) : null}
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"
