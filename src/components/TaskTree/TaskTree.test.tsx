import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TaskTree } from './TaskTree';
import type { TaskNode } from '../../types';

const sampleTasks: TaskNode[] = [
  {
    id: '1',
    label: 'Refactor auth module',
    status: 'running',
    children: [
      {
        id: '1-1',
        label: 'Extract token service',
        status: 'complete',
        startedAt: 1000,
        completedAt: 5000,
      },
      {
        id: '1-2',
        label: 'Update middleware',
        status: 'running',
        children: [
          { id: '1-2-1', label: 'Parse JWT claims', status: 'complete' },
          { id: '1-2-2', label: 'Add rate limiting', status: 'pending' },
        ],
      },
    ],
  },
  {
    id: '2',
    label: 'Write tests',
    status: 'pending',
  },
];

describe('TaskTree', () => {
  it('renders with role="tree"', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} />);
    expect(container.querySelector('[role="tree"]')).toBeInTheDocument();
  });

  it('renders root-level tasks as treeitems', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} />);
    const items = container.querySelectorAll(':scope > [role="tree"] > [role="treeitem"]');
    expect(items).toHaveLength(2);
  });

  it('renders task labels', () => {
    render(<TaskTree tasks={sampleTasks} defaultExpandAll />);
    expect(document.querySelector('.an-task-tree__label')?.textContent).toBe('Refactor auth module');
  });

  it('shows chevron for nodes with children', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} />);
    const chevrons = container.querySelectorAll('.an-task-tree__chevron');
    expect(chevrons.length).toBeGreaterThan(0);
  });

  it('shows spacer for leaf nodes', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} defaultExpandAll />);
    const spacers = container.querySelectorAll('.an-task-tree__chevron-spacer');
    expect(spacers.length).toBeGreaterThan(0);
  });

  it('renders status indicators', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} />);
    const indicators = container.querySelectorAll('.an-task-tree__indicator');
    expect(indicators.length).toBeGreaterThan(0);
    expect(container.querySelector('.an-task-tree__indicator--running')).toBeInTheDocument();
  });

  it('auto-expands nodes with running children', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} />);
    // Node 1 has running status, should be auto-expanded
    const firstItem = container.querySelector('[role="treeitem"]');
    expect(firstItem).toHaveAttribute('aria-expanded', 'true');
  });

  it('expands all when defaultExpandAll is true', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} defaultExpandAll />);
    const expandedItems = container.querySelectorAll('[aria-expanded="true"]');
    expect(expandedItems.length).toBeGreaterThanOrEqual(2);
  });

  it('toggles expand on chevron click', () => {
    const { container } = render(
      <TaskTree tasks={[{ id: '1', label: 'Task', status: 'pending', children: [{ id: '1-1', label: 'Sub', status: 'pending' }] }]} />,
    );
    const row = container.querySelector('.an-task-tree__node-row') as HTMLElement;
    const item = container.querySelector('[role="treeitem"]') as HTMLElement;

    // Initially not expanded (pending, no running children)
    expect(item).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(row);
    expect(item).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    fireEvent.click(row);
    expect(item).toHaveAttribute('aria-expanded', 'false');
  });

  it('fires onNodeClick callback for leaf nodes', () => {
    const onClick = vi.fn();
    render(<TaskTree tasks={[{ id: '1', label: 'Leaf', status: 'pending' }]} onNodeClick={onClick} />);
    const row = document.querySelector('.an-task-tree__node-row') as HTMLElement;
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });

  it('fires onNodeToggle callback', () => {
    const onToggle = vi.fn();
    const tasks: TaskNode[] = [
      { id: '1', label: 'Parent', status: 'pending', children: [{ id: '1-1', label: 'Child', status: 'pending' }] },
    ];
    const { container } = render(<TaskTree tasks={tasks} onNodeToggle={onToggle} />);
    const row = container.querySelector('.an-task-tree__node-row') as HTMLElement;
    fireEvent.click(row);
    expect(onToggle).toHaveBeenCalledWith('1', true);
  });

  it('handles controlled expandedIds', () => {
    const tasks: TaskNode[] = [
      { id: '1', label: 'Parent', status: 'pending', children: [{ id: '1-1', label: 'Child', status: 'pending' }] },
    ];
    const { container } = render(<TaskTree tasks={tasks} expandedIds={['1']} />);
    expect(container.querySelector('[role="treeitem"]')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows elapsed time when enabled', () => {
    const tasks: TaskNode[] = [
      { id: '1', label: 'Task', status: 'complete', startedAt: 1000, completedAt: 5000 },
    ];
    const { container } = render(<TaskTree tasks={tasks} showElapsedTime />);
    expect(container.querySelector('.an-task-tree__elapsed')).toBeInTheDocument();
  });

  it('hides connectors when showConnectors is false', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} showConnectors={false} />);
    expect(container.firstChild).toHaveClass('an-task-tree--no-connectors');
  });

  it('renders description', () => {
    const tasks: TaskNode[] = [
      { id: '1', label: 'Task', status: 'pending', description: 'A detailed description' },
    ];
    const { container } = render(<TaskTree tasks={tasks} />);
    expect(container.querySelector('.an-task-tree__description')?.textContent).toBe('A detailed description');
  });

  it('renders error', () => {
    const tasks: TaskNode[] = [
      { id: '1', label: 'Task', status: 'error', error: 'Something failed' },
    ];
    const { container } = render(<TaskTree tasks={tasks} />);
    expect(container.querySelector('.an-task-tree__error')?.textContent).toBe('Something failed');
  });

  it('supports keyboard navigation (Enter)', () => {
    const onClick = vi.fn();
    render(<TaskTree tasks={[{ id: '1', label: 'Leaf', status: 'pending' }]} onNodeClick={onClick} />);
    const row = document.querySelector('.an-task-tree__node-row') as HTMLElement;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports custom renderNodeContent', () => {
    const tasks: TaskNode[] = [{ id: '1', label: 'Task', status: 'pending' }];
    const { container } = render(
      <TaskTree tasks={tasks} renderNodeContent={(node) => <span className="custom">{node.label.toUpperCase()}</span>} />,
    );
    expect(container.querySelector('.custom')?.textContent).toBe('TASK');
  });

  it('applies className to root', () => {
    const { container } = render(<TaskTree tasks={sampleTasks} className="my-custom" />);
    expect(container.firstChild).toHaveClass('an-task-tree', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <TaskTree
        tasks={sampleTasks}
        defaultExpandAll
        classNames={{
          root: 'custom-root',
          node: 'custom-node',
          nodeRow: 'custom-row',
          indicator: 'custom-indicator',
          label: 'custom-label',
        }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-task-tree__node')).toHaveClass('custom-node');
    expect(container.querySelector('.an-task-tree__node-row')).toHaveClass('custom-row');
    expect(container.querySelector('.an-task-tree__indicator')).toHaveClass('custom-indicator');
    expect(container.querySelector('.an-task-tree__label')).toHaveClass('custom-label');
  });

  it('renders empty tasks without crashing', () => {
    const { container } = render(<TaskTree tasks={[]} />);
    expect(container.querySelector('.an-task-tree')).toBeInTheDocument();
  });
});
