"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarContextType {
  state: "expanded" | "collapsed"
  toggleSidebar: () => void
  isMobile: boolean
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    return {
      state: "expanded" as const,
      toggleSidebar: () => {},
      isMobile: false,
      openMobile: false,
      setOpenMobile: () => {},
    }
  }
  return context
}

export function SidebarProvider({
  defaultOpen = true,
  className,
  style,
  children,
}: {
  defaultOpen?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev)
    } else {
      setOpen((prev) => !prev)
    }
  }, [isMobile])

  const state = open ? "expanded" : "collapsed"

  return (
    <SidebarContext.Provider
      value={{
        state,
        toggleSidebar,
        isMobile,
        openMobile,
        setOpenMobile,
      }}
    >
      <div
        style={style}
        className={cn("flex min-h-screen w-full bg-background text-foreground", className)}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  collapsible = "icon",
  className,
  children,
}: {
  collapsible?: "icon" | "none"
  className?: string
  children: React.ReactNode
}) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && collapsible === "icon"

  if (isMobile) {
    return (
      <>
        {openMobile && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setOpenMobile(false)}
          />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
            openMobile ? "translate-x-0" : "-translate-x-full",
            className
          )}
        >
          {children}
        </aside>
      </>
    )
  }

  return (
    <aside
      data-collapsible={isCollapsed ? "icon" : undefined}
      className={cn(
        "group relative flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out shrink-0",
        isCollapsed ? "w-[var(--sidebar-width-icon,4.25rem)]" : "w-[var(--sidebar-width,18.125rem)]",
        className
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col p-4", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-1 flex-col overflow-y-auto", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col p-4", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col p-2", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarGroupLabel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarGroupContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarMenu({ className, children, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("flex flex-col gap-1 list-none m-0 p-0", className)} {...props}>
      {children}
    </ul>
  )
}

export function SidebarMenuItem({ className, children, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li className={cn("relative", className)} {...props}>
      {children}
    </li>
  )
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  className,
  children,
  ...props
}: {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
  className?: string
  children: React.ReactNode
  [key: string]: any
}) {
  const baseClasses = cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer select-none",
    isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
    className
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(baseClasses, children.props.className),
      title: tooltip,
      ...props,
    })
  }

  return (
    <button type="button" title={tooltip} className={baseClasses} {...props}>
      {children}
    </button>
  )
}

export function SidebarMenuBadge({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[10px] font-bold",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn("inline-flex items-center justify-center rounded-lg p-2 hover:bg-sidebar-accent", className)}
      aria-label="Toggle Sidebar"
      {...props}
    >
      <svg
        className="size-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}
