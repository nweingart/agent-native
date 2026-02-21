import { cn } from '../../utils/cn';
import type { SubAgent, HandoffEvent } from '../../types';

export interface AgentHandoffClassNames {
  root?: string;
  agent?: string;
  agentHeader?: string;
  agentName?: string;
  agentStatus?: string;
  agentTask?: string;
  handoffArrow?: string;
  handoffLabel?: string;
  steps?: string;
}

export interface AgentHandoffProps {
  /** All agents in the system. */
  agents: SubAgent[];
  /** Currently active agent ID. */
  activeAgentId?: string;
  /** Delegation events between agents. */
  handoffs?: HandoffEvent[];
  /** Layout direction. Default: 'vertical'. */
  layout?: 'vertical' | 'horizontal';
  /** Show agent steps inline. Default: false. */
  showSteps?: boolean;
  /** Callback when an agent card is clicked. */
  onAgentClick?: (agent: SubAgent) => void;
  className?: string;
  classNames?: AgentHandoffClassNames;
}

const STATUS_DOT_CLASS: Record<SubAgent['status'], string> = {
  idle: 'an-agent-handoff__dot--idle',
  running: 'an-agent-handoff__dot--running',
  complete: 'an-agent-handoff__dot--complete',
  error: 'an-agent-handoff__dot--error',
};

const RUNNING_STATUSES = new Set<SubAgent['status']>(['running']);

function AgentCard({
  agent,
  isActive,
  showSteps,
  onAgentClick,
  classNames,
}: {
  agent: SubAgent;
  isActive: boolean;
  showSteps?: boolean;
  onAgentClick?: (agent: SubAgent) => void;
  classNames?: AgentHandoffClassNames;
}) {
  const isClickable = !!onAgentClick;

  const handleClick = () => {
    if (onAgentClick) onAgentClick(agent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onAgentClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onAgentClick(agent);
    }
  };

  return (
    <div
      className={cn(
        'an-agent-handoff__agent',
        `an-agent-handoff__agent--${agent.status}`,
        isActive && 'an-agent-handoff__agent--active',
        isClickable && 'an-agent-handoff__agent--clickable',
        classNames?.agent,
      )}
      role="listitem"
      aria-current={isActive ? 'true' : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      data-agent-id={agent.id}
      data-status={agent.status}
    >
      <div className={cn('an-agent-handoff__agent-header', classNames?.agentHeader)}>
        <span
          className={cn(
            'an-agent-handoff__dot',
            STATUS_DOT_CLASS[agent.status],
            RUNNING_STATUSES.has(agent.status) && 'an-agent-handoff__dot--pulsing',
          )}
        />
        <span className={cn('an-agent-handoff__agent-name', classNames?.agentName)}>
          {agent.name}
        </span>
        <span className={cn('an-agent-handoff__agent-status', classNames?.agentStatus)}>
          {agent.status}
        </span>
      </div>
      {agent.task && (
        <div className={cn('an-agent-handoff__agent-task', classNames?.agentTask)}>
          {agent.task}
        </div>
      )}
      {showSteps && agent.steps && agent.steps.length > 0 && (
        <div className={cn('an-agent-handoff__steps', classNames?.steps)}>
          {agent.steps.map((step) => (
            <div key={step.id} className="an-agent-handoff__step" data-status={step.status}>
              <span className={cn('an-agent-handoff__step-dot', `an-agent-handoff__step-dot--${step.status}`)} />
              <span className="an-agent-handoff__step-label">{step.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HandoffArrow({
  handoff,
  direction,
  classNames,
}: {
  handoff: HandoffEvent;
  direction: 'vertical' | 'horizontal';
  classNames?: AgentHandoffClassNames;
}) {
  return (
    <div
      className={cn(
        'an-agent-handoff__arrow',
        `an-agent-handoff__arrow--${direction}`,
        classNames?.handoffArrow,
      )}
      aria-hidden="true"
    >
      <span className="an-agent-handoff__arrow-line" />
      <span className="an-agent-handoff__arrow-head" />
      {handoff.task && (
        <span className={cn('an-agent-handoff__arrow-label', classNames?.handoffLabel)}>
          {handoff.task}
        </span>
      )}
    </div>
  );
}

export function AgentHandoff({
  agents,
  activeAgentId,
  handoffs = [],
  layout = 'vertical',
  showSteps = false,
  onAgentClick,
  className,
  classNames,
}: AgentHandoffProps) {
  // Build rendering order: interleave agents with handoff arrows
  const elements: React.ReactNode[] = [];

  // Create a map of handoffs by fromAgentId for quick lookup
  const handoffMap = new Map<string, HandoffEvent>();
  for (const h of handoffs) {
    handoffMap.set(h.fromAgentId, h);
  }

  agents.forEach((agent, i) => {
    elements.push(
      <AgentCard
        key={`agent-${agent.id}`}
        agent={agent}
        isActive={agent.id === activeAgentId}
        showSteps={showSteps}
        onAgentClick={onAgentClick}
        classNames={classNames}
      />,
    );

    // Check if there's a handoff from this agent to the next
    const handoff = handoffMap.get(agent.id);
    if (handoff && i < agents.length - 1) {
      elements.push(
        <HandoffArrow
          key={`arrow-${handoff.id}`}
          handoff={handoff}
          direction={layout}
          classNames={classNames}
        />,
      );
    }
  });

  return (
    <div
      className={cn(
        'an-agent-handoff',
        `an-agent-handoff--${layout}`,
        className,
        classNames?.root,
      )}
      role="list"
      aria-label="Agent handoff chain"
      data-layout={layout}
    >
      {elements}
    </div>
  );
}
