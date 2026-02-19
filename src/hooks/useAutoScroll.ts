import { useRef, useEffect, useCallback } from 'react';

export interface AutoScrollOptions {
  /** Enable/disable auto-scroll. Default: true */
  enabled?: boolean;
  /** Behavior for scrollIntoView. Default: 'smooth' */
  behavior?: ScrollBehavior;
  /**
   * How far from the bottom (in px) the user can be while still being
   * considered "at the bottom" for auto-scroll purposes. Default: 50
   */
  threshold?: number;
}

/**
 * Auto-scrolls a container to keep the latest content visible.
 * Pauses when the user scrolls up, resumes when they scroll back down.
 *
 * Returns a ref to attach to the scrollable container.
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
  deps: unknown[],
  options: AutoScrollOptions = {},
) {
  const { enabled = true, behavior = 'smooth', threshold = 50 } = options;
  const containerRef = useRef<T>(null);
  const isLockedRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [behavior]);

  // Track whether user has scrolled away from bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      isLockedRef.current = distanceFromBottom <= threshold;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [enabled, threshold]);

  // Auto-scroll when deps change
  useEffect(() => {
    if (enabled && isLockedRef.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scrollToBottom, ...deps]);

  return containerRef;
}
