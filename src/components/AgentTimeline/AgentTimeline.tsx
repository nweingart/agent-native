import React from 'react';
import type { AgentStep, StepTier, ApprovalRequest } from '../../types';
import { cn } from '../../utils/cn';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { TimelineStep } from './TimelineStep';
import { TimelineConnector } from './TimelineConnector';
import { TimelineTier } from './TimelineTier';
import { TimelineApprovalGate } from './TimelineApprovalGate';
import { TimelineSummary } from './TimelineSummary';
import type { TimelineStepProps } from './TimelineStep';

export interface AgentTimelineProps {
  /** The list of agent steps to display. */
  steps: AgentStep[];
  /** Optional parallel tier groupings. */
  tiers?: StepTier[];
  /** ID of the currently active/focused step. */
  activeStepId?: string;
  /** IDs of steps that have failed. */
  failedStepIds?: string[];
  /** Pending approval request to show inline. */
  approvalRequest?: ApprovalRequest;
  /** Called when user approves an approval gate. */
  onApprove?: (request: ApprovalRequest) => void;
  /** Called when user rejects an approval gate. */
  onReject?: (request: ApprovalRequest) => void;
  /** Called when a step is clicked. */
  onStepClick?: (step: AgentStep) => void;
  /** Show elapsed time on running/completed steps. */
  showElapsedTime?: boolean;
  /** Show connectors between steps. Default: true. */
  showConnectors?: boolean;
  /** Auto-scroll to keep latest step visible. Default: true. */
  autoScroll?: boolean;
  /** Custom render for step content area. */
  renderStepContent?: TimelineStepProps['renderContent'];
  /** Custom render for step indicator. */
  renderStepIndicator?: TimelineStepProps['renderIndicator'];
  /** Custom render for tier header. */
  renderTierHeader?: (tier: StepTier) => React.ReactNode;
  /** Additional class name for the root element. */
  className?: string;
  /** Additional class name applied to each step. */
  stepClassName?: string;
}

/**
 * AgentTimeline displays a vertical timeline of agent steps,
 * with support for parallel tiers, approval gates, and live elapsed time.
 */
export function AgentTimeline({
  steps,
  tiers,
  activeStepId,
  failedStepIds,
  approvalRequest,
  onApprove,
  onReject,
  onStepClick,
  showElapsedTime,
  showConnectors = true,
  autoScroll = true,
  renderStepContent,
  renderStepIndicator,
  renderTierHeader,
  className,
  stepClassName,
}: AgentTimelineProps) {
  const containerRef = useAutoScroll<HTMLDivElement>([steps, approvalRequest], {
    enabled: autoScroll,
  });

  // Build a set of step IDs that belong to tiers for efficient lookup
  const tieredStepIds = new Set(tiers?.flatMap((t) => t.stepIds) ?? []);

  // Determine connector fill based on step completion
  const getConnectorFill = (index: number): number => {
    if (index >= steps.length - 1) return 0;
    const nextStep = steps[index + 1];
    if (!nextStep) return 0;
    if (nextStep.status === 'complete' || nextStep.status === 'error') return 100;
    if (nextStep.status === 'running' || nextStep.status === 'streaming') return 50;
    return 0;
  };

  // Apply failedStepIds override
  const resolvedSteps = failedStepIds?.length
    ? steps.map((s) =>
        failedStepIds.includes(s.id) && s.status !== 'error'
          ? { ...s, status: 'error' as const }
          : s,
      )
    : steps;

  // Render flat list (no tiers)
  const renderFlatSteps = () =>
    resolvedSteps.map((step, i) => {
      if (tieredStepIds.has(step.id)) return null;

      return (
        <React.Fragment key={step.id}>
          <TimelineStep
            step={step}
            isActive={step.id === activeStepId}
            showElapsedTime={showElapsedTime}
            onClick={onStepClick}
            className={stepClassName}
            renderContent={renderStepContent}
            renderIndicator={renderStepIndicator}
          />
          {showConnectors && i < resolvedSteps.length - 1 && !tieredStepIds.has(step.id) && (
            <TimelineConnector fillPercent={getConnectorFill(i)} />
          )}
        </React.Fragment>
      );
    });

  // Render tiers inline at the position of their first step
  const renderTiers = () => {
    if (!tiers?.length) return null;

    return tiers.map((tier) => {
      const firstStepIndex = resolvedSteps.findIndex((s) => tier.stepIds.includes(s.id));
      if (firstStepIndex === -1) return null;

      return (
        <React.Fragment key={tier.id}>
          <TimelineTier
            tier={tier}
            steps={resolvedSteps}
            showElapsedTime={showElapsedTime}
            activeStepId={activeStepId}
            onStepClick={onStepClick}
            stepClassName={stepClassName}
            renderStepContent={renderStepContent}
            renderStepIndicator={renderStepIndicator}
            renderTierHeader={renderTierHeader}
          />
          {showConnectors && firstStepIndex < resolvedSteps.length - 1 && (
            <TimelineConnector fillPercent={getConnectorFill(firstStepIndex)} />
          )}
        </React.Fragment>
      );
    });
  };

  // Build final render order: interleave flat steps and tier groups
  const renderContent = () => {
    if (!tiers?.length) {
      return renderFlatSteps();
    }

    const elements: React.ReactNode[] = [];
    const renderedTiers = new Set<string>();
    let i = 0;

    while (i < resolvedSteps.length) {
      const step = resolvedSteps[i];
      const tier = tiers.find((t) => t.stepIds.includes(step.id) && !renderedTiers.has(t.id));

      if (tier) {
        renderedTiers.add(tier.id);
        elements.push(
          <React.Fragment key={`tier-${tier.id}`}>
            <TimelineTier
              tier={tier}
              steps={resolvedSteps}
              showElapsedTime={showElapsedTime}
              activeStepId={activeStepId}
              onStepClick={onStepClick}
              stepClassName={stepClassName}
              renderStepContent={renderStepContent}
              renderStepIndicator={renderStepIndicator}
              renderTierHeader={renderTierHeader}
            />
            {showConnectors && i < resolvedSteps.length - 1 && (
              <TimelineConnector />
            )}
          </React.Fragment>,
        );
        // Skip past all steps in this tier
        const tierStepSet = new Set(tier.stepIds);
        while (i < resolvedSteps.length && tierStepSet.has(resolvedSteps[i].id)) {
          i++;
        }
      } else {
        elements.push(
          <React.Fragment key={step.id}>
            <TimelineStep
              step={step}
              isActive={step.id === activeStepId}
              showElapsedTime={showElapsedTime}
              onClick={onStepClick}
              className={stepClassName}
              renderContent={renderStepContent}
              renderIndicator={renderStepIndicator}
            />
            {showConnectors && i < resolvedSteps.length - 1 && (
              <TimelineConnector fillPercent={getConnectorFill(i)} />
            )}
          </React.Fragment>,
        );
        i++;
      }
    }

    return elements;
  };

  return (
    <div ref={containerRef} className={cn('an-timeline', className)}>
      {renderContent()}
      {approvalRequest && (
        <TimelineApprovalGate
          request={approvalRequest}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </div>
  );
}

// Attach subcomponents for compound pattern
AgentTimeline.Step = TimelineStep;
AgentTimeline.Connector = TimelineConnector;
AgentTimeline.Tier = TimelineTier;
AgentTimeline.ApprovalGate = TimelineApprovalGate;
AgentTimeline.Summary = TimelineSummary;
