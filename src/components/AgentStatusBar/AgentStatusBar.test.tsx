import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentStatusBar } from './AgentStatusBar';
import type { TokenUsage, CostBreakdown } from '../../types';

describe('AgentStatusBar', () => {
  it('renders with status', () => {
    const { container } = render(<AgentStatusBar status="idle" />);
    expect(container.querySelector('.an-status-bar')).toBeInTheDocument();
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('applies data-status attribute', () => {
    const { container } = render(<AgentStatusBar status="thinking" />);
    expect(container.firstChild).toHaveAttribute('data-status', 'thinking');
  });

  it('has role="status" and aria-live="polite"', () => {
    const { container } = render(<AgentStatusBar status="idle" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('renders correct status label for each status', () => {
    const statuses = ['idle', 'thinking', 'acting', 'waiting', 'error', 'complete'] as const;
    const labels = ['Idle', 'Thinking', 'Acting', 'Waiting', 'Error', 'Complete'];

    statuses.forEach((status, i) => {
      const { unmount } = render(<AgentStatusBar status={status} />);
      expect(screen.getByText(labels[i])).toBeInTheDocument();
      unmount();
    });
  });

  it('applies status-specific dot class', () => {
    const { container } = render(<AgentStatusBar status="error" />);
    const dot = container.querySelector('.an-status-bar__dot');
    expect(dot).toHaveClass('an-status-bar__dot--error');
  });

  it('applies pulsing class to thinking/acting/waiting', () => {
    (['thinking', 'acting', 'waiting'] as const).forEach((status) => {
      const { container, unmount } = render(<AgentStatusBar status={status} />);
      expect(container.querySelector('.an-status-bar__dot')).toHaveClass('an-status-bar__dot--pulsing');
      unmount();
    });
  });

  it('does not pulse for idle/error/complete', () => {
    (['idle', 'error', 'complete'] as const).forEach((status) => {
      const { container, unmount } = render(<AgentStatusBar status={status} />);
      expect(container.querySelector('.an-status-bar__dot')).not.toHaveClass('an-status-bar__dot--pulsing');
      unmount();
    });
  });

  it('renders token usage', () => {
    const usage: TokenUsage = { inputTokens: 1234, outputTokens: 567 };
    render(<AgentStatusBar status="complete" tokenUsage={usage} />);
    expect(screen.getByText('1,234 in / 567 out')).toBeInTheDocument();
  });

  it('renders elapsed time from number (seconds)', () => {
    render(<AgentStatusBar status="thinking" elapsed={95} />);
    expect(screen.getByText('1m 35s')).toBeInTheDocument();
  });

  it('renders elapsed time from string', () => {
    render(<AgentStatusBar status="thinking" elapsed="2m 10s" />);
    expect(screen.getByText('2m 10s')).toBeInTheDocument();
  });

  it('formats seconds-only elapsed', () => {
    render(<AgentStatusBar status="thinking" elapsed={45} />);
    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('renders cost from number', () => {
    render(<AgentStatusBar status="complete" cost={0.0023} />);
    expect(screen.getByText('$0.0023')).toBeInTheDocument();
  });

  it('renders cost from CostBreakdown', () => {
    const breakdown: CostBreakdown = {
      totalCost: 1.25,
      model: 'claude-sonnet-4-20250514',
      tokenUsage: { inputTokens: 1000, outputTokens: 500 },
    };
    render(<AgentStatusBar status="complete" cost={breakdown} />);
    expect(screen.getByText('$1.25')).toBeInTheDocument();
  });

  it('renders model name', () => {
    render(<AgentStatusBar status="thinking" model="claude-sonnet-4-20250514" />);
    expect(screen.getByText('claude-sonnet-4-20250514')).toBeInTheDocument();
  });

  it('only renders sections with data', () => {
    const { container } = render(<AgentStatusBar status="idle" />);
    // No dividers when only status
    expect(container.querySelectorAll('.an-status-bar__divider')).toHaveLength(0);
    expect(container.querySelector('.an-status-bar__tokens')).not.toBeInTheDocument();
    expect(container.querySelector('.an-status-bar__elapsed')).not.toBeInTheDocument();
    expect(container.querySelector('.an-status-bar__cost')).not.toBeInTheDocument();
    expect(container.querySelector('.an-status-bar__model')).not.toBeInTheDocument();
  });

  it('renders dividers between sections', () => {
    const { container } = render(
      <AgentStatusBar
        status="thinking"
        tokenUsage={{ inputTokens: 100, outputTokens: 50 }}
        elapsed={30}
        cost={0.01}
        model="gpt-4"
      />,
    );
    // 4 sections with data besides status = 4 dividers
    expect(container.querySelectorAll('.an-status-bar__divider')).toHaveLength(4);
  });

  it('fires onStatusClick callback', () => {
    const onClick = vi.fn();
    render(<AgentStatusBar status="error" onStatusClick={onClick} />);

    const statusEl = document.querySelector('.an-status-bar__status')!;
    expect(statusEl).toHaveAttribute('role', 'button');
    expect(statusEl).toHaveAttribute('tabindex', '0');

    fireEvent.click(statusEl);
    expect(onClick).toHaveBeenCalledWith('error');
  });

  it('handles keyboard interaction on status click', () => {
    const onClick = vi.fn();
    render(<AgentStatusBar status="thinking" onStatusClick={onClick} />);

    const statusEl = document.querySelector('.an-status-bar__status')!;

    fireEvent.keyDown(statusEl, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(statusEl, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('does not make status clickable without onStatusClick', () => {
    render(<AgentStatusBar status="idle" />);
    const statusEl = document.querySelector('.an-status-bar__status')!;
    expect(statusEl).not.toHaveAttribute('role');
    expect(statusEl).not.toHaveAttribute('tabindex');
  });

  it('applies className to root', () => {
    const { container } = render(
      <AgentStatusBar status="idle" className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('an-status-bar', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <AgentStatusBar
        status="thinking"
        tokenUsage={{ inputTokens: 100, outputTokens: 50 }}
        classNames={{
          root: 'custom-root',
          status: 'custom-status',
          statusDot: 'custom-dot',
          statusLabel: 'custom-label',
          tokens: 'custom-tokens',
          divider: 'custom-divider',
        }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-status-bar__status')).toHaveClass('custom-status');
    expect(container.querySelector('.an-status-bar__dot')).toHaveClass('custom-dot');
    expect(container.querySelector('.an-status-bar__status-label')).toHaveClass('custom-label');
    expect(container.querySelector('.an-status-bar__tokens')).toHaveClass('custom-tokens');
  });

  it('each section has aria-label', () => {
    render(
      <AgentStatusBar
        status="thinking"
        tokenUsage={{ inputTokens: 1234, outputTokens: 567 }}
        elapsed={95}
        cost={0.05}
        model="claude-sonnet"
      />,
    );

    expect(document.querySelector('.an-status-bar__status')).toHaveAttribute('aria-label', 'Status: Thinking');
    expect(document.querySelector('.an-status-bar__tokens')).toHaveAttribute('aria-label', 'Tokens: 1,234 in / 567 out');
    expect(document.querySelector('.an-status-bar__elapsed')).toHaveAttribute('aria-label', 'Elapsed: 1m 35s');
    expect(document.querySelector('.an-status-bar__cost')).toHaveAttribute('aria-label', 'Cost: $0.05');
    expect(document.querySelector('.an-status-bar__model')).toHaveAttribute('aria-label', 'Model: claude-sonnet');
  });
});
