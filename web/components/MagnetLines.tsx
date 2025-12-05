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
    let rafId: number | null = null;
    let lastPointer = { x: 0, y: 0 };
    let needsUpdate = false;

    const updateLines = () => {
      if (!needsUpdate) return;
      
      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;

        const b = lastPointer.x - centerX;
        const a = lastPointer.y - centerY;
        const c = Math.sqrt(a * a + b * b) || 1;
        const r = ((Math.acos(b / c) * 180) / Math.PI) * (lastPointer.y > centerY ? 1 : -1);

        (item as HTMLElement).style.setProperty('--rotate', `${r}deg`);
      });
      
      needsUpdate = false;
      rafId = null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      lastPointer = { x: e.clientX, y: e.clientY };
      
      if (!needsUpdate) {
        needsUpdate = true;
        rafId = requestAnimationFrame(updateLines);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    if (items.length) {
      const middleIndex = Math.floor(items.length / 2);
      const rect = items[middleIndex].getBoundingClientRect();
      lastPointer = { x: rect.x, y: rect.y };
      updateLines();
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

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

