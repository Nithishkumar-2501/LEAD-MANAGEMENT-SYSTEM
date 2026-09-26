"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PanelLeft } from "lucide-react";

interface SidebarContextValue {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    return {
      state: "expanded" as const,
      open: true,
      setOpen: () => {},
      openMobile: false,
      setOpenMobile: () => {},
      isMobile: false,
      toggleSidebar: () => {},
    };
  }
  return context;
}

export function SidebarProvider({
  defaultOpen = true,
  children,
  className,
  style,
}: {
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  };

  const state = open ? "expanded" : "collapsed";

  return (
    <SidebarContext.Provider
      value={{
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      }}
    >
      <div
        className={cn("flex min-h-screen w-full", className)}
        style={style}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  children,
  className,
  collapsible = "icon",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { collapsible?: "icon" | "offcanvas" | "none" }) {
  const { state } = useSidebar();
  return (
    <aside
      data-collapsible={collapsible}
      data-state={state}
      className={cn(
        "group/sidebar flex flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 transition-all duration-300",
        state === "collapsed" ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center px-4 py-3 border-b border-slate-200 dark:border-white/10", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-3 py-4 space-y-4", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-3 border-t border-slate-200 dark:border-white/10 mt-auto", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroup({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroupLabel({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroupContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-0.5", className)} {...props}>{children}</div>;
}

export function SidebarMenu({ children, className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("space-y-1 list-none p-0 m-0", className)} {...props}>
      {children}
    </ul>
  );
}

export function SidebarMenuItem({ children, className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li className={cn("list-none", className)} {...props}>
      {children}
    </li>
  );
}

export function SidebarMenuButton({
  children,
  className,
  isActive = false,
  asChild = false,
  tooltip,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  isActive?: boolean;
  asChild?: boolean;
  tooltip?: string;
}) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
        isActive
          ? "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        className,
        (children.props as any).className
      ),
    });
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
        isActive
          ? "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarMenuBadge({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
        className
      )}
      {...props}
    >
      <PanelLeft className="h-5 w-5" />
    </button>
  );
}
