"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DotPatternProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid cell size in pixels */
  cellSize?: number
  /** Dot radius in pixels */
  dotRadius?: number
  /** Pattern color (hex format without #) */
  color?: string
  /** Grid line opacity (0-1) */
  lineOpacity?: number
  /** Dot opacity (0-1) */
  dotOpacity?: number
  /** Overall pattern opacity (0-1) */
  opacity?: number
  /** Background position offset X in pixels */
  offsetX?: number
  /** Background position offset Y in pixels */
  offsetY?: number
}

const DotPattern = React.forwardRef<HTMLDivElement, DotPatternProps>(
  (
    {
      className,
      cellSize = 30,
      dotRadius = 1.5,
      color = "059669", // emerald-600
      lineOpacity = 0.12,
      dotOpacity = 0.25,
      opacity = 0.7,
      offsetX = 15,
      offsetY = 15,
      ...props
    },
    ref
  ) => {
    const patternUrl = React.useMemo(() => {
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${cellSize}' height='${cellSize}' viewBox='0 0 ${cellSize} ${cellSize}'%3E%3Cg fill='none' stroke='%23${color}' stroke-width='0.4' opacity='${lineOpacity}'%3E%3Crect width='${cellSize}' height='${cellSize}' x='0' y='0'/%3E%3C/g%3E%3Ccircle cx='0' cy='0' r='${dotRadius}' fill='%23${color}' opacity='${dotOpacity}'/%3E%3Ccircle cx='${cellSize}' cy='0' r='${dotRadius}' fill='%23${color}' opacity='${dotOpacity}'/%3E%3Ccircle cx='0' cy='${cellSize}' r='${dotRadius}' fill='%23${color}' opacity='${dotOpacity}'/%3E%3Ccircle cx='${cellSize}' cy='${cellSize}' r='${dotRadius}' fill='%23${color}' opacity='${dotOpacity}'/%3E%3C/svg%3E")`
    }, [cellSize, dotRadius, color, lineOpacity, dotOpacity])

    return (
      <div
        ref={ref}
        className={cn("absolute inset-0 pointer-events-none", className)}
        style={{
          backgroundImage: patternUrl,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
          opacity,
        }}
        aria-hidden="true"
        {...props}
      />
    )
  }
)

DotPattern.displayName = "DotPattern"

export { DotPattern }

