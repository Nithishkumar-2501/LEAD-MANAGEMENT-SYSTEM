"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={menuRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
  ...props
}: {
  asChild?: boolean
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const ctx = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    ctx?.setOpen((prev) => !prev)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        children.props.onClick?.(e)
        handleClick(e)
      },
      "aria-expanded": ctx?.open,
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={ctx?.open}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  align = "end",
  side = "bottom",
  className,
  children,
  ...props
}: {
  align?: "start" | "end" | "center"
  side?: "top" | "bottom" | "left" | "right"
  className?: string
  children: React.ReactNode
  [key: string]: any
}) {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx?.open) return null

  const alignStyles =
    align === "start"
      ? "left-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "right-0"

  const sideStyles = side === "top" ? "bottom-full mb-2" : "top-full mt-2"

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[10rem] overflow-hidden rounded-xl border border-white/20 bg-popover/95 backdrop-blur-xl p-1 text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95",
        alignStyles,
        sideStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  variant,
  asChild,
  className,
  children,
  onClick,
  ...props
}: {
  variant?: "default" | "destructive"
  asChild?: boolean
  className?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  [key: string]: any
}) {
  const ctx = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e)
    ctx?.setOpen(false)
  }

  const baseStyles = cn(
    "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    variant === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
    className
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(baseStyles, children.props.className),
      onClick: (e: React.MouseEvent) => {
        children.props.onClick?.(e)
        handleClick(e)
      },
    })
  }

  return (
    <div className={baseStyles} onClick={handleClick} {...props}>
      {children}
    </div>
  )
}

export function DropdownMenuGroup({
  className,
  children,
  ...props
}: {
  className?: string
  children: React.ReactNode
  [key: string]: any
}) {
  return (
    <div className={cn("p-1 space-y-0.5", className)} {...props}>
      {children}
    </div>
  )
}

export function DropdownMenuLabel({
  className,
  children,
  ...props
}: {
  className?: string
  children: React.ReactNode
  [key: string]: any
}) {
  return (
    <div className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: {
  className?: string
  [key: string]: any
}) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-border/40", className)} {...props} />
  )
}

interface RadioGroupContextType {
  value: string
  onValueChange?: (val: string) => void
}
const RadioGroupContext = React.createContext<RadioGroupContextType | null>(null)

export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string
  onValueChange?: (val: string) => void
  children: React.ReactNode
}) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className="space-y-0.5">{children}</div>
    </RadioGroupContext.Provider>
  )
}

export function DropdownMenuRadioItem({
  value,
  className,
  children,
  ...props
}: {
  value: string
  className?: string
  children: React.ReactNode
  [key: string]: any
}) {
  const ctx = React.useContext(DropdownMenuContext)
  const radioCtx = React.useContext(RadioGroupContext)
  const isChecked = radioCtx?.value === value

  const handleClick = () => {
    radioCtx?.onValueChange?.(value)
    ctx?.setOpen(false)
  }

  return (
    <div
      onClick={handleClick}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        isChecked && "bg-accent/60 font-bold text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      {isChecked && <span className="text-primary font-black ml-2">✓</span>}
    </div>
  )
}
