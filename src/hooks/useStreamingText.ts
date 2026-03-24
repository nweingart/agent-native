import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseStreamingTextOptions {
  /** Characters per second for simulated typing. Omit for instant display. */
  typingSpeed?: number;
}

export interface UseStreamingTextReturn {
  /** The text currently visible to the user. */
  displayedText: string;
  /** Whether the simulated typing animation is still catching up. */
  isTyping: boolean;
}

/**
 * Manages displayed text for a streaming output — either instant or
 * animated at a given typing speed via requestAnimationFrame.
 */
export function useStreamingText(
  content: string,
  isStreaming: boolean,
  options: UseStreamingTextOptions = {},
): UseStreamingTextReturn {
  const { typingSpeed } = options;
  const animated = typingSpeed !== undefined;

  const [charIndex, setCharIndex] = useState(content.length);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // When transitioning from non-animated to animated, sync charIndex to
  // current content length so we don't use a stale value.
  const prevAnimatedRef = useRef(animated);
  useEffect(() => {
    if (animated && !prevAnimatedRef.current) {
      setCharIndex(content.length);
    }
    prevAnimatedRef.current = animated;
  }, [animated, content.length]);

  // When content shrinks (reset) while animated, snap charIndex down.
  useEffect(() => {
    if (!animated) return;
    if (content.length < charIndex) {
      setCharIndex(content.length);
    }
  }, [content.length, charIndex, animated]);

  useEffect(() => {
    if (!animated) {
      return;
    }
    if (charIndex >= content.length) {
      cancelAnimation();
      return;
    }

    const charsPerMs = typingSpeed / 1000;

    const tick = (now: number) => {
      if (lastTickRef.current === 0) {
        lastTickRef.current = now;
      }

      const elapsed = now - lastTickRef.current;
      const charsToAdd = Math.floor(elapsed * charsPerMs);

      if (charsToAdd > 0) {
        lastTickRef.current = now;
        setCharIndex((prev) => Math.min(prev + charsToAdd, content.length));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);

    return cancelAnimation;
  }, [content, charIndex, typingSpeed, cancelAnimation, animated]);

  // Cleanup on unmount
  useEffect(() => {
    return cancelAnimation;
  }, [cancelAnimation]);

  if (!animated) {
    return { displayedText: content, isTyping: false };
  }

  const displayedText = content.slice(0, charIndex);
  const isTyping = charIndex < content.length;

  return { displayedText, isTyping };
}
