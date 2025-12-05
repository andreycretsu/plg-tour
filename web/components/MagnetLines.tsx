'use client';

import { useRef, useEffect } from 'react';
import './MagnetLines.css';

interface MagnetLinesProps {
  rows?: number;
  columns?: number;
  containerSize?: string;
  lineColor?: string;
  lineWidth?: string;
  lineHeight?: string;
  baseAngle?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function MagnetLines({
  rows = 9,
  columns = 9,
  containerSize = '80vmin',
  lineColor = '#d0d0d0',
  lineWidth = '1vmin',
  lineHeight = '6vmin',
  baseAngle = -10,
  className = '',
  style = {}
}: MagnetLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('span');
    if (items.length === 0) return;

    // Pre-calculate positions once
    const itemPositions: Array<{ centerX: number; centerY: number; element: HTMLElement }> = [];
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      itemPositions.push({
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        element: item as HTMLElement
      });
    });

    let rafId: number | null = null;
    let lastPointer = { x: 0, y: 0 };
    let isUpdating = false;

    const updateLines = () => {
      isUpdating = true;
      
      itemPositions.forEach(({ centerX, centerY, element }) => {
        const b = lastPointer.x - centerX;
        const a = lastPointer.y - centerY;
        const c = Math.sqrt(a * a + b * b) || 1;
        const r = ((Math.acos(b / c) * 180) / Math.PI) * (lastPointer.y > centerY ? 1 : -1);
        element.style.setProperty('--rotate', `${r}deg`);
      });
      
      isUpdating = false;
      rafId = null;
    };

    let throttleTimeout: NodeJS.Timeout | null = null;
    const handlePointerMove = (e: PointerEvent) => {
      lastPointer = { x: e.clientX, y: e.clientY };
      
      // Throttle updates to max 30fps for better performance
      if (!isUpdating && rafId === null) {
        if (throttleTimeout) {
          clearTimeout(throttleTimeout);
        }
        throttleTimeout = setTimeout(() => {
          rafId = requestAnimationFrame(updateLines);
        }, 33); // ~30fps
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Initial update
    const containerRect = container.getBoundingClientRect();
    lastPointer = { 
      x: containerRect.left + containerRect.width / 2, 
      y: containerRect.top + containerRect.height / 2 
    };
    updateLines();

    // Recalculate positions on resize
    const resizeObserver = new ResizeObserver(() => {
      itemPositions.length = 0;
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        itemPositions.push({
          centerX: rect.x + rect.width / 2,
          centerY: rect.y + rect.height / 2,
          element: item as HTMLElement
        });
      });
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      resizeObserver.disconnect();
    };
  }, [rows, columns]);

  const total = rows * columns;
  const spans = Array.from({ length: total }, (_, i) => (
    <span
      key={i}
      style={{
        '--rotate': `${baseAngle}deg`,
        backgroundColor: lineColor,
        width: lineWidth,
        height: lineHeight
      } as React.CSSProperties}
    />
  ));

  return (
    <div
      ref={containerRef}
      className={`magnetLines-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        width: containerSize,
        height: containerSize,
        ...style
      }}
    >
      {spans}
    </div>
  );
}

