import React from 'react';
import type { AgentStep, StepStatus, ToolCall, Artifact } from '../../types';
import { cn } from '../../utils/cn';
import { useVisualMemory } from '../../hooks/useVisualMemory';
import { useElapsedTime } from '../../hooks/useElapsedTime';
import { TimelineToolCallList } from './TimelineToolCallList';
import type { TimelineToolCallProps } from './TimelineToolCall';
import type { TimelineArtifactProps } from './TimelineArtifact';

export interface TimelineStepProps {
  step: AgentStep;
  isActive?: boolean;
  showElapsedTime?: boolean;
  showToolCalls?: boolean;
  defaultToolCallsExpanded?: boolean;
  onClick?: (step: AgentStep) => void;
  className?: string;
  indicatorClassName?: string;
  bodyClassName?: string;
  renderContent?: (step: AgentStep) => React.ReactNode;
  renderIndicator?: (step: AgentStep) => React.ReactNode;
  renderToolContent?: TimelineToolCallProps['renderToolContent'];
  renderArtifactContent?: TimelineArtifactProps['renderArtifactContent'];
  /** @internal Controls which connector line segments are visible. */
  connectorSegments?: 'both' | 'below' | 'above' | 'none';
}

function StatusIndicator({ status }: { status: StepStatus }) {
  switch (status) {
    case 'running':
    case 'streaming':
      return <span className="an-timeline__indicator-spinner" aria-hidden="true" />;
    case 'complete':
      return <span className="an-timeline__indicator-check" aria-hidden="true" />;
    case 'error':
      return <span className="an-timeline__indicator-x" aria-hidden="true" />;
    default:
      return <span className="an-timeline__indicator-dot" aria-hidden="true" />;
  }
}

export function TimelineStep({
  step,
  isActive,
  showElapsedTime,
  showToolCalls,
  defaultToolCallsExpanded,
  onClick,
  className,
  indicatorClassName,
  bodyClassName,
  renderContent,
  renderIndicator,
  renderToolContent,
  renderArtifactContent,
  connectorSegments = 'none',
}: TimelineStepProps) {
  const { current: status } = useVisualMemory(step.status);
  const elapsed = useElapsedTime(step.startedAt, step.completedAt);
  const isClickable = !!onClick;

  const showTimer =
    showElapsedTime &&
    step.startedAt != null &&
    status !== 'pending' &&
    status !== 'skipped';

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        'an-timeline__step',
        `an-timeline__step--${status}`,
        `an-timeline__step--connector-${connectorSegments}`,
        isActive && 'an-timeline__step--active',
        isClickable && 'an-timeline__step--clickable',
        className,
      )}
      onClick={isClickable ? () => onClick(step) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(step);
              }
            }
          : undefined
      }
      data-step-id={step.id}
      data-status={status}
    >
      {renderIndicator ? (
        renderIndicator(step)
      ) : (
        <div className={cn('an-timeline__indicator', `an-timeline__indicator--${status}`, indicatorClassName)}>
          <StatusIndicator status={status} />
        </div>
      )}

      <div className={cn('an-timeline__step-body', bodyClassName)}>
        {renderContent ? (
          renderContent(step)
        ) : (
          <>
            <div className="an-timeline__step-label">{step.label}</div>
            <div className={cn(
              'an-timeline__step-description',
              !step.description && 'an-timeline__step-description--hidden',
            )}>
              {step.description}
            </div>
            <div className={cn(
              'an-timeline__step-error',
              !(step.error && status === 'error') && 'an-timeline__step-error--hidden',
            )}>
              {step.error}
            </div>
            {showToolCalls && (step.toolCalls?.length || step.artifacts?.length) ? (
              <TimelineToolCallList
                toolCalls={step.toolCalls}
                artifacts={step.artifacts}
                showElapsedTime={showElapsedTime}
                defaultExpanded={defaultToolCallsExpanded}
                renderToolContent={renderToolContent}
                renderArtifactContent={renderArtifactContent}
              />
            ) : null}
            <div className={cn(
              'an-timeline__step-elapsed',
              !showTimer && 'an-timeline__step-elapsed--hidden',
            )}>
              {elapsed}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
