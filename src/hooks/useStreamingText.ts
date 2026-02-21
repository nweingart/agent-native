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

  // Instant mode — no animation
  if (typingSpeed === undefined) {
    return { displayedText: content, isTyping: false };
  }

  /* eslint-disable react-hooks/rules-of-hooks */
  const [charIndex, setCharIndex] = useState(content.length);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // When content grows, keep charIndex where it is so the animation can
  // catch up. When content shrinks (reset), snap charIndex to 0.
  useEffect(() => {
    if (content.length < charIndex) {
      setCharIndex(content.length);
    }
  }, [content, charIndex]);

  useEffect(() => {
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
  }, [content, charIndex, typingSpeed, cancelAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return cancelAnimation;
  }, [cancelAnimation]);

  const displayedText = content.slice(0, charIndex);
  const isTyping = charIndex < content.length;

  return { displayedText, isTyping };
  /* eslint-enable react-hooks/rules-of-hooks */
}
