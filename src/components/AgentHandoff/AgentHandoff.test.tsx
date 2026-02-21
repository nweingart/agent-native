import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AgentHandoff } from './AgentHandoff';
import type { SubAgent, HandoffEvent } from '../../types';

const sampleAgents: SubAgent[] = [
  { id: 'planner', name: 'Planner', status: 'complete', task: 'Decompose task' },
  { id: 'coder', name: 'Coder', status: 'running', task: 'Implement changes' },
  { id: 'reviewer', name: 'Reviewer', status: 'idle', task: 'Review code' },
];

const sampleHandoffs: HandoffEvent[] = [
  { id: 'h1', fromAgentId: 'planner', toAgentId: 'coder', task: 'implement auth', timestamp: 1000 },
  { id: 'h2', fromAgentId: 'coder', toAgentId: 'reviewer', task: 'review PR', timestamp: 2000 },
];

describe('AgentHandoff', () => {
  it('renders with role="list"', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    expect(container.querySelector('[role="list"]')).toBeInTheDocument();
  });

  it('renders all agent cards', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    const cards = container.querySelectorAll('.an-agent-handoff__agent');
    expect(cards).toHaveLength(3);
  });

  it('renders agent names', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    const names = container.querySelectorAll('.an-agent-handoff__agent-name');
    expect(names[0]?.textContent).toBe('Planner');
    expect(names[1]?.textContent).toBe('Coder');
    expect(names[2]?.textContent).toBe('Reviewer');
  });

  it('renders agent tasks', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    const tasks = container.querySelectorAll('.an-agent-handoff__agent-task');
    expect(tasks[0]?.textContent).toBe('Decompose task');
  });

  it('renders status dots with correct classes', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    expect(container.querySelector('.an-agent-handoff__dot--complete')).toBeInTheDocument();
    expect(container.querySelector('.an-agent-handoff__dot--running')).toBeInTheDocument();
    expect(container.querySelector('.an-agent-handoff__dot--idle')).toBeInTheDocument();
  });

  it('pulses running agents', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    expect(container.querySelector('.an-agent-handoff__dot--pulsing')).toBeInTheDocument();
  });

  it('highlights active agent', () => {
    const { container } = render(
      <AgentHandoff agents={sampleAgents} activeAgentId="coder" />,
    );
    const active = container.querySelector('.an-agent-handoff__agent--active');
    expect(active).toBeInTheDocument();
    expect(active).toHaveAttribute('aria-current', 'true');
    expect(active).toHaveAttribute('data-agent-id', 'coder');
  });

  it('renders handoff arrows between agents', () => {
    const { container } = render(
      <AgentHandoff agents={sampleAgents} handoffs={sampleHandoffs} />,
    );
    const arrows = container.querySelectorAll('.an-agent-handoff__arrow');
    expect(arrows).toHaveLength(2);
  });

  it('renders handoff task labels', () => {
    const { container } = render(
      <AgentHandoff agents={sampleAgents} handoffs={sampleHandoffs} />,
    );
    const labels = container.querySelectorAll('.an-agent-handoff__arrow-label');
    expect(labels[0]?.textContent).toBe('implement auth');
    expect(labels[1]?.textContent).toBe('review PR');
  });

  it('defaults to vertical layout', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    expect(container.firstChild).toHaveClass('an-agent-handoff--vertical');
    expect(container.firstChild).toHaveAttribute('data-layout', 'vertical');
  });

  it('renders horizontal layout', () => {
    const { container } = render(
      <AgentHandoff agents={sampleAgents} layout="horizontal" />,
    );
    expect(container.firstChild).toHaveClass('an-agent-handoff--horizontal');
    expect(container.firstChild).toHaveAttribute('data-layout', 'horizontal');
  });

  it('renders arrows with correct direction class', () => {
    const { container } = render(
      <AgentHandoff agents={sampleAgents} handoffs={sampleHandoffs} layout="horizontal" />,
    );
    expect(container.querySelector('.an-agent-handoff__arrow--horizontal')).toBeInTheDocument();
  });

  it('fires onAgentClick callback', () => {
    const onClick = vi.fn();
    const { container } = render(
      <AgentHandoff agents={sampleAgents} onAgentClick={onClick} />,
    );
    const cards = container.querySelectorAll('.an-agent-handoff__agent');
    fireEvent.click(cards[1]);
    expect(onClick).toHaveBeenCalledWith(sampleAgents[1]);
  });

  it('makes clickable agents keyboard accessible', () => {
    const onClick = vi.fn();
    const { container } = render(
      <AgentHandoff agents={sampleAgents} onAgentClick={onClick} />,
    );
    const card = container.querySelector('.an-agent-handoff__agent') as HTMLElement;
    expect(card).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('does not make cards clickable without onAgentClick', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    const card = container.querySelector('.an-agent-handoff__agent');
    expect(card).not.toHaveAttribute('tabindex');
  });

  it('shows steps when showSteps is true', () => {
    const agentsWithSteps: SubAgent[] = [
      {
        id: 'coder',
        name: 'Coder',
        status: 'running',
        steps: [
          { id: 's1', label: 'Read file', status: 'complete' },
          { id: 's2', label: 'Edit file', status: 'running' },
        ],
      },
    ];
    const { container } = render(
      <AgentHandoff agents={agentsWithSteps} showSteps />,
    );
    const steps = container.querySelectorAll('.an-agent-handoff__step');
    expect(steps).toHaveLength(2);
    expect(container.querySelector('.an-agent-handoff__step-label')?.textContent).toBe('Read file');
  });

  it('hides steps by default', () => {
    const agentsWithSteps: SubAgent[] = [
      {
        id: 'coder',
        name: 'Coder',
        status: 'running',
        steps: [{ id: 's1', label: 'Read file', status: 'complete' }],
      },
    ];
    const { container } = render(<AgentHandoff agents={agentsWithSteps} />);
    expect(container.querySelector('.an-agent-handoff__steps')).not.toBeInTheDocument();
  });

  it('applies status-specific card classes', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    const cards = container.querySelectorAll('.an-agent-handoff__agent');
    expect(cards[0]).toHaveClass('an-agent-handoff__agent--complete');
    expect(cards[1]).toHaveClass('an-agent-handoff__agent--running');
    expect(cards[2]).toHaveClass('an-agent-handoff__agent--idle');
  });

  it('applies className to root', () => {
    const { container } = render(
      <AgentHandoff agents={sampleAgents} className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('an-agent-handoff', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <AgentHandoff
        agents={sampleAgents}
        classNames={{
          root: 'custom-root',
          agent: 'custom-agent',
          agentHeader: 'custom-header',
          agentName: 'custom-name',
          agentStatus: 'custom-status',
          agentTask: 'custom-task',
        }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-agent-handoff__agent')).toHaveClass('custom-agent');
    expect(container.querySelector('.an-agent-handoff__agent-header')).toHaveClass('custom-header');
    expect(container.querySelector('.an-agent-handoff__agent-name')).toHaveClass('custom-name');
    expect(container.querySelector('.an-agent-handoff__agent-status')).toHaveClass('custom-status');
    expect(container.querySelector('.an-agent-handoff__agent-task')).toHaveClass('custom-task');
  });

  it('renders empty agents without crashing', () => {
    const { container } = render(<AgentHandoff agents={[]} />);
    expect(container.querySelector('.an-agent-handoff')).toBeInTheDocument();
  });

  it('renders without handoffs', () => {
    const { container } = render(<AgentHandoff agents={sampleAgents} />);
    expect(container.querySelectorAll('.an-agent-handoff__arrow')).toHaveLength(0);
  });
});
