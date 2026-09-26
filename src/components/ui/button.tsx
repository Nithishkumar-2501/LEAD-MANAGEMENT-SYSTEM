import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-xs",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
      link: "text-primary underline-offset-4 hover:underline",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-xl px-6 text-base",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
      "icon-sm": "h-7 w-7 rounded-md p-0 flex items-center justify-center text-xs",
      "icon-lg": "h-10 w-10 rounded-lg p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          variantStyles[variant] || variantStyles.default,
          sizeStyles[size] || sizeStyles.default,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
