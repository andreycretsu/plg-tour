"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface RippleGridProps {
  className?: string
  gridColor?: string
  rippleIntensity?: number
  gridSize?: number
  gridThickness?: number
  fadeDistance?: number
  vignetteStrength?: number
  glowIntensity?: number
  opacity?: number
  gridRotation?: number
  mouseInteractionRadius?: number
  mouseInteraction?: boolean
  enableRainbow?: boolean
}

export function RippleGrid({
  className,
  gridColor = "#8b5cf6",
  rippleIntensity = 0.14,
  gridSize = 21,
  gridThickness = 50,
  fadeDistance = 1.5,
  vignetteStrength = 2,
  glowIntensity = 0,
  opacity = 0.7,
  gridRotation = 0,
  mouseInteractionRadius = 1.2,
  mouseInteraction = true,
  enableRainbow = false,
}: RippleGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()
  const ripplesRef = useRef<Array<{ x: number; y: number; time: number }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mouseRef.current = { x, y }
      
      // Add ripple on mouse move
      ripplesRef.current.push({ x, y, time: Date.now() })
      if (ripplesRef.current.length > 5) {
        ripplesRef.current.shift()
      }
    }

    if (mouseInteraction) {
      container.addEventListener("mousemove", handleMouseMove)
    }

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      
      // Apply rotation
      if (gridRotation !== 0) {
        ctx.translate(width / 2, height / 2)
        ctx.rotate((gridRotation * Math.PI) / 180)
        ctx.translate(-width / 2, -height / 2)
      }

      // Draw grid
      const spacing = gridSize
      const lineWidth = (gridThickness / 100) * 2
      
      ctx.strokeStyle = gridColor
      ctx.lineWidth = lineWidth
      ctx.globalAlpha = opacity

      const offsetX = (width % spacing) / 2
      const offsetY = (height % spacing) / 2

      // Vertical lines
      for (let x = offsetX; x < width; x += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = offsetY; y < height; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Ripple effects
      if (mouseInteraction) {
        const currentTime = Date.now()
        ripplesRef.current = ripplesRef.current.filter((ripple) => {
          const age = (currentTime - ripple.time) / 1000
          return age < fadeDistance * 2
        })

        ripplesRef.current.forEach((ripple, index) => {
          const age = (currentTime - ripple.time) / 1000
          const progress = age / (fadeDistance * 2)
          
          if (progress < 1) {
            const radius = progress * mouseInteractionRadius * 200
            const alpha = rippleIntensity * (1 - progress)
            
            const gradient = ctx.createRadialGradient(
              ripple.x,
              ripple.y,
              0,
              ripple.x,
              ripple.y,
              radius
            )

            if (enableRainbow) {
              const hue = ((currentTime * 0.05 + index * 60) % 360)
              gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, ${alpha})`)
              gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 70%, 60%, ${alpha * 0.5})`)
              gradient.addColorStop(1, "transparent")
            } else {
              const color = gridColor
              const r = parseInt(color.slice(1, 3), 16)
              const g = parseInt(color.slice(3, 5), 16)
              const b = parseInt(color.slice(5, 7), 16)
              gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`)
              gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`)
              gradient.addColorStop(1, "transparent")
            }

            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, width, height)
          }
        })

      }

      // Vignette
      if (vignetteStrength > 0) {
        const vignette = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.max(width, height) / 2
        )
        vignette.addColorStop(0, "transparent")
        vignette.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength / 10})`)
        ctx.fillStyle = vignette
        ctx.fillRect(0, 0, width, height)
      }

      // Glow
      if (glowIntensity > 0 && mouseInteraction && mouseRef.current) {
        const { x, y } = mouseRef.current
        ctx.shadowBlur = glowIntensity * 20
        ctx.shadowColor = gridColor
        ctx.fillStyle = gridColor
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      ctx.restore()
      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (mouseInteraction) {
        container.removeEventListener("mousemove", handleMouseMove)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    gridColor,
    rippleIntensity,
    gridSize,
    gridThickness,
    fadeDistance,
    vignetteStrength,
    glowIntensity,
    opacity,
    gridRotation,
    mouseInteractionRadius,
    mouseInteraction,
    enableRainbow,
  ])

  return (
    <div ref={containerRef} className={cn("absolute inset-0 overflow-hidden bg-background", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
    </div>
  )
}

