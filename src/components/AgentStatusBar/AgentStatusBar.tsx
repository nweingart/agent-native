import { cn } from '../../utils/cn';
import type { AgentStatus, TokenUsage, CostBreakdown } from '../../types';

export interface AgentStatusBarClassNames {
  root?: string;
  status?: string;
  statusDot?: string;
  statusLabel?: string;
  tokens?: string;
  elapsed?: string;
  cost?: string;
  model?: string;
  divider?: string;
}

export interface AgentStatusBarProps {
  /** Current agent status. */
  status: AgentStatus;
  /** Token usage data. Renders "1,234 in / 567 out". */
  tokenUsage?: TokenUsage;
  /** Elapsed time. String passed through; number formatted as "Xm Ys". */
  elapsed?: string | number;
  /** Cost. Number renders as "$0.0023"; CostBreakdown uses totalCost. */
  cost?: number | CostBreakdown;
  /** Model name to display. */
  model?: string;
  /** Callback when the status section is clicked. */
  onStatusClick?: (status: AgentStatus) => void;
  className?: string;
  classNames?: AgentStatusBarClassNames;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatTokens(usage: TokenUsage): string {
  const fmt = (n: number) => n.toLocaleString('en-US');
  return `${fmt(usage.inputTokens)} in / ${fmt(usage.outputTokens)} out`;
}

function formatCost(cost: number | CostBreakdown): string {
  const value = typeof cost === 'number' ? cost : cost.totalCost;
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(2)}`;
}

function formatElapsed(elapsed: string | number): string {
  if (typeof elapsed === 'string') return elapsed;

  const totalSeconds = Math.floor(elapsed);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  acting: 'Acting',
  waiting: 'Waiting',
  error: 'Error',
  complete: 'Complete',
};

const PULSING_STATUSES = new Set<AgentStatus>(['thinking', 'acting', 'waiting']);

// ── Component ────────────────────────────────────────────────────────

export function AgentStatusBar({
  status,
  tokenUsage,
  elapsed,
  cost,
  model,
  onStatusClick,
  className,
  classNames,
}: AgentStatusBarProps) {
  const isStatusClickable = !!onStatusClick;

  const handleStatusClick = () => {
    if (onStatusClick) onStatusClick(status);
  };

  const handleStatusKeyDown = (e: React.KeyboardEvent) => {
    if (onStatusClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onStatusClick(status);
    }
  };

  const sections: React.ReactNode[] = [];

  // Status section (always renders)
  sections.push(
    <div
      key="status"
      className={cn('an-status-bar__status', classNames?.status)}
      role={isStatusClickable ? 'button' : undefined}
      tabIndex={isStatusClickable ? 0 : undefined}
      onClick={isStatusClickable ? handleStatusClick : undefined}
      onKeyDown={isStatusClickable ? handleStatusKeyDown : undefined}
      aria-label={`Status: ${STATUS_LABELS[status]}`}
    >
      <span
        className={cn(
          'an-status-bar__dot',
          `an-status-bar__dot--${status}`,
          PULSING_STATUSES.has(status) && 'an-status-bar__dot--pulsing',
          classNames?.statusDot,
        )}
      />
      <span className={cn('an-status-bar__status-label', classNames?.statusLabel)}>
        {STATUS_LABELS[status]}
      </span>
    </div>,
  );

  if (tokenUsage) {
    sections.push(
      <span key="div-tokens" className={cn('an-status-bar__divider', classNames?.divider)} />,
    );
    sections.push(
      <span
        key="tokens"
        className={cn('an-status-bar__tokens', classNames?.tokens)}
        aria-label={`Tokens: ${formatTokens(tokenUsage)}`}
      >
        {formatTokens(tokenUsage)}
      </span>,
    );
  }

  if (elapsed !== undefined) {
    sections.push(
      <span key="div-elapsed" className={cn('an-status-bar__divider', classNames?.divider)} />,
    );
    sections.push(
      <span
        key="elapsed"
        className={cn('an-status-bar__elapsed', classNames?.elapsed)}
        aria-label={`Elapsed: ${formatElapsed(elapsed)}`}
      >
        {formatElapsed(elapsed)}
      </span>,
    );
  }

  if (cost !== undefined) {
    sections.push(
      <span key="div-cost" className={cn('an-status-bar__divider', classNames?.divider)} />,
    );
    sections.push(
      <span
        key="cost"
        className={cn('an-status-bar__cost', classNames?.cost)}
        aria-label={`Cost: ${formatCost(cost)}`}
      >
        {formatCost(cost)}
      </span>,
    );
  }

  if (model) {
    sections.push(
      <span key="div-model" className={cn('an-status-bar__divider', classNames?.divider)} />,
    );
    sections.push(
      <span
        key="model"
        className={cn('an-status-bar__model', classNames?.model)}
        aria-label={`Model: ${model}`}
      >
        {model}
      </span>,
    );
  }

  return (
    <div
      className={cn('an-status-bar', className, classNames?.root)}
      role="status"
      aria-live="polite"
      data-status={status}
    >
      {sections}
    </div>
  );
}
