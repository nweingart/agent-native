import React from 'react';
import type { AgentStep, StepTier } from '../../types';
import { cn } from '../../utils/cn';
import { TimelineStep } from './TimelineStep';
import type { TimelineStepProps } from './TimelineStep';
import type { TimelineClassNames } from './AgentTimeline';

export interface TimelineTierProps {
  tier: StepTier;
  steps: AgentStep[];
  showElapsedTime?: boolean;
  activeStepId?: string;
  onStepClick?: (step: AgentStep) => void;
  classNames?: TimelineClassNames;
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
  classNames,
  className,
  renderStepContent,
  renderStepIndicator,
  renderTierHeader,
}: TimelineTierProps) {
  const tierSteps = steps.filter((s) => tier.stepIds.includes(s.id));

  return (
    <div className={cn('an-timeline__tier', classNames?.tier, className)} data-tier-id={tier.id}>
      {renderTierHeader ? (
        renderTierHeader(tier)
      ) : (
        <div className={cn('an-timeline__tier-header', classNames?.tierHeader)}>
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
          className={classNames?.step}
          indicatorClassName={classNames?.indicator}
          bodyClassName={classNames?.stepBody}
          renderContent={renderStepContent}
          renderIndicator={renderStepIndicator}
        />
      ))}
    </div>
  );
}
