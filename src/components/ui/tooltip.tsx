"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <>{children}</>
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild }) => {
  if (asChild) {
    return <>{children}</>
  }
  return <div>{children}</div>
}

interface TooltipContentProps {
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

const TooltipContent: React.FC<TooltipContentProps> = ({ 
  children, 
  side = "top",
  className 
}) => {
  return (
    <div
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 shadow-md",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } 