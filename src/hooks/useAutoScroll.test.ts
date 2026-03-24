import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoScroll } from './useAutoScroll';

function createMockContainer(overrides: Partial<HTMLDivElement> = {}) {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollHeight', { value: overrides.scrollHeight ?? 1000, configurable: true });
  Object.defineProperty(el, 'scrollTop', { value: overrides.scrollTop ?? 950, writable: true, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: overrides.clientHeight ?? 100, configurable: true });
  el.scrollTo = vi.fn();
  return el;
}

describe('useAutoScroll', () => {
  it('returns a ref object', () => {
    const { result } = renderHook(() => useAutoScroll(0));
    expect(result.current).toHaveProperty('current');
  });

  it('scrolls to bottom when trigger changes and user is at bottom', () => {
    const el = createMockContainer({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
    const { rerender } = renderHook(
      ({ trigger }) => {
        const ref = useAutoScroll(trigger);
        // Attach mock element to ref
        (ref as { current: HTMLDivElement | null }).current = el;
        return ref;
      },
      { initialProps: { trigger: 0 } },
    );

    rerender({ trigger: 1 });
    expect(el.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
  });

  it('does not scroll when disabled', () => {
    const el = createMockContainer();
    const { rerender } = renderHook(
      ({ trigger }) => {
        const ref = useAutoScroll(trigger, { enabled: false });
        (ref as { current: HTMLDivElement | null }).current = el;
        return ref;
      },
      { initialProps: { trigger: 0 } },
    );

    rerender({ trigger: 1 });
    expect(el.scrollTo).not.toHaveBeenCalled();
  });

  it('uses custom behavior option', () => {
    const el = createMockContainer();
    const { rerender } = renderHook(
      ({ trigger }) => {
        const ref = useAutoScroll(trigger, { behavior: 'instant' });
        (ref as { current: HTMLDivElement | null }).current = el;
        return ref;
      },
      { initialProps: { trigger: 0 } },
    );

    rerender({ trigger: 1 });
    expect(el.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }));
  });
});
