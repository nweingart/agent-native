import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_event: string, handler: (e: { matches: boolean }) => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn((_event: string, handler: (e: { matches: boolean }) => void) => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
    dispatchEvent: () => false,
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue(mql),
  });

  return {
    mql,
    triggerChange(newMatches: boolean) {
      mql.matches = newMatches;
      for (const listener of listeners) {
        listener({ matches: newMatches });
      }
    },
  };
}

describe('useReducedMotion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when prefers-reduced-motion is not set', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when preference changes', () => {
    const { triggerChange } = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => triggerChange(true));
    expect(result.current).toBe(true);

    act(() => triggerChange(false));
    expect(result.current).toBe(false);
  });

  it('cleans up event listener on unmount', () => {
    const { mql } = mockMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());

    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
