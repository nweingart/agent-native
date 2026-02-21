import React from 'react';
import type { ToolCall } from '../../types';
import { cn } from '../../utils/cn';
import { useVisualMemory } from '../../hooks/useVisualMemory';
import { useElapsedTime } from '../../hooks/useElapsedTime';

export interface TimelineToolCallProps {
  toolCall: ToolCall;
  showElapsedTime?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  renderToolContent?: (toolCall: ToolCall) => React.ReactNode;
}

function ToolStatusIndicator({ status }: { status: ToolCall['status'] }) {
  switch (status) {
    case 'running':
      return <span className="an-timeline__tool-indicator-spinner" aria-hidden="true" />;
    case 'complete':
      return <span className="an-timeline__tool-indicator-check" aria-hidden="true" />;
    case 'error':
      return <span className="an-timeline__tool-indicator-x" aria-hidden="true" />;
    default:
      return <span className="an-timeline__tool-indicator-dot" aria-hidden="true" />;
  }
}

export function TimelineToolCall({
  toolCall,
  showElapsedTime,
  defaultExpanded = false,
  className,
  renderToolContent,
}: TimelineToolCallProps) {
  const { current: status } = useVisualMemory(toolCall.status);
  const elapsed = useElapsedTime(toolCall.startedAt, toolCall.completedAt);

  const showTimer =
    showElapsedTime &&
    toolCall.startedAt != null &&
    status !== 'pending';

  return (
    <div
      className={cn(
        'an-timeline__tool-call',
        `an-timeline__tool-call--${status}`,
        className,
      )}
      data-tool-call-id={toolCall.id}
      data-status={status}
    >
      <div className={cn('an-timeline__tool-indicator', `an-timeline__tool-indicator--${status}`)}>
        <ToolStatusIndicator status={status} />
      </div>

      <div className="an-timeline__tool-call-body">
        <div className="an-timeline__tool-call-header">
          <span className="an-timeline__tool-name">{toolCall.name}</span>
          {showTimer && <span className="an-timeline__tool-elapsed">{elapsed}</span>}
        </div>

        {toolCall.error && status === 'error' && (
          <div className="an-timeline__tool-error">{toolCall.error}</div>
        )}

        {renderToolContent ? (
          renderToolContent(toolCall)
        ) : (
          <details className="an-timeline__tool-io" open={defaultExpanded || undefined}>
            <summary className="an-timeline__tool-io-summary">Input / Output</summary>
            <div className="an-timeline__tool-io-content">
              <div className="an-timeline__tool-io-section">
                <div className="an-timeline__tool-io-label">Input</div>
                <pre className="an-timeline__tool-io-pre">
                  {JSON.stringify(toolCall.input, null, 2)}
                </pre>
              </div>
              <div className="an-timeline__tool-io-section">
                <div className="an-timeline__tool-io-label">Output</div>
                {toolCall.output != null ? (
                  <pre className="an-timeline__tool-io-pre">
                    {typeof toolCall.output === 'string'
                      ? toolCall.output
                      : JSON.stringify(toolCall.output, null, 2)}
                  </pre>
                ) : (
                  <span className="an-timeline__tool-io-empty">No output</span>
                )}
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
