'use client';

import { useEffect, useRef } from 'react';

interface MagnetLinesProps {
  className?: string;
  lineColor?: string;
  lineWidth?: number;
  numLines?: number;
}

export function MagnetLines({ 
  className, 
  lineColor = '#e0e0e0',
  lineWidth = 1,
  numLines = 50 
}: MagnetLinesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const linesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);

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

    const initLines = () => {
      const rect = canvas.getBoundingClientRect();
      linesRef.current = Array.from({ length: numLines }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      const mouse = mouseRef.current;
      const lines = linesRef.current;

      // Update and draw lines
      lines.forEach((line, i) => {
        // Magnetic attraction to mouse
        const dx = mouse.x - line.x;
        const dy = mouse.y - line.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;
        
        if (distance < maxDistance && distance > 0) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          line.vx += Math.cos(angle) * force * 0.3;
          line.vy += Math.sin(angle) * force * 0.3;
        }

        // Damping
        line.vx *= 0.95;
        line.vy *= 0.95;

        // Update position
        line.x += line.vx;
        line.y += line.vy;

        // Bounce off edges
        if (line.x < 0 || line.x > rect.width) line.vx *= -0.8;
        if (line.y < 0 || line.y > rect.height) line.vy *= -0.8;
        line.x = Math.max(0, Math.min(rect.width, line.x));
        line.y = Math.max(0, Math.min(rect.height, line.y));

        // Draw connections to nearby lines
        lines.slice(i + 1).forEach((otherLine) => {
          const dx = otherLine.x - line.x;
          const dy = otherLine.y - line.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxConnectionDistance = 120;

          if (distance < maxConnectionDistance) {
            const opacity = 1 - distance / maxConnectionDistance;
            const alpha = Math.floor(opacity * 200).toString(16).padStart(2, '0');
            ctx.strokeStyle = `${lineColor}${alpha}`;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(otherLine.x, otherLine.y);
            ctx.stroke();
          }
        });

        // Draw line node
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(line.x, line.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initLines();
    canvas.addEventListener('mousemove', handleMouseMove);

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      initLines();
    });

    resizeObserver.observe(canvas);
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
    };
  }, [lineColor, lineWidth, numLines]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

