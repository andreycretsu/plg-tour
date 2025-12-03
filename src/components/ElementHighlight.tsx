import React, { useEffect, useState } from 'react';

interface ElementHighlightProps {
  element: HTMLElement | null;
  label?: string;
}

export const ElementHighlight: React.FC<ElementHighlightProps> = ({
  element,
  label = 'Click to select',
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!element) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      setRect(element.getBoundingClientRect());
    };

    updateRect();

    // Update on scroll or resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [element]);

  if (!rect) return null;

  return (
    <>
      <div
        className="tourlayer-highlight"
        style={{
          left: `${rect.left + window.scrollX}px`,
          top: `${rect.top + window.scrollY}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }}
      >
        <div className="tourlayer-highlight-label">{label}</div>
      </div>
    </>
  );
};

