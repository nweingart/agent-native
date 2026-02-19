import { useRef, useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface VisualMemoryOptions {
  /** Transition duration in ms. Default: 300 */
  duration?: number;
  /** CSS easing function name. Default: 'ease-out' */
  easing?: 'ease-out' | 'ease-in' | 'ease-in-out' | 'linear' | 'spring';
  /** Set false to disable animation entirely. Default: true */
  animate?: boolean;
}

export interface VisualMemoryState<T> {
  /** The current (latest) value. */
  current: T;
  /** The previous value, or null on first render. */
  previous: T | null;
  /** Transition progress from 0 to 1. */
  progress: number;
  /** Whether a transition is currently running. */
  isTransitioning: boolean;
}

const EASING_FNS: Record<string, (t: number) => number> = {
  'ease-out': (t) => 1 - (1 - t) ** 3,
  'ease-in': (t) => t ** 3,
  'ease-in-out': (t) => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
  linear: (t) => t,
  spring: (t) => 1 - Math.cos(t * Math.PI * 0.5),
};

/**
 * Gives a component "visual memory" — tracks value transitions and exposes
 * the previous value alongside an animated progress for smooth state changes.
 */
export function useVisualMemory<T>(
  value: T,
  options: VisualMemoryOptions = {},
): VisualMemoryState<T> {
  const { duration = 300, easing = 'ease-out', animate = true } = options;
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  const [state, setState] = useState<VisualMemoryState<T>>({
    current: value,
    previous: null,
    progress: 1,
    isTransitioning: false,
  });

  const rafRef = useRef<number | null>(null);
  const prevValueRef = useRef<T>(value);

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (value === prevValueRef.current) return;

    const previousValue = prevValueRef.current;
    prevValueRef.current = value;

    if (!shouldAnimate || duration <= 0) {
      setState({
        current: value,
        previous: previousValue,
        progress: 1,
        isTransitioning: false,
      });
      return;
    }

    cancelAnimation();

    const startTime = performance.now();
    const easeFn = EASING_FNS[easing] ?? EASING_FNS['ease-out'];

    setState({
      current: value,
      previous: previousValue,
      progress: 0,
      isTransitioning: true,
    });

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeFn(rawProgress);

      if (rawProgress >= 1) {
        setState({
          current: value,
          previous: previousValue,
          progress: 1,
          isTransitioning: false,
        });
        rafRef.current = null;
      } else {
        setState({
          current: value,
          previous: previousValue,
          progress: easedProgress,
          isTransitioning: true,
        });
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return cancelAnimation;
  }, [value, shouldAnimate, duration, easing, cancelAnimation]);

  useEffect(() => {
    return cancelAnimation;
  }, [cancelAnimation]);

  return state;
}
