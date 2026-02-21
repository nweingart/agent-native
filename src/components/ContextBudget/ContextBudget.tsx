import { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import type { ContextBudgetData } from '../../types';

export interface ContextBudgetClassNames {
  root?: string;
  bar?: string;
  segment?: string;
  label?: string;
  legend?: string;
  remaining?: string;
}

export interface ContextBudgetProps {
  /** Token budget data. */
  budget: ContextBudgetData;
  /** Show labels on each segment. Default: true. */
  showLabels?: boolean;
  /** Show percentages in the legend. Default: true. */
  showPercentages?: boolean;
  /** Layout mode. Default: 'bar'. */
  layout?: 'bar' | 'ring';
  /** Usage fraction (0-1) at which the meter turns yellow. Default: 0.8. */
  warningThreshold?: number;
  /** Usage fraction (0-1) at which the meter turns red. Default: 0.95. */
  dangerThreshold?: number;
  /** Called when a threshold is reached. */
  onThresholdReached?: (level: 'warning' | 'danger') => void;
  className?: string;
  classNames?: ContextBudgetClassNames;
}

interface Segment {
  key: string;
  label: string;
  tokens: number;
  cssVar: string;
}

function buildSegments(budget: ContextBudgetData): Segment[] {
  const segments: Segment[] = [];
  if (budget.systemTokens) {
    segments.push({ key: 'system', label: 'System', tokens: budget.systemTokens, cssVar: 'var(--an-budget-system)' });
  }
  segments.push({ key: 'input', label: 'Input', tokens: budget.inputTokens, cssVar: 'var(--an-budget-input)' });
  segments.push({ key: 'output', label: 'Output', tokens: budget.outputTokens, cssVar: 'var(--an-budget-output)' });
  const cacheTokens = (budget.cacheReadTokens ?? 0) + (budget.cacheWriteTokens ?? 0);
  if (cacheTokens > 0) {
    segments.push({ key: 'cache', label: 'Cache', tokens: cacheTokens, cssVar: 'var(--an-budget-cache)' });
  }
  return segments;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function BarLayout({
  budget,
  segments,
  usedTokens,
  showLabels,
  showPercentages,
  thresholdLevel,
  classNames,
}: {
  budget: ContextBudgetData;
  segments: Segment[];
  usedTokens: number;
  showLabels: boolean;
  showPercentages: boolean;
  thresholdLevel: 'normal' | 'warning' | 'danger';
  classNames?: ContextBudgetClassNames;
}) {
  const remaining = Math.max(0, budget.maxTokens - usedTokens);

  return (
    <>
      <div
        className={cn(
          'an-context-budget__bar',
          `an-context-budget__bar--${thresholdLevel}`,
          classNames?.bar,
        )}
        role="meter"
        aria-valuenow={usedTokens}
        aria-valuemin={0}
        aria-valuemax={budget.maxTokens}
        aria-label={`Context budget: ${formatTokens(usedTokens)} of ${formatTokens(budget.maxTokens)} tokens used`}
      >
        {segments.map((seg) => {
          const pct = budget.maxTokens > 0 ? (seg.tokens / budget.maxTokens) * 100 : 0;
          return (
            <div
              key={seg.key}
              className={cn(
                'an-context-budget__segment',
                `an-context-budget__segment--${seg.key}`,
                classNames?.segment,
              )}
              style={{ width: `${pct}%`, backgroundColor: seg.cssVar }}
              data-segment={seg.key}
            >
              {showLabels && pct > 8 && (
                <span className={cn('an-context-budget__label', classNames?.label)}>
                  {seg.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={cn('an-context-budget__legend', classNames?.legend)}>
        {segments.map((seg) => {
          const pct = budget.maxTokens > 0 ? ((seg.tokens / budget.maxTokens) * 100).toFixed(1) : '0';
          return (
            <div key={seg.key} className="an-context-budget__legend-item">
              <span className="an-context-budget__legend-dot" style={{ backgroundColor: seg.cssVar }} />
              <span className="an-context-budget__legend-label">
                {seg.label}
              </span>
              <span className="an-context-budget__legend-value">
                {formatTokens(seg.tokens)}
                {showPercentages && ` (${pct}%)`}
              </span>
            </div>
          );
        })}
        <div className="an-context-budget__legend-item">
          <span
            className="an-context-budget__legend-dot an-context-budget__legend-dot--remaining"
          />
          <span className={cn('an-context-budget__legend-label', classNames?.remaining)}>
            Remaining
          </span>
          <span className="an-context-budget__legend-value">
            {formatTokens(remaining)}
            {showPercentages && ` (${budget.maxTokens > 0 ? ((remaining / budget.maxTokens) * 100).toFixed(1) : '0'}%)`}
          </span>
        </div>
      </div>
    </>
  );
}

function RingLayout({
  budget,
  segments,
  usedTokens,
  showPercentages,
  thresholdLevel,
  classNames,
}: {
  budget: ContextBudgetData;
  segments: Segment[];
  usedTokens: number;
  showPercentages: boolean;
  thresholdLevel: 'normal' | 'warning' | 'danger';
  classNames?: ContextBudgetClassNames;
}) {
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const usedPct = budget.maxTokens > 0 ? (usedTokens / budget.maxTokens) * 100 : 0;

  return (
    <div className="an-context-budget__ring-wrapper">
      <svg
        className={cn('an-context-budget__ring', classNames?.bar)}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="meter"
        aria-valuenow={usedTokens}
        aria-valuemin={0}
        aria-valuemax={budget.maxTokens}
        aria-label={`Context budget: ${formatTokens(usedTokens)} of ${formatTokens(budget.maxTokens)} tokens used`}
      >
        {/* Background circle */}
        <circle
          className="an-context-budget__ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((seg) => {
          const pct = budget.maxTokens > 0 ? seg.tokens / budget.maxTokens : 0;
          const dashLength = circumference * pct;
          const dashOffset = circumference * (1 - cumulativeOffset) - circumference * 0.25;
          cumulativeOffset += pct;

          return (
            <circle
              key={seg.key}
              className={cn(
                'an-context-budget__ring-segment',
                `an-context-budget__ring-segment--${seg.key}`,
                classNames?.segment,
              )}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              stroke={seg.cssVar}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              data-segment={seg.key}
            />
          );
        })}
      </svg>
      <div className={cn('an-context-budget__ring-center', `an-context-budget__ring-center--${thresholdLevel}`)}>
        <span className="an-context-budget__ring-pct">{Math.round(usedPct)}%</span>
        {showPercentages && (
          <span className="an-context-budget__ring-label">used</span>
        )}
      </div>
    </div>
  );
}

export function ContextBudget({
  budget,
  showLabels = true,
  showPercentages = true,
  layout = 'bar',
  warningThreshold = 0.8,
  dangerThreshold = 0.95,
  onThresholdReached,
  className,
  classNames,
}: ContextBudgetProps) {
  const segments = buildSegments(budget);
  const usedTokens = segments.reduce((sum, s) => sum + s.tokens, 0);
  const usageFraction = budget.maxTokens > 0 ? usedTokens / budget.maxTokens : 0;

  const thresholdLevel: 'normal' | 'warning' | 'danger' =
    usageFraction >= dangerThreshold ? 'danger' : usageFraction >= warningThreshold ? 'warning' : 'normal';

  const prevLevel = useRef<'normal' | 'warning' | 'danger'>('normal');
  useEffect(() => {
    if (thresholdLevel !== prevLevel.current) {
      if (thresholdLevel === 'warning' || thresholdLevel === 'danger') {
        onThresholdReached?.(thresholdLevel);
      }
      prevLevel.current = thresholdLevel;
    }
  }, [thresholdLevel, onThresholdReached]);

  return (
    <div
      className={cn(
        'an-context-budget',
        `an-context-budget--${layout}`,
        `an-context-budget--${thresholdLevel}`,
        className,
        classNames?.root,
      )}
      data-layout={layout}
      data-threshold={thresholdLevel}
    >
      {layout === 'bar' ? (
        <BarLayout
          budget={budget}
          segments={segments}
          usedTokens={usedTokens}
          showLabels={showLabels}
          showPercentages={showPercentages}
          thresholdLevel={thresholdLevel}
          classNames={classNames}
        />
      ) : (
        <RingLayout
          budget={budget}
          segments={segments}
          usedTokens={usedTokens}
          showPercentages={showPercentages}
          thresholdLevel={thresholdLevel}
          classNames={classNames}
        />
      )}
    </div>
  );
}
