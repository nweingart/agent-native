import React from 'react';
import type { AgentStep, StepStatus } from '../../types';
import { cn } from '../../utils/cn';
import { useVisualMemory } from '../../hooks/useVisualMemory';
import { useElapsedTime } from '../../hooks/useElapsedTime';

export interface TimelineStepProps {
  step: AgentStep;
  isActive?: boolean;
  showElapsedTime?: boolean;
  onClick?: (step: AgentStep) => void;
  className?: string;
  renderContent?: (step: AgentStep) => React.ReactNode;
  renderIndicator?: (step: AgentStep) => React.ReactNode;
}

function StatusIndicator({ status }: { status: StepStatus }) {
  switch (status) {
    case 'running':
    case 'streaming':
      return <span className="an-timeline__indicator-spinner" />;
    case 'complete':
      return <span className="an-timeline__indicator-check" />;
    case 'error':
      return <span className="an-timeline__indicator-x" />;
    default:
      return <span className="an-timeline__indicator-dot" />;
  }
}

export function TimelineStep({
  step,
  isActive,
  showElapsedTime,
  onClick,
  className,
  renderContent,
  renderIndicator,
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
        <div className={cn('an-timeline__indicator', `an-timeline__indicator--${status}`)}>
          <StatusIndicator status={status} />
        </div>
      )}

      <div className="an-timeline__step-body">
        {renderContent ? (
          renderContent(step)
        ) : (
          <>
            <div className="an-timeline__step-label">{step.label}</div>
            {step.description && (
              <div className="an-timeline__step-description">{step.description}</div>
            )}
            {step.error && status === 'error' && (
              <div className="an-timeline__step-error">{step.error}</div>
            )}
            {showTimer && (
              <div className="an-timeline__step-elapsed">{elapsed}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
