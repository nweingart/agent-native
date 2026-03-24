import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisualMemory } from './useVisualMemory';

describe('useVisualMemory', () => {
  let rafCallbacks: Array<(time: number) => void>;
  let rafId: number;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    // Mock matchMedia to return reduced motion = false
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: () => false,
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function flushRaf(time: number) {
    const cbs = [...rafCallbacks];
    rafCallbacks = [];
    for (const cb of cbs) {
      cb(time);
    }
  }

  it('initializes with current value and no previous', () => {
    const { result } = renderHook(() => useVisualMemory('a'));
    expect(result.current.current).toBe('a');
    expect(result.current.previous).toBeNull();
    expect(result.current.progress).toBe(1);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('tracks previous value on change', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useVisualMemory(value, { duration: 300 }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });

    expect(result.current.current).toBe('b');
    expect(result.current.previous).toBe('a');
    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.progress).toBe(0);
  });

  it('completes transition after duration', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0);

    const { result, rerender } = renderHook(
      ({ value }) => useVisualMemory(value, { duration: 300 }),
      { initialProps: { value: 'a' } },
    );

    vi.spyOn(performance, 'now').mockReturnValue(0);
    rerender({ value: 'b' });

    // Simulate animation completing
    act(() => flushRaf(350));

    expect(result.current.progress).toBe(1);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('skips animation when animate is false', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useVisualMemory(value, { animate: false }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });

    expect(result.current.current).toBe('b');
    expect(result.current.previous).toBe('a');
    expect(result.current.progress).toBe(1);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('skips animation when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: () => false,
      }),
    });

    const { result, rerender } = renderHook(
      ({ value }) => useVisualMemory(value),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });

    expect(result.current.progress).toBe(1);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('skips animation when duration is 0', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useVisualMemory(value, { duration: 0 }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });

    expect(result.current.progress).toBe(1);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('does not change state when value stays the same', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useVisualMemory(value),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'a' });

    expect(result.current.previous).toBeNull();
    expect(result.current.isTransitioning).toBe(false);
  });

  it('cancels previous animation when value changes mid-transition', () => {
    const cancelMock = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelMock);
    vi.spyOn(performance, 'now').mockReturnValue(0);

    const { result, rerender } = renderHook(
      ({ value }) => useVisualMemory(value, { duration: 300 }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    // Mid-transition, change again
    rerender({ value: 'c' });

    expect(cancelMock).toHaveBeenCalled();
    expect(result.current.current).toBe('c');
    expect(result.current.previous).toBe('b');
  });

  it('shows intermediate progress during animation', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0);

    const { result, rerender } = renderHook(
      ({ value }) => useVisualMemory(value, { duration: 1000, easing: 'linear' }),
      { initialProps: { value: 'a' } },
    );

    vi.spyOn(performance, 'now').mockReturnValue(0);
    rerender({ value: 'b' });

    // At 50% through
    act(() => flushRaf(500));

    expect(result.current.progress).toBeCloseTo(0.5, 1);
    expect(result.current.isTransitioning).toBe(true);
  });

  it('cleans up animation on unmount', () => {
    const cancelMock = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelMock);
    vi.spyOn(performance, 'now').mockReturnValue(0);

    const { rerender, unmount } = renderHook(
      ({ value }) => useVisualMemory(value, { duration: 300 }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    unmount();

    expect(cancelMock).toHaveBeenCalled();
  });
});
