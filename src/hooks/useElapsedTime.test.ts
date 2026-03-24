import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useElapsedTime } from './useElapsedTime';

describe('useElapsedTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "0s" when startedAt is undefined', () => {
    const { result } = renderHook(() => useElapsedTime(undefined));
    expect(result.current).toBe('0s');
  });

  it('formats seconds only', () => {
    const now = Date.now();
    const { result } = renderHook(() => useElapsedTime(now - 5000, now));
    expect(result.current).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    const now = Date.now();
    const { result } = renderHook(() => useElapsedTime(now - 65000, now));
    expect(result.current).toBe('1m 5s');
  });

  it('formats hours, minutes, and seconds', () => {
    const now = Date.now();
    const { result } = renderHook(() => useElapsedTime(now - 3723000, now));
    expect(result.current).toBe('1h 2m 3s');
  });

  it('updates live when running (no completedAt)', () => {
    const startedAt = Date.now();
    const { result } = renderHook(() => useElapsedTime(startedAt));

    expect(result.current).toBe('0s');

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe('3s');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe('5s');
  });

  it('stops updating when completedAt is provided', () => {
    const startedAt = Date.now();
    const { result, rerender } = renderHook(
      ({ completedAt }) => useElapsedTime(startedAt, completedAt),
      { initialProps: { completedAt: undefined as number | undefined } },
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe('2s');

    const completedAt = Date.now();
    rerender({ completedAt });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Should stay frozen at the completed time
    const elapsed = Math.floor((completedAt - startedAt) / 1000);
    expect(result.current).toBe(`${elapsed}s`);
  });

  it('clamps negative values to 0s', () => {
    const now = Date.now();
    const { result } = renderHook(() => useElapsedTime(now + 10000, now));
    expect(result.current).toBe('0s');
  });

  it('respects custom interval', () => {
    const startedAt = Date.now();
    const { result } = renderHook(() => useElapsedTime(startedAt, undefined, 500));

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('0s');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('1s');
  });
});
