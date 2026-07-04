import { useEffect, useRef } from "react";

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // px
  enabled?: boolean;
}

/**
 * Detects horizontal swipe gestures on the attached element.
 * Used for swipe-left to delete / swipe-right to star in the chat sidebar.
 */
export function useSwipe<T extends HTMLElement>(
  options: UseSwipeOptions
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    if (options.enabled === false) return;
    const el = ref.current;
    if (!el) return;
    const threshold = options.threshold ?? 80;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      startX.current = t.clientX;
      startY.current = t.clientY;
      startTime.current = Date.now();
    };

    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const dt = Date.now() - startTime.current;
      // Only count as swipe if:
      // 1. Horizontal motion dominates
      // 2. Distance exceeds threshold
      // 3. Quick (< 500ms)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold && dt < 500) {
        if (dx < 0) options.onSwipeLeft?.();
        else options.onSwipeRight?.();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [options, options.enabled]);

  return ref;
}