import React, { useEffect, useRef, useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
} from '@floating-ui/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TourStep } from '@/types/tour';

interface TooltipCardProps {
  step: TourStep;
  targetElement: HTMLElement;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const TooltipCard: React.FC<TooltipCardProps> = ({
  step,
  targetElement,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}) => {
  const arrowRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const { refs, floatingStyles, middlewareData } = useFloating({
    placement: step.placement === 'auto' ? 'bottom' : step.placement,
    middleware: [
      offset(12),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(targetElement);
    setMounted(true);
  }, [targetElement, refs]);

  if (!mounted) return null;

  const arrowX = middlewareData.arrow?.x ?? 0;
  const arrowY = middlewareData.arrow?.y ?? 0;
  const side = step.placement === 'auto' ? 'bottom' : step.placement;

  const arrowStyles: React.CSSProperties = {
    left: arrowX ? `${arrowX}px` : '',
    top: arrowY ? `${arrowY}px` : '',
  };

  // Position arrow based on placement
  if (side === 'bottom') {
    arrowStyles.top = '-6px';
    arrowStyles.borderBottom = 'none';
    arrowStyles.borderRight = 'none';
  } else if (side === 'top') {
    arrowStyles.bottom = '-6px';
    arrowStyles.borderTop = 'none';
    arrowStyles.borderLeft = 'none';
  } else if (side === 'left') {
    arrowStyles.right = '-6px';
    arrowStyles.borderLeft = 'none';
    arrowStyles.borderBottom = 'none';
  } else if (side === 'right') {
    arrowStyles.left = '-6px';
    arrowStyles.borderRight = 'none';
    arrowStyles.borderTop = 'none';
  }

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="tourlayer-card"
    >
      <div
        ref={arrowRef}
        className="tourlayer-card-arrow"
        style={arrowStyles}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          {step.title}
        </h3>
        <button
          onClick={onClose}
          className="tourlayer-btn-ghost"
          style={{ padding: '4px', marginTop: '-4px', marginRight: '-4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Image */}
      {step.imageUrl && (
        <div style={{ marginBottom: '12px' }}>
          <img
            src={step.imageUrl}
            alt={step.title}
            style={{
              width: '100%',
              borderRadius: '6px',
              maxHeight: '200px',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', marginBottom: '16px' }}>
        {step.content}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          {currentStep + 1} of {totalSteps}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {currentStep > 0 && (
            <button
              onClick={onPrev}
              className="tourlayer-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          {currentStep < totalSteps - 1 ? (
            <button
              onClick={onNext}
              className="tourlayer-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {step.buttonText || 'Next'}
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="tourlayer-btn-primary"
            >
              {step.buttonText || 'Done'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

