import { useEffect, useCallback } from 'react';
import { useTourStore } from '@/store/tourStore';
import { generateSelector } from '@/utils/selector';

export function useElementPicker() {
  const {
    mode,
    setHoveredElement,
    setSelectedElement,
  } = useTourStore();

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'picking') return;

      const target = e.target as HTMLElement;

      // Ignore our own extension elements
      if (
        target.closest('.tourlayer-sidebar') ||
        target.closest('.tourlayer-card') ||
        target.closest('.tourlayer-highlight')
      ) {
        setHoveredElement(null);
        return;
      }

      setHoveredElement(target);
    },
    [mode, setHoveredElement]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'picking') return;

      const target = e.target as HTMLElement;

      // Ignore our own extension elements
      if (
        target.closest('.tourlayer-sidebar') ||
        target.closest('.tourlayer-card') ||
        target.closest('.tourlayer-highlight')
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const selector = generateSelector(target);
      const rect = target.getBoundingClientRect();

      setSelectedElement({
        selector,
        element: target,
        rect,
      });

      setHoveredElement(null);
    },
    [mode, setSelectedElement, setHoveredElement]
  );

  useEffect(() => {
    if (mode === 'picking') {
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('click', handleClick, true);

      // Prevent default behavior on all clicks while picking
      document.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        { capture: true }
      );
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, [mode, handleMouseMove, handleClick]);
}

