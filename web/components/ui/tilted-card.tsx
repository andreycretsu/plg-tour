'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';

interface TiltedCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
}

export function TiltedCard({ 
  children, 
  className = '',
  maxTilt = 15,
  perspective = 1000,
  scale = 1.05
}: TiltedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;
      
      setTransform(`
        perspective(${perspective}px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale(${scale})
      `);
    };

    const handleMouseLeave = () => {
      setTransform(`
        perspective(${perspective}px)
        rotateX(0deg)
        rotateY(0deg)
        scale(1)
      `);
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt, perspective, scale]);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out',
        transform: transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      }}
    >
      {children}
    </div>
  );
}

