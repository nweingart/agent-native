import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CostTracker } from './CostTracker';
import type { CostEntry } from '../../types';

const sampleEntries: CostEntry[] = [
  { id: '1', model: 'claude-sonnet', cost: 0.003, inputTokens: 1000, outputTokens: 500, timestamp: 1700000000000, label: 'Plan' },
  { id: '2', model: 'claude-sonnet', cost: 0.005, inputTokens: 2000, outputTokens: 800, timestamp: 1700000001000, label: 'Edit file' },
  { id: '3', model: 'claude-haiku', cost: 0.001, inputTokens: 500, outputTokens: 200, timestamp: 1700000002000, label: 'Lint' },
];

describe('CostTracker', () => {
  it('renders summary with total cost', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    const total = container.querySelector('.an-cost-tracker__summary-total');
    expect(total).toBeInTheDocument();
    expect(total?.textContent).toBe('$0.0090');
  });

  it('renders model pills in summary', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    const models = container.querySelectorAll('.an-cost-tracker__summary-model');
    expect(models).toHaveLength(2);
    expect(models[0]?.textContent).toContain('claude-sonnet');
    expect(models[1]?.textContent).toContain('claude-haiku');
  });

  it('renders table with role="table"', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    expect(container.querySelector('[role="table"]')).toBeInTheDocument();
  });

  it('renders all entry rows', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    const rows = container.querySelectorAll('.an-cost-tracker__row');
    expect(rows).toHaveLength(3);
  });

  it('renders group headers when groupBy="model"', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    const groupHeaders = container.querySelectorAll('.an-cost-tracker__group-header');
    expect(groupHeaders).toHaveLength(2);
    expect(groupHeaders[0]?.textContent).toBe('claude-sonnet');
    expect(groupHeaders[1]?.textContent).toBe('claude-haiku');
  });

  it('hides group headers when groupBy="none"', () => {
    const { container } = render(<CostTracker entries={sampleEntries} groupBy="none" />);
    expect(container.querySelector('.an-cost-tracker__group-header')).not.toBeInTheDocument();
  });

  it('renders entry labels', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    const rows = container.querySelectorAll('.an-cost-tracker__row');
    expect(rows[0]?.textContent).toContain('Plan');
    expect(rows[1]?.textContent).toContain('Edit file');
    expect(rows[2]?.textContent).toContain('Lint');
  });

  it('renders total row in footer', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    const totalRow = container.querySelector('.an-cost-tracker__table-total');
    expect(totalRow).toBeInTheDocument();
    expect(totalRow?.textContent).toContain('Total');
  });

  it('hides summary when showSummary is false', () => {
    const { container } = render(
      <CostTracker entries={sampleEntries} showSummary={false} />,
    );
    expect(container.querySelector('.an-cost-tracker__summary')).not.toBeInTheDocument();
  });

  it('hides table when showTable is false', () => {
    const { container } = render(
      <CostTracker entries={sampleEntries} showTable={false} />,
    );
    expect(container.querySelector('.an-cost-tracker__table')).not.toBeInTheDocument();
  });

  it('fires onEntryClick callback', () => {
    const onClick = vi.fn();
    const { container } = render(
      <CostTracker entries={sampleEntries} onEntryClick={onClick} />,
    );
    const rows = container.querySelectorAll('.an-cost-tracker__row');
    fireEvent.click(rows[0]);
    expect(onClick).toHaveBeenCalledWith(sampleEntries[0]);
  });

  it('makes clickable rows keyboard accessible', () => {
    const onClick = vi.fn();
    const { container } = render(
      <CostTracker entries={sampleEntries} onEntryClick={onClick} />,
    );
    const row = container.querySelector('.an-cost-tracker__row') as HTMLElement;
    expect(row).toHaveAttribute('tabindex', '0');
    expect(row).toHaveClass('an-cost-tracker__row--clickable');

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(row, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('does not make rows clickable without onEntryClick', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    const row = container.querySelector('.an-cost-tracker__row');
    expect(row).not.toHaveAttribute('tabindex');
    expect(row).not.toHaveClass('an-cost-tracker__row--clickable');
  });

  it('uses custom currency symbol', () => {
    const { container } = render(
      <CostTracker entries={sampleEntries} currency="€" />,
    );
    const total = container.querySelector('.an-cost-tracker__summary-total');
    expect(total?.textContent).toContain('€');
  });

  it('applies maxHeight as style', () => {
    const { container } = render(
      <CostTracker entries={sampleEntries} maxHeight={300} />,
    );
    const wrap = container.querySelector('.an-cost-tracker__table-wrap') as HTMLElement;
    expect(wrap.style.maxHeight).toBe('300px');
    expect(wrap.style.overflow).toBe('auto');
  });

  it('applies className to root', () => {
    const { container } = render(
      <CostTracker entries={sampleEntries} className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('an-cost-tracker', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <CostTracker
        entries={sampleEntries}
        classNames={{
          root: 'custom-root',
          summary: 'custom-summary',
          summaryTotal: 'custom-total',
          summaryModel: 'custom-model',
          table: 'custom-table',
          tableHeader: 'custom-header',
          tableRow: 'custom-row',
        }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-cost-tracker__summary')).toHaveClass('custom-summary');
    expect(container.querySelector('.an-cost-tracker__summary-total')).toHaveClass('custom-total');
    expect(container.querySelector('.an-cost-tracker__summary-model')).toHaveClass('custom-model');
    expect(container.querySelector('.an-cost-tracker__table-wrap')).toHaveClass('custom-table');
    expect(container.querySelector('.an-cost-tracker__table-header')).toHaveClass('custom-header');
    expect(container.querySelector('.an-cost-tracker__row')).toHaveClass('custom-row');
  });

  it('renders empty entries without crashing', () => {
    const { container } = render(<CostTracker entries={[]} />);
    expect(container.querySelector('.an-cost-tracker')).toBeInTheDocument();
    expect(container.querySelector('.an-cost-tracker__table')).not.toBeInTheDocument();
  });

  it('renders data-entry-id on rows', () => {
    const { container } = render(<CostTracker entries={sampleEntries} />);
    const rows = container.querySelectorAll('.an-cost-tracker__row');
    expect(rows[0]).toHaveAttribute('data-entry-id', '1');
    expect(rows[1]).toHaveAttribute('data-entry-id', '2');
    expect(rows[2]).toHaveAttribute('data-entry-id', '3');
  });
});
