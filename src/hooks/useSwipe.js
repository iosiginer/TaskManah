import { useRef, useCallback } from 'react';

/**
 * Hook for detecting horizontal swipe gestures.
 * Returns handlers to attach to a DOM element.
 */
export function useSwipe(onSwipeLeft, { threshold = 80 } = {}) {
  const touchStart = useRef(null);
  const touchDelta = useRef(0);
  const elementRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (touchStart.current === null) return;
    const delta = e.touches[0].clientX - touchStart.current;
    touchDelta.current = delta;
    if (elementRef.current) {
      const translateX = Math.min(0, delta);
      elementRef.current.style.transform = `translateX(${translateX}px)`;
      elementRef.current.style.transition = 'none';
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.style.transition = 'transform 0.3s ease';
      if (touchDelta.current < -threshold) {
        elementRef.current.style.transform = `translateX(-100%)`;
        setTimeout(() => {
          onSwipeLeft?.();
          if (elementRef.current) {
            elementRef.current.style.transform = '';
            elementRef.current.style.transition = '';
          }
        }, 300);
      } else {
        elementRef.current.style.transform = '';
      }
    }
    touchStart.current = null;
    touchDelta.current = 0;
  }, [onSwipeLeft, threshold]);

  return { elementRef, onTouchStart, onTouchMove, onTouchEnd };
}
