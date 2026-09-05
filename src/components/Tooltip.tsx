"use client";

import React from "react";

interface TooltipProps {
  text?: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

export default Tooltip;

