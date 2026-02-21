import { cn } from '../../utils/cn';
import type { CostEntry } from '../../types';

export interface CostTrackerClassNames {
  root?: string;
  summary?: string;
  summaryTotal?: string;
  summaryModel?: string;
  table?: string;
  tableHeader?: string;
  tableRow?: string;
  tableCell?: string;
}

export interface CostTrackerProps {
  /** API call cost entries. */
  entries: CostEntry[];
  /** Currency symbol. Default: '$'. */
  currency?: string;
  /** Show per-call breakdown table. Default: true. */
  showTable?: boolean;
  /** Show aggregated summary. Default: true. */
  showSummary?: boolean;
  /** Group entries by model. Default: 'model'. */
  groupBy?: 'model' | 'none';
  /** Max height for scrollable table. */
  maxHeight?: number | string;
  /** Callback when a table row is clicked. */
  onEntryClick?: (entry: CostEntry) => void;
  className?: string;
  classNames?: CostTrackerClassNames;
}

function formatCost(cost: number, currency: string): string {
  if (cost < 0.01) return `${currency}${cost.toFixed(4)}`;
  return `${currency}${cost.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface ModelSummary {
  model: string;
  totalCost: number;
  totalInput: number;
  totalOutput: number;
  count: number;
}

function summarizeByModel(entries: CostEntry[]): ModelSummary[] {
  const map = new Map<string, ModelSummary>();
  for (const e of entries) {
    const existing = map.get(e.model);
    if (existing) {
      existing.totalCost += e.cost;
      existing.totalInput += e.inputTokens;
      existing.totalOutput += e.outputTokens;
      existing.count += 1;
    } else {
      map.set(e.model, {
        model: e.model,
        totalCost: e.cost,
        totalInput: e.inputTokens,
        totalOutput: e.outputTokens,
        count: 1,
      });
    }
  }
  return Array.from(map.values());
}

export function CostTracker({
  entries,
  currency = '$',
  showTable = true,
  showSummary = true,
  groupBy = 'model',
  maxHeight,
  onEntryClick,
  className,
  classNames,
}: CostTrackerProps) {
  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
  const modelSummaries = summarizeByModel(entries);
  const isClickable = !!onEntryClick;

  // Group entries for table
  const groupedEntries: { model: string; entries: CostEntry[] }[] = [];
  if (groupBy === 'model') {
    const map = new Map<string, CostEntry[]>();
    for (const e of entries) {
      const group = map.get(e.model) ?? [];
      group.push(e);
      map.set(e.model, group);
    }
    for (const [model, items] of map) {
      groupedEntries.push({ model, entries: items });
    }
  } else {
    groupedEntries.push({ model: '', entries });
  }

  return (
    <div
      className={cn('an-cost-tracker', className, classNames?.root)}
      data-group-by={groupBy}
    >
      {showSummary && (
        <div className={cn('an-cost-tracker__summary', classNames?.summary)} aria-label="Cost summary">
          <div className={cn('an-cost-tracker__summary-total', classNames?.summaryTotal)}>
            {formatCost(totalCost, currency)}
          </div>
          <div className="an-cost-tracker__summary-models">
            {modelSummaries.map((ms) => (
              <span
                key={ms.model}
                className={cn('an-cost-tracker__summary-model', classNames?.summaryModel)}
              >
                {ms.model}: {formatCost(ms.totalCost, currency)} ({ms.count} call{ms.count !== 1 ? 's' : ''})
              </span>
            ))}
          </div>
        </div>
      )}

      {showTable && entries.length > 0 && (
        <div
          className={cn('an-cost-tracker__table-wrap', classNames?.table)}
          style={maxHeight ? { maxHeight, overflow: 'auto' } : undefined}
        >
          <table className="an-cost-tracker__table" role="table">
            <thead>
              <tr className={cn('an-cost-tracker__table-header', classNames?.tableHeader)} role="row">
                {groupBy !== 'model' && <th role="columnheader">Model</th>}
                <th role="columnheader">Label</th>
                <th role="columnheader">Input</th>
                <th role="columnheader">Output</th>
                <th role="columnheader">Cost</th>
                <th role="columnheader">Time</th>
              </tr>
            </thead>
            <tbody>
              {groupedEntries.map((group) => (
                <GroupRows
                  key={group.model || 'all'}
                  group={group}
                  groupBy={groupBy}
                  currency={currency}
                  isClickable={isClickable}
                  onEntryClick={onEntryClick}
                  classNames={classNames}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="an-cost-tracker__table-total" role="row">
                <td
                  className={cn('an-cost-tracker__cell', classNames?.tableCell)}
                  colSpan={groupBy !== 'model' ? 4 : 3}
                  role="cell"
                >
                  Total
                </td>
                <td className={cn('an-cost-tracker__cell an-cost-tracker__cell--cost', classNames?.tableCell)} role="cell">
                  {formatCost(totalCost, currency)}
                </td>
                <td className={cn('an-cost-tracker__cell', classNames?.tableCell)} role="cell" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function GroupRows({
  group,
  groupBy,
  currency,
  isClickable,
  onEntryClick,
  classNames,
}: {
  group: { model: string; entries: CostEntry[] };
  groupBy: 'model' | 'none';
  currency: string;
  isClickable: boolean;
  onEntryClick?: (entry: CostEntry) => void;
  classNames?: CostTrackerClassNames;
}) {
  const colCount = groupBy !== 'model' ? 6 : 5;

  return (
    <>
      {groupBy === 'model' && (
        <tr className="an-cost-tracker__group-header" role="row">
          <td colSpan={colCount} role="cell" className="an-cost-tracker__group-label">
            {group.model}
          </td>
        </tr>
      )}
      {group.entries.map((entry) => (
        <tr
          key={entry.id}
          className={cn(
            'an-cost-tracker__row',
            isClickable && 'an-cost-tracker__row--clickable',
            classNames?.tableRow,
          )}
          role="row"
          onClick={isClickable ? () => onEntryClick!(entry) : undefined}
          onKeyDown={
            isClickable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEntryClick!(entry);
                  }
                }
              : undefined
          }
          tabIndex={isClickable ? 0 : undefined}
          data-entry-id={entry.id}
        >
          {groupBy !== 'model' && (
            <td className={cn('an-cost-tracker__cell', classNames?.tableCell)} role="cell">
              {entry.model}
            </td>
          )}
          <td className={cn('an-cost-tracker__cell', classNames?.tableCell)} role="cell">
            {entry.label ?? '—'}
          </td>
          <td className={cn('an-cost-tracker__cell an-cost-tracker__cell--tokens', classNames?.tableCell)} role="cell">
            {formatTokens(entry.inputTokens)}
          </td>
          <td className={cn('an-cost-tracker__cell an-cost-tracker__cell--tokens', classNames?.tableCell)} role="cell">
            {formatTokens(entry.outputTokens)}
          </td>
          <td className={cn('an-cost-tracker__cell an-cost-tracker__cell--cost', classNames?.tableCell)} role="cell">
            {formatCost(entry.cost, currency)}
          </td>
          <td className={cn('an-cost-tracker__cell an-cost-tracker__cell--time', classNames?.tableCell)} role="cell">
            {formatTime(entry.timestamp)}
          </td>
        </tr>
      ))}
    </>
  );
}
