import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingText } from './useStreamingText';

describe('useStreamingText', () => {
  describe('instant mode (no typingSpeed)', () => {
    it('returns full content immediately', () => {
      const { result } = renderHook(() => useStreamingText('Hello world', true));
      expect(result.current.displayedText).toBe('Hello world');
      expect(result.current.isTyping).toBe(false);
    });

    it('updates displayedText when content changes', () => {
      const { result, rerender } = renderHook(
        ({ content }) => useStreamingText(content, true),
        { initialProps: { content: 'Hello' } },
      );

      expect(result.current.displayedText).toBe('Hello');

      rerender({ content: 'Hello world' });
      expect(result.current.displayedText).toBe('Hello world');
    });
  });

  describe('animated mode (with typingSpeed)', () => {
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
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    function flushRaf(time: number) {
      const cbs = [...rafCallbacks];
      rafCallbacks = [];
      for (const cb of cbs) {
        cb(time);
      }
    }

    it('starts typing and progresses over time', () => {
      const { result } = renderHook(() =>
        useStreamingText('Hello', false, { typingSpeed: 5000 }),
      );

      // Initial: charIndex starts at content.length (5), so it shows full text
      expect(result.current.displayedText).toBe('Hello');
      expect(result.current.isTyping).toBe(false);
    });

    it('catches up when new content arrives', () => {
      const { result, rerender } = renderHook(
        ({ content }) => useStreamingText(content, true, { typingSpeed: 10 }),
        { initialProps: { content: 'Hi' } },
      );

      expect(result.current.displayedText).toBe('Hi');

      // New content arrives - charIndex stays at 2, content is now longer
      rerender({ content: 'Hi there' });
      expect(result.current.isTyping).toBe(true);

      // Each rAF tick advances chars and schedules the next one.
      // Flush multiple rounds to let the animation catch up fully.
      let time = 0;
      for (let i = 0; i < 20 && result.current.isTyping; i++) {
        time += 100;
        act(() => flushRaf(time));
      }

      expect(result.current.displayedText).toBe('Hi there');
      expect(result.current.isTyping).toBe(false);
    });

    it('snaps charIndex to content.length when content shrinks (reset)', () => {
      const { result, rerender } = renderHook(
        ({ content }) => useStreamingText(content, true, { typingSpeed: 10 }),
        { initialProps: { content: 'Hello world' } },
      );

      expect(result.current.displayedText).toBe('Hello world');

      // Content shrinks (reset scenario)
      rerender({ content: 'Hi' });
      expect(result.current.displayedText).toBe('Hi');
      expect(result.current.isTyping).toBe(false);
    });

    it('cancels animation on unmount', () => {
      const cancelMock = vi.fn();
      vi.stubGlobal('cancelAnimationFrame', cancelMock);

      const { unmount, rerender } = renderHook(
        ({ content }) => useStreamingText(content, true, { typingSpeed: 10 }),
        { initialProps: { content: 'Hi' } },
      );

      // Trigger animation by growing content
      rerender({ content: 'Hi there!' });
      unmount();

      expect(cancelMock).toHaveBeenCalled();
    });
  });
});
