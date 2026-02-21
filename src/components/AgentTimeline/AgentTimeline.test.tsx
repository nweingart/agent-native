import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentTimeline } from './AgentTimeline';
import type { AgentStep, StepTier, ApprovalRequest } from '../../types';

const makeStep = (overrides: Partial<AgentStep> = {}): AgentStep => ({
  id: 'step-1',
  label: 'Test Step',
  status: 'pending',
  ...overrides,
});

const sampleSteps: AgentStep[] = [
  makeStep({ id: 's1', label: 'Initialize', status: 'complete', startedAt: 1000, completedAt: 2000 }),
  makeStep({ id: 's2', label: 'Analyze code', status: 'running', startedAt: 2000 }),
  makeStep({ id: 's3', label: 'Generate output', status: 'pending' }),
];

describe('AgentTimeline', () => {
  it('renders all steps', () => {
    render(<AgentTimeline steps={sampleSteps} />);

    expect(screen.getByText('Initialize')).toBeInTheDocument();
    expect(screen.getByText('Analyze code')).toBeInTheDocument();
    expect(screen.getByText('Generate output')).toBeInTheDocument();
  });

  it('applies correct status CSS classes', () => {
    render(<AgentTimeline steps={sampleSteps} />);

    const steps = document.querySelectorAll('.an-timeline__step');
    expect(steps[0]).toHaveClass('an-timeline__step--complete');
    expect(steps[1]).toHaveClass('an-timeline__step--running');
    expect(steps[2]).toHaveClass('an-timeline__step--pending');
  });

  it('applies data-status attribute', () => {
    render(<AgentTimeline steps={sampleSteps} />);

    const steps = document.querySelectorAll('[data-step-id]');
    expect(steps[0]).toHaveAttribute('data-status', 'complete');
    expect(steps[1]).toHaveAttribute('data-status', 'running');
    expect(steps[2]).toHaveAttribute('data-status', 'pending');
  });

  it('handles tier grouping', () => {
    const tierSteps: AgentStep[] = [
      makeStep({ id: 't1', label: 'Step A', status: 'running' }),
      makeStep({ id: 't2', label: 'Step B', status: 'running' }),
      makeStep({ id: 't3', label: 'Final step', status: 'pending' }),
    ];
    const tiers: StepTier[] = [
      { id: 'tier-1', label: 'Parallel tasks', stepIds: ['t1', 't2'] },
    ];

    render(<AgentTimeline steps={tierSteps} tiers={tiers} />);

    expect(screen.getByText('Parallel tasks')).toBeInTheDocument();
    expect(screen.getByText('2 parallel')).toBeInTheDocument();
    expect(screen.getByText('Step A')).toBeInTheDocument();
    expect(screen.getByText('Step B')).toBeInTheDocument();
    expect(screen.getByText('Final step')).toBeInTheDocument();
  });

  it('fires onStepClick callback', () => {
    const onClick = vi.fn();
    render(<AgentTimeline steps={sampleSteps} onStepClick={onClick} />);

    fireEvent.click(screen.getByText('Initialize'));
    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's1', label: 'Initialize' }),
    );
  });

  it('passes className through', () => {
    const { container } = render(
      <AgentTimeline steps={sampleSteps} className="my-custom-class" />,
    );

    expect(container.firstChild).toHaveClass('an-timeline', 'my-custom-class');
  });

  it('passes stepClassName to each step', () => {
    render(<AgentTimeline steps={sampleSteps} stepClassName="custom-step" />);

    const steps = document.querySelectorAll('.an-timeline__step');
    steps.forEach((step) => {
      expect(step).toHaveClass('custom-step');
    });
  });

  it('shows elapsed time when enabled', () => {
    const steps: AgentStep[] = [
      makeStep({
        id: 's1',
        label: 'Running step',
        status: 'complete',
        startedAt: Date.now() - 5000,
        completedAt: Date.now(),
      }),
    ];

    render(<AgentTimeline steps={steps} showElapsedTime />);
    const elapsed = document.querySelector('.an-timeline__step-elapsed');
    expect(elapsed).toBeInTheDocument();
    expect(elapsed).not.toHaveClass('an-timeline__step-elapsed--hidden');
  });

  it('does not show elapsed time when disabled', () => {
    render(<AgentTimeline steps={sampleSteps} showElapsedTime={false} />);
    const elapsed = document.querySelector('.an-timeline__step-elapsed');
    // Element is always in the DOM but hidden via visibility/opacity
    expect(elapsed).toBeInTheDocument();
    expect(elapsed).toHaveClass('an-timeline__step-elapsed--hidden');
  });

  it('renders approval gate when present', () => {
    const approval: ApprovalRequest = {
      id: 'apr-1',
      stepId: 's2',
      title: 'Approve file write',
      description: 'The agent wants to write to config.json',
      createdAt: Date.now(),
    };
    const onApprove = vi.fn();
    const onReject = vi.fn();

    render(
      <AgentTimeline
        steps={sampleSteps}
        approvalRequest={approval}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    expect(screen.getByText('Approve file write')).toBeInTheDocument();
    expect(screen.getByText('The agent wants to write to config.json')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Approve'));
    expect(onApprove).toHaveBeenCalledWith(approval);

    fireEvent.click(screen.getByText('Reject'));
    expect(onReject).toHaveBeenCalledWith(approval);
  });

  it('handles empty steps array', () => {
    const { container } = render(<AgentTimeline steps={[]} />);
    expect(container.querySelector('.an-timeline')).toBeInTheDocument();
    expect(container.querySelectorAll('.an-timeline__step')).toHaveLength(0);
  });

  it('applies connector segment classes to steps by default', () => {
    render(<AgentTimeline steps={sampleSteps} />);
    const steps = document.querySelectorAll('.an-timeline__step');
    // 3 flat steps: first=below, middle=both, last=above
    expect(steps[0]).toHaveClass('an-timeline__step--connector-below');
    expect(steps[1]).toHaveClass('an-timeline__step--connector-both');
    expect(steps[2]).toHaveClass('an-timeline__step--connector-above');
  });

  it('hides connectors when showConnectors is false', () => {
    const { container } = render(<AgentTimeline steps={sampleSteps} showConnectors={false} />);
    // Root gets the --no-connectors class
    expect(container.firstChild).toHaveClass('an-timeline--no-connectors');
    // All steps get connector-none
    const steps = document.querySelectorAll('.an-timeline__step');
    steps.forEach((step) => {
      expect(step).toHaveClass('an-timeline__step--connector-none');
    });
  });

  it('marks active step', () => {
    render(<AgentTimeline steps={sampleSteps} activeStepId="s2" />);
    const activeStep = document.querySelector('[data-step-id="s2"]');
    expect(activeStep).toHaveClass('an-timeline__step--active');
  });

  it('shows step error message when status is error', () => {
    const steps: AgentStep[] = [
      makeStep({ id: 's1', label: 'Failed step', status: 'error', error: 'Something went wrong' }),
    ];

    render(<AgentTimeline steps={steps} />);
    const errorEl = screen.getByText('Something went wrong');
    expect(errorEl).toBeInTheDocument();
    // Error div should be visible (no --hidden class)
    expect(errorEl.closest('.an-timeline__step-error')).not.toHaveClass(
      'an-timeline__step-error--hidden',
    );
  });

  it('hides error div when status is not error', () => {
    const steps: AgentStep[] = [
      makeStep({ id: 's1', label: 'Running step', status: 'running', error: 'Stale error' }),
    ];

    render(<AgentTimeline steps={steps} />);
    const errorEl = document.querySelector('.an-timeline__step-error');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveClass('an-timeline__step-error--hidden');
  });

  it('uses custom renderStepContent', () => {
    render(
      <AgentTimeline
        steps={[makeStep({ id: 's1', label: 'Custom' })]}
        renderStepContent={(step) => <div data-testid="custom">{step.label} custom</div>}
      />,
    );

    expect(screen.getByTestId('custom')).toHaveTextContent('Custom custom');
  });

  it('applies failedStepIds override', () => {
    const steps: AgentStep[] = [
      makeStep({ id: 's1', label: 'Step 1', status: 'running' }),
    ];

    render(<AgentTimeline steps={steps} failedStepIds={['s1']} />);

    const step = document.querySelector('[data-step-id="s1"]');
    expect(step).toHaveAttribute('data-status', 'error');
  });

  it('makes steps clickable with keyboard', () => {
    const onClick = vi.fn();
    render(<AgentTimeline steps={[makeStep({ id: 's1', label: 'Keyboard step' })]} onStepClick={onClick} />);

    const step = document.querySelector('[data-step-id="s1"]')!;
    expect(step).toHaveAttribute('role', 'button');
    expect(step).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(step, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(step, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('single step has no connector lines', () => {
    render(<AgentTimeline steps={[makeStep({ id: 's1', label: 'Solo' })]} />);
    const step = document.querySelector('.an-timeline__step');
    expect(step).toHaveClass('an-timeline__step--connector-none');
  });
});
