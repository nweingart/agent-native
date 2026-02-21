import { cn } from '../../utils/cn';
import { parseAnsi } from '../../utils/ansi';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import type { AnsiSpan } from '../../utils/ansi';

export interface TerminalOutputClassNames {
  root?: string;
  header?: string;
  title?: string;
  exitCode?: string;
  body?: string;
  line?: string;
  lineNumber?: string;
}

export interface TerminalOutputProps {
  /** Raw text lines (may contain ANSI escape codes). */
  lines: string[];
  /** Shows a streaming cursor/indicator when true. */
  isStreaming?: boolean;
  /** Title shown in the header bar (e.g. "npm install"). */
  title?: string;
  /** Exit code badge. Green for 0, red for nonzero. */
  exitCode?: number;
  /** Max height for the scroll container. Default: 400px. */
  maxHeight?: number | string;
  /** Wraps in a collapsible details/summary element. */
  collapsible?: boolean;
  /** Whether the collapsible is expanded by default. Default: true. */
  defaultExpanded?: boolean;
  /** Callback when a line is clicked. */
  onLineClick?: (line: string, index: number) => void;
  className?: string;
  classNames?: TerminalOutputClassNames;
}

function AnsiLine({ spans }: { spans: AnsiSpan[] }) {
  return (
    <>
      {spans.map((span, i) => {
        const classes: string[] = [];
        if (span.style.fg) classes.push(`an-terminal__ansi--${span.style.fg}`);
        if (span.style.bg) classes.push(`an-terminal__ansi-bg--${span.style.bg}`);
        if (span.style.bold) classes.push('an-terminal__ansi--bold');
        if (span.style.dim) classes.push('an-terminal__ansi--dim');
        if (span.style.italic) classes.push('an-terminal__ansi--italic');
        if (span.style.underline) classes.push('an-terminal__ansi--underline');

        if (classes.length === 0) {
          return <span key={i}>{span.text}</span>;
        }
        return (
          <span key={i} className={classes.join(' ')}>
            {span.text}
          </span>
        );
      })}
    </>
  );
}

function TerminalBody({
  lines,
  isStreaming,
  maxHeight,
  onLineClick,
  classNames,
}: Pick<TerminalOutputProps, 'lines' | 'isStreaming' | 'maxHeight' | 'onLineClick' | 'classNames'>) {
  const containerRef = useAutoScroll<HTMLDivElement>(lines.length, {
    enabled: isStreaming,
  });

  const heightValue = maxHeight ?? 400;
  const heightStyle = typeof heightValue === 'number' ? `${heightValue}px` : heightValue;

  return (
    <div
      ref={containerRef}
      className={cn('an-terminal__body', classNames?.body)}
      style={{ maxHeight: heightStyle }}
      role="log"
      aria-live="polite"
    >
      {lines.map((line, i) => {
        const spans = parseAnsi(line);
        return (
          <div
            key={i}
            className={cn('an-terminal__line', classNames?.line)}
            onClick={onLineClick ? () => onLineClick(line, i) : undefined}
          >
            <span className={cn('an-terminal__line-number', classNames?.lineNumber)}>
              {i + 1}
            </span>
            <span className="an-terminal__line-content">
              <AnsiLine spans={spans} />
            </span>
          </div>
        );
      })}
      {isStreaming && (
        <span className="an-terminal__cursor" aria-hidden="true" />
      )}
    </div>
  );
}

export function TerminalOutput({
  lines,
  isStreaming = false,
  title,
  exitCode,
  maxHeight,
  collapsible = false,
  defaultExpanded = true,
  onLineClick,
  className,
  classNames,
}: TerminalOutputProps) {
  const hasHeader = title !== undefined || exitCode !== undefined;

  const header = hasHeader ? (
    <div className={cn('an-terminal__header', classNames?.header)}>
      {title && (
        <span className={cn('an-terminal__title', classNames?.title)}>
          {title}
        </span>
      )}
      {exitCode !== undefined && (
        <span
          className={cn(
            'an-terminal__exit-code',
            exitCode === 0 ? 'an-terminal__exit-code--success' : 'an-terminal__exit-code--error',
            classNames?.exitCode,
          )}
          aria-label={`Exit code: ${exitCode}`}
        >
          exit {exitCode}
        </span>
      )}
      {isStreaming && (
        <span className="an-terminal__streaming-badge" aria-label="Streaming">
          streaming
        </span>
      )}
    </div>
  ) : null;

  const body = (
    <TerminalBody
      lines={lines}
      isStreaming={isStreaming}
      maxHeight={maxHeight}
      onLineClick={onLineClick}
      classNames={classNames}
    />
  );

  if (collapsible) {
    return (
      <details
        className={cn('an-terminal', className, classNames?.root)}
        open={defaultExpanded}
        data-streaming={isStreaming || undefined}
      >
        <summary className="an-terminal__summary">
          {title || 'Terminal Output'}
          {exitCode !== undefined && (
            <span
              className={cn(
                'an-terminal__exit-code',
                exitCode === 0 ? 'an-terminal__exit-code--success' : 'an-terminal__exit-code--error',
                classNames?.exitCode,
              )}
            >
              exit {exitCode}
            </span>
          )}
        </summary>
        {body}
      </details>
    );
  }

  return (
    <div
      className={cn('an-terminal', className, classNames?.root)}
      data-streaming={isStreaming || undefined}
    >
      {header}
      {body}
    </div>
  );
}
