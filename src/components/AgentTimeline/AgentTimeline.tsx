import React from 'react';
import type { AgentStep, StepTier, ApprovalRequest, ToolCall, Artifact } from '../../types';
import { cn } from '../../utils/cn';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { TimelineStep } from './TimelineStep';
import { TimelineConnector } from './TimelineConnector';
import { TimelineTier } from './TimelineTier';
import { TimelineApprovalGate } from './TimelineApprovalGate';
import { TimelineSummary } from './TimelineSummary';
import { TimelineToolCall } from './TimelineToolCall';
import { TimelineToolCallList } from './TimelineToolCallList';
import { TimelineArtifact } from './TimelineArtifact';
import type { TimelineStepProps } from './TimelineStep';

export interface TimelineClassNames {
  /** Root timeline container. */
  root?: string;
  /** Each step row. */
  step?: string;
  /** Step status indicator circle. */
  indicator?: string;
  /** Step body (label + description + elapsed). */
  stepBody?: string;
  /** Connector line between steps. */
  connector?: string;
  /** Tier (parallel group) container. */
  tier?: string;
  /** Tier header row. */
  tierHeader?: string;
  /** Approval gate container. */
  approval?: string;
  /** Approve button. */
  approveButton?: string;
  /** Reject button. */
  rejectButton?: string;
  /** Individual tool call row. */
  toolCall?: string;
  /** Tool call list container. */
  toolCallList?: string;
  /** Artifact row. */
  artifact?: string;
}

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
  /** Show tool calls within steps. Default: false. */
  showToolCalls?: boolean;
  /** Start tool call details expanded. Default: false. */
  defaultToolCallsExpanded?: boolean;
  /** Custom render for step content area. */
  renderStepContent?: TimelineStepProps['renderContent'];
  /** Custom render for step indicator. */
  renderStepIndicator?: TimelineStepProps['renderIndicator'];
  /** Custom render for tier header. */
  renderTierHeader?: (tier: StepTier) => React.ReactNode;
  /** Custom render for tool call input/output. */
  renderToolContent?: (toolCall: ToolCall) => React.ReactNode;
  /** Custom render for artifact content. */
  renderArtifactContent?: (artifact: Artifact) => React.ReactNode;
  /** Class names for each internal element. Ideal for Tailwind. */
  classNames?: TimelineClassNames;
  /** Additional class name for the root element. Shortcut for classNames.root. */
  className?: string;
  /** Additional class name applied to each step. Shortcut for classNames.step. */
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
  showToolCalls,
  defaultToolCallsExpanded,
  showConnectors = true,
  autoScroll = true,
  renderStepContent,
  renderStepIndicator,
  renderTierHeader,
  renderToolContent,
  renderArtifactContent,
  classNames,
  className,
  stepClassName,
}: AgentTimelineProps) {
  // Merge shortcut props with classNames object
  const resolvedClassNames: TimelineClassNames = {
    ...classNames,
    root: cn(classNames?.root, className),
    step: cn(classNames?.step, stepClassName),
  };

  const containerRef = useAutoScroll<HTMLDivElement>(
    steps.length + (approvalRequest ? 1 : 0),
    { enabled: autoScroll },
  );

  // Build a set of step IDs that belong to tiers for efficient lookup
  const tieredStepIds = new Set(tiers?.flatMap((t) => t.stepIds) ?? []);

  // Apply failedStepIds override
  const resolvedSteps = failedStepIds?.length
    ? steps.map((s) =>
        failedStepIds.includes(s.id) && s.status !== 'error'
          ? { ...s, status: 'error' as const }
          : s,
      )
    : steps;

  // Compute flat (non-tiered) step indices for connector segment calculation
  const flatStepIndices: number[] = [];
  for (let i = 0; i < resolvedSteps.length; i++) {
    if (!tieredStepIds.has(resolvedSteps[i].id)) {
      flatStepIndices.push(i);
    }
  }

  const getConnectorSegments = (stepIndex: number): 'both' | 'below' | 'above' | 'none' => {
    if (!showConnectors) return 'none';
    const flatPos = flatStepIndices.indexOf(stepIndex);
    if (flatPos === -1) return 'none';
    if (flatStepIndices.length <= 1) return 'none';
    if (flatPos === 0) return 'below';
    if (flatPos === flatStepIndices.length - 1) return 'above';
    return 'both';
  };

  const renderStepElement = (step: AgentStep, index: number) => (
    <TimelineStep
      key={step.id}
      step={step}
      isActive={step.id === activeStepId}
      showElapsedTime={showElapsedTime}
      showToolCalls={showToolCalls}
      defaultToolCallsExpanded={defaultToolCallsExpanded}
      onClick={onStepClick}
      className={resolvedClassNames.step}
      indicatorClassName={resolvedClassNames.indicator}
      bodyClassName={resolvedClassNames.stepBody}
      renderContent={renderStepContent}
      renderIndicator={renderStepIndicator}
      renderToolContent={renderToolContent}
      renderArtifactContent={renderArtifactContent}
      connectorSegments={getConnectorSegments(index)}
    />
  );

  // Render flat list (no tiers)
  const renderFlatSteps = () =>
    resolvedSteps.map((step, i) => {
      if (tieredStepIds.has(step.id)) return null;
      return renderStepElement(step, i);
    });

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
        // Advance past all steps in this tier
        const tierStepSet = new Set(tier.stepIds);
        while (i < resolvedSteps.length && tierStepSet.has(resolvedSteps[i].id)) {
          i++;
        }
        elements.push(
          <TimelineTier
            key={`tier-${tier.id}`}
            tier={tier}
            steps={resolvedSteps}
            showElapsedTime={showElapsedTime}
            showToolCalls={showToolCalls}
            defaultToolCallsExpanded={defaultToolCallsExpanded}
            activeStepId={activeStepId}
            onStepClick={onStepClick}
            classNames={resolvedClassNames}
            renderStepContent={renderStepContent}
            renderStepIndicator={renderStepIndicator}
            renderTierHeader={renderTierHeader}
            renderToolContent={renderToolContent}
            renderArtifactContent={renderArtifactContent}
          />,
        );
      } else {
        elements.push(renderStepElement(step, i));
        i++;
      }
    }

    return elements;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'an-timeline',
        !showConnectors && 'an-timeline--no-connectors',
        resolvedClassNames.root,
      )}
    >
      {renderContent()}
      {approvalRequest && (
        <div className="an-timeline__approval-overlay">
          <TimelineApprovalGate
            request={approvalRequest}
            onApprove={onApprove}
            onReject={onReject}
            className={resolvedClassNames.approval}
            approveButtonClassName={resolvedClassNames.approveButton}
            rejectButtonClassName={resolvedClassNames.rejectButton}
          />
        </div>
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
AgentTimeline.ToolCall = TimelineToolCall;
AgentTimeline.ToolCallList = TimelineToolCallList;
AgentTimeline.Artifact = TimelineArtifact;
