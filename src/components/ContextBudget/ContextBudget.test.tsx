import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ContextBudget } from './ContextBudget';
import type { ContextBudgetData } from '../../types';

const sampleBudget: ContextBudgetData = {
  maxTokens: 200000,
  inputTokens: 50000,
  outputTokens: 30000,
  systemTokens: 10000,
  cacheReadTokens: 5000,
  cacheWriteTokens: 5000,
};

describe('ContextBudget', () => {
  it('renders with bar layout by default', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} />);
    expect(container.firstChild).toHaveClass('an-context-budget--bar');
    expect(container.firstChild).toHaveAttribute('data-layout', 'bar');
  });

  it('renders with ring layout', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} layout="ring" />);
    expect(container.firstChild).toHaveClass('an-context-budget--ring');
    expect(container.firstChild).toHaveAttribute('data-layout', 'ring');
  });

  it('renders bar with role="meter"', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} />);
    const meter = container.querySelector('[role="meter"]');
    expect(meter).toBeInTheDocument();
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '200000');
  });

  it('renders ring with role="meter"', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} layout="ring" />);
    const meter = container.querySelector('[role="meter"]');
    expect(meter).toBeInTheDocument();
  });

  it('renders all segment types', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} />);
    expect(container.querySelector('[data-segment="system"]')).toBeInTheDocument();
    expect(container.querySelector('[data-segment="input"]')).toBeInTheDocument();
    expect(container.querySelector('[data-segment="output"]')).toBeInTheDocument();
    expect(container.querySelector('[data-segment="cache"]')).toBeInTheDocument();
  });

  it('omits system segment when not provided', () => {
    const budget: ContextBudgetData = {
      maxTokens: 100000,
      inputTokens: 20000,
      outputTokens: 10000,
    };
    const { container } = render(<ContextBudget budget={budget} />);
    expect(container.querySelector('[data-segment="system"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-segment="cache"]')).not.toBeInTheDocument();
  });

  it('renders legend items', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} />);
    const legendItems = container.querySelectorAll('.an-context-budget__legend-item');
    // system + input + output + cache + remaining = 5
    expect(legendItems).toHaveLength(5);
  });

  it('shows percentages by default', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} />);
    const values = container.querySelectorAll('.an-context-budget__legend-value');
    const text = values[0]?.textContent ?? '';
    expect(text).toContain('%');
  });

  it('hides percentages when showPercentages is false', () => {
    const { container } = render(
      <ContextBudget budget={sampleBudget} showPercentages={false} />,
    );
    const values = container.querySelectorAll('.an-context-budget__legend-value');
    const text = values[0]?.textContent ?? '';
    expect(text).not.toContain('%');
  });

  it('applies normal threshold by default', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} />);
    expect(container.firstChild).toHaveAttribute('data-threshold', 'normal');
    expect(container.firstChild).toHaveClass('an-context-budget--normal');
  });

  it('applies warning threshold when usage exceeds warningThreshold', () => {
    const budget: ContextBudgetData = {
      maxTokens: 100000,
      inputTokens: 85000,
      outputTokens: 0,
    };
    const { container } = render(<ContextBudget budget={budget} />);
    expect(container.firstChild).toHaveAttribute('data-threshold', 'warning');
  });

  it('applies danger threshold when usage exceeds dangerThreshold', () => {
    const budget: ContextBudgetData = {
      maxTokens: 100000,
      inputTokens: 96000,
      outputTokens: 0,
    };
    const { container } = render(<ContextBudget budget={budget} />);
    expect(container.firstChild).toHaveAttribute('data-threshold', 'danger');
  });

  it('fires onThresholdReached when threshold changes', () => {
    const onThresholdReached = vi.fn();
    const normalBudget: ContextBudgetData = {
      maxTokens: 100000,
      inputTokens: 50000,
      outputTokens: 0,
    };
    const warningBudget: ContextBudgetData = {
      maxTokens: 100000,
      inputTokens: 85000,
      outputTokens: 0,
    };
    const { rerender } = render(
      <ContextBudget budget={normalBudget} onThresholdReached={onThresholdReached} />,
    );
    expect(onThresholdReached).not.toHaveBeenCalled();

    rerender(
      <ContextBudget budget={warningBudget} onThresholdReached={onThresholdReached} />,
    );
    expect(onThresholdReached).toHaveBeenCalledWith('warning');
  });

  it('applies className to root', () => {
    const { container } = render(
      <ContextBudget budget={sampleBudget} className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('an-context-budget', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <ContextBudget
        budget={sampleBudget}
        classNames={{
          root: 'custom-root',
          bar: 'custom-bar',
          segment: 'custom-segment',
          legend: 'custom-legend',
        }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-context-budget__bar')).toHaveClass('custom-bar');
    expect(container.querySelector('.an-context-budget__segment')).toHaveClass('custom-segment');
    expect(container.querySelector('.an-context-budget__legend')).toHaveClass('custom-legend');
  });

  it('renders ring center percentage', () => {
    const { container } = render(<ContextBudget budget={sampleBudget} layout="ring" />);
    const pct = container.querySelector('.an-context-budget__ring-pct');
    expect(pct).toBeInTheDocument();
    // (50k + 30k + 10k + 10k) / 200k = 50%
    expect(pct?.textContent).toBe('50%');
  });

  it('renders empty budget without crashing', () => {
    const budget: ContextBudgetData = {
      maxTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
    const { container } = render(<ContextBudget budget={budget} />);
    expect(container.querySelector('.an-context-budget')).toBeInTheDocument();
  });
});
