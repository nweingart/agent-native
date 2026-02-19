import React from 'react';
import type { AgentStep, StepTier } from '../../types';
import { cn } from '../../utils/cn';
import { TimelineStep } from './TimelineStep';
import type { TimelineStepProps } from './TimelineStep';

export interface TimelineTierProps {
  tier: StepTier;
  steps: AgentStep[];
  showElapsedTime?: boolean;
  activeStepId?: string;
  onStepClick?: (step: AgentStep) => void;
  stepClassName?: string;
  className?: string;
  renderStepContent?: TimelineStepProps['renderContent'];
  renderStepIndicator?: TimelineStepProps['renderIndicator'];
  renderTierHeader?: (tier: StepTier) => React.ReactNode;
}

export function TimelineTier({
  tier,
  steps,
  showElapsedTime,
  activeStepId,
  onStepClick,
  stepClassName,
  className,
  renderStepContent,
  renderStepIndicator,
  renderTierHeader,
}: TimelineTierProps) {
  const tierSteps = steps.filter((s) => tier.stepIds.includes(s.id));

  return (
    <div className={cn('an-timeline__tier', className)} data-tier-id={tier.id}>
      {renderTierHeader ? (
        renderTierHeader(tier)
      ) : (
        <div className="an-timeline__tier-header">
          {tier.label && <span>{tier.label}</span>}
          <span className="an-timeline__tier-badge">{tierSteps.length} parallel</span>
        </div>
      )}
      {tierSteps.map((step) => (
        <TimelineStep
          key={step.id}
          step={step}
          isActive={step.id === activeStepId}
          showElapsedTime={showElapsedTime}
          onClick={onStepClick}
          className={stepClassName}
          renderContent={renderStepContent}
          renderIndicator={renderStepIndicator}
        />
      ))}
    </div>
  );
}
