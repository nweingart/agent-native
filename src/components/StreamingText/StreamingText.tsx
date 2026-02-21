import { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { useStreamingText } from '../../hooks/useStreamingText';
import type { UseStreamingTextOptions } from '../../hooks/useStreamingText';

export interface StreamingTextClassNames {
  root?: string;
  text?: string;
  cursor?: string;
}

export interface StreamingTextProps {
  /** Accumulated text content so far. */
  content: string;
  /** Whether tokens are still arriving. */
  isStreaming: boolean;
  /** Fires when streaming stops and typing animation catches up. */
  onStreamEnd?: () => void;
  /** Cursor appearance. Default: 'line'. */
  cursorStyle?: 'line' | 'block' | 'underscore';
  /** Characters per second for simulated typing. Omit for instant display. */
  typingSpeed?: number;
  className?: string;
  classNames?: StreamingTextClassNames;
}

export function StreamingText({
  content,
  isStreaming,
  onStreamEnd,
  cursorStyle = 'line',
  typingSpeed,
  className,
  classNames,
}: StreamingTextProps) {
  const options: UseStreamingTextOptions = typingSpeed !== undefined ? { typingSpeed } : {};
  const { displayedText, isTyping } = useStreamingText(content, isStreaming, options);

  const showCursor = isStreaming || isTyping;

  // Fire onStreamEnd when streaming stops AND typing catches up
  const prevActiveRef = useRef(isStreaming || isTyping);
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const isActive = isStreaming || isTyping;
    prevActiveRef.current = isActive;

    if (wasActive && !isActive && onStreamEnd) {
      onStreamEnd();
    }
  }, [isStreaming, isTyping, onStreamEnd]);

  return (
    <div
      className={cn(
        'an-streaming-text',
        className,
        classNames?.root,
      )}
      role="log"
      aria-live="polite"
    >
      <span className={cn('an-streaming-text__text', classNames?.text)}>
        {displayedText}
      </span>
      <span
        className={cn(
          'an-streaming-text__cursor',
          `an-streaming-text__cursor--${cursorStyle}`,
          !showCursor && 'an-streaming-text__cursor--hidden',
          classNames?.cursor,
        )}
        aria-hidden="true"
      />
    </div>
  );
}
