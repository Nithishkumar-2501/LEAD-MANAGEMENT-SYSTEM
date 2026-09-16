import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-sm transition-all focus-within:ring-2 focus-within:ring-primary/20",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
InputGroup.displayName = "InputGroup"

export interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center text-muted-foreground shrink-0", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
InputGroupAddon.displayName = "InputGroupAddon"

export interface InputGroupInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex-1 bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none border-none",
          className
        )}
        {...props}
      />
    )
  }
)
InputGroupInput.displayName = "InputGroupInput"
