import React from 'react';
import type { AgentStep, StepStatus } from '../../types';
import { cn } from '../../utils/cn';

export interface TimelineSummaryProps {
  steps: AgentStep[];
  className?: string;
}

function countByStatus(steps: AgentStep[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const step of steps) {
    counts[step.status] = (counts[step.status] || 0) + 1;
  }
  return counts;
}

const DISPLAY_STATUSES: StepStatus[] = ['complete', 'running', 'error', 'pending'];

export function TimelineSummary({ steps, className }: TimelineSummaryProps) {
  const counts = countByStatus(steps);

  return (
    <div className={cn('an-timeline__tier-header', className)}>
      {DISPLAY_STATUSES.map((status) => {
        const count = counts[status];
        if (!count) return null;
        return (
          <span key={status} className="an-timeline__tier-badge">
            {count} {status}
          </span>
        );
      })}
    </div>
  );
}
