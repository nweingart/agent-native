import { cn } from '../../utils/cn';
import { useVisualMemory } from '../../hooks/useVisualMemory';

export interface ThinkingIndicatorClassNames {
  root?: string;
  animation?: string;
  label?: string;
}

export interface ThinkingIndicatorProps {
  /** Whether the model is currently thinking/reasoning. */
  isThinking: boolean;
  /** Label text. Default: "Thinking". */
  label?: string;
  /** Animation variant. Default: 'shimmer'. */
  variant?: 'shimmer' | 'dots' | 'pulse';
  className?: string;
  classNames?: ThinkingIndicatorClassNames;
}

export function ThinkingIndicator({
  isThinking,
  label = 'Thinking',
  variant = 'shimmer',
  className,
  classNames,
}: ThinkingIndicatorProps) {
  const { current, isTransitioning } = useVisualMemory(isThinking);

  // Only render when active or transitioning out
  if (!current && !isTransitioning) {
    return null;
  }

  const entering = current && isTransitioning;
  const exiting = !current && isTransitioning;

  return (
    <div
      className={cn(
        'an-thinking-indicator',
        `an-thinking-indicator--${variant}`,
        entering && 'an-thinking-indicator--enter',
        exiting && 'an-thinking-indicator--exit',
        className,
        classNames?.root,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={cn('an-thinking-indicator__animation', classNames?.animation)}>
        {variant === 'dots' && (
          <>
            <span className="an-thinking-indicator__dot" />
            <span className="an-thinking-indicator__dot" />
            <span className="an-thinking-indicator__dot" />
          </>
        )}
        {variant === 'pulse' && (
          <span className="an-thinking-indicator__pulse" />
        )}
        {variant === 'shimmer' && (
          <span className="an-thinking-indicator__shimmer" />
        )}
      </div>
      <span className={cn('an-thinking-indicator__label', classNames?.label)}>
        {label}
      </span>
    </div>
  );
}
