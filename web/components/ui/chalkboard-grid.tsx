'use client';

import { useEffect, useRef } from 'react';

interface ChalkboardGridProps {
  className?: string;
}

export function ChalkboardGrid({ className }: ChalkboardGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const drawGrid = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Grid settings
      const gridSize = 40; // Size of each square
      const lineColor = 'rgba(180, 180, 180, 0.25)'; // Light gray with transparency (chalk-like)
      const lineWidth = 1;

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;

      // Draw vertical lines
      for (let x = 0; x <= rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y <= rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }
    };

    resizeCanvas();
    drawGrid();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      drawGrid();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

