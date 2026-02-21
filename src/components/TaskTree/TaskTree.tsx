import { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import type { TaskNode, StepStatus } from '../../types';

export interface TaskTreeClassNames {
  root?: string;
  node?: string;
  nodeRow?: string;
  indicator?: string;
  label?: string;
  description?: string;
  children?: string;
  connector?: string;
}

export interface TaskTreeProps {
  /** Root-level tasks. */
  tasks: TaskNode[];
  /** Controlled expanded state — array of expanded node IDs. */
  expandedIds?: string[];
  /** Expand all nodes by default. Default: false. */
  defaultExpandAll?: boolean;
  /** Show elapsed time for completed tasks. */
  showElapsedTime?: boolean;
  /** Show vertical connector lines. Default: true. */
  showConnectors?: boolean;
  /** Callback when a node is clicked. */
  onNodeClick?: (node: TaskNode) => void;
  /** Callback when a node is expanded/collapsed. */
  onNodeToggle?: (nodeId: string, expanded: boolean) => void;
  /** Custom renderer for node content. */
  renderNodeContent?: (node: TaskNode) => React.ReactNode;
  className?: string;
  classNames?: TaskTreeClassNames;
}

// ── Helpers ──────────────────────────────────────────────────────────

function collectAllIds(tasks: TaskNode[]): Set<string> {
  const ids = new Set<string>();
  function walk(nodes: TaskNode[]) {
    for (const node of nodes) {
      ids.add(node.id);
      if (node.children) walk(node.children);
    }
  }
  walk(tasks);
  return ids;
}

function hasRunningChild(node: TaskNode): boolean {
  if (!node.children) return false;
  for (const child of node.children) {
    if (child.status === 'running' || child.status === 'streaming') return true;
    if (hasRunningChild(child)) return true;
  }
  return false;
}

function formatElapsed(start?: number, end?: number): string | null {
  if (start == null) return null;
  const endTime = end ?? Date.now();
  const ms = endTime - start;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds % 60}s`;
}

const ACTIVE_STATUSES = new Set<StepStatus>(['running', 'streaming']);

// ── StatusIndicator ──────────────────────────────────────────────────

function StatusIndicator({ status, className }: { status: StepStatus; className?: string }) {
  let inner: React.ReactNode;
  if (status === 'running' || status === 'streaming') {
    inner = <span className="an-task-tree__indicator-spinner" />;
  } else if (status === 'complete') {
    inner = <span className="an-task-tree__indicator-check" />;
  } else if (status === 'error') {
    inner = <span className="an-task-tree__indicator-x" />;
  } else {
    inner = <span className="an-task-tree__indicator-dot" />;
  }

  return (
    <span className={cn('an-task-tree__indicator', `an-task-tree__indicator--${status}`, className)}>
      {inner}
    </span>
  );
}

// ── TreeNode ─────────────────────────────────────────────────────────

function TreeNodeComponent({
  node,
  depth,
  expandedSet,
  toggleExpand,
  showElapsedTime,
  showConnectors,
  onNodeClick,
  onNodeToggle,
  renderNodeContent,
  classNames,
}: {
  node: TaskNode;
  depth: number;
  expandedSet: Set<string>;
  toggleExpand: (id: string) => void;
  showElapsedTime?: boolean;
  showConnectors?: boolean;
  onNodeClick?: (node: TaskNode) => void;
  onNodeToggle?: (nodeId: string, expanded: boolean) => void;
  renderNodeContent?: (node: TaskNode) => React.ReactNode;
  classNames?: TaskTreeClassNames;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedSet.has(node.id);
  const elapsed = showElapsedTime ? formatElapsed(node.startedAt, node.completedAt) : null;

  const handleToggle = () => {
    if (!hasChildren) return;
    toggleExpand(node.id);
    onNodeToggle?.(node.id, !isExpanded);
  };

  const handleClick = () => {
    onNodeClick?.(node);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasChildren) {
        handleToggle();
      } else {
        handleClick();
      }
    }
  };

  return (
    <li
      className={cn('an-task-tree__node', classNames?.node)}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <div
        className={cn(
          'an-task-tree__node-row',
          onNodeClick && 'an-task-tree__node-row--clickable',
          classNames?.nodeRow,
        )}
        style={{ paddingLeft: `calc(${depth} * var(--an-space-5))` }}
        onClick={hasChildren ? handleToggle : handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {showConnectors && depth > 0 && (
          <span className={cn('an-task-tree__connector', classNames?.connector)} aria-hidden="true" />
        )}
        {hasChildren ? (
          <span
            className={cn(
              'an-task-tree__chevron',
              isExpanded && 'an-task-tree__chevron--expanded',
            )}
            aria-hidden="true"
          />
        ) : (
          <span className="an-task-tree__chevron-spacer" aria-hidden="true" />
        )}
        <StatusIndicator status={node.status} className={classNames?.indicator} />
        {renderNodeContent ? (
          renderNodeContent(node)
        ) : (
          <>
            <span className={cn('an-task-tree__label', classNames?.label)}>
              {node.label}
            </span>
            {elapsed && (
              <span className="an-task-tree__elapsed">{elapsed}</span>
            )}
          </>
        )}
      </div>
      {node.description && (
        <div
          className={cn('an-task-tree__description', classNames?.description)}
          style={{ paddingLeft: `calc(${depth} * var(--an-space-5) + var(--an-space-7))` }}
        >
          {node.description}
        </div>
      )}
      {node.error && (
        <div
          className="an-task-tree__error"
          style={{ paddingLeft: `calc(${depth} * var(--an-space-5) + var(--an-space-7))` }}
        >
          {node.error}
        </div>
      )}
      {hasChildren && isExpanded && (
        <ul className={cn('an-task-tree__children', classNames?.children)} role="group">
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedSet={expandedSet}
              toggleExpand={toggleExpand}
              showElapsedTime={showElapsedTime}
              showConnectors={showConnectors}
              onNodeClick={onNodeClick}
              onNodeToggle={onNodeToggle}
              renderNodeContent={renderNodeContent}
              classNames={classNames}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export function TaskTree({
  tasks,
  expandedIds,
  defaultExpandAll = false,
  showElapsedTime = false,
  showConnectors = true,
  onNodeClick,
  onNodeToggle,
  renderNodeContent,
  className,
  classNames,
}: TaskTreeProps) {
  const isControlled = expandedIds !== undefined;

  // Uncontrolled state
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(() => {
    if (defaultExpandAll) return collectAllIds(tasks);
    // Auto-expand nodes with running children
    const expanded = new Set<string>();
    function walk(nodes: TaskNode[]) {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          if (hasRunningChild(node) || ACTIVE_STATUSES.has(node.status)) {
            expanded.add(node.id);
          }
          walk(node.children);
        }
      }
    }
    walk(tasks);
    return expanded;
  });

  const expandedSet = isControlled ? new Set(expandedIds) : internalExpanded;

  const toggleExpand = useCallback((id: string) => {
    if (isControlled) return; // consumer manages state
    setInternalExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [isControlled]);

  return (
    <ul
      className={cn(
        'an-task-tree',
        !showConnectors && 'an-task-tree--no-connectors',
        className,
        classNames?.root,
      )}
      role="tree"
      aria-label="Task tree"
    >
      {tasks.map((task) => (
        <TreeNodeComponent
          key={task.id}
          node={task}
          depth={0}
          expandedSet={expandedSet}
          toggleExpand={toggleExpand}
          showElapsedTime={showElapsedTime}
          showConnectors={showConnectors}
          onNodeClick={onNodeClick}
          onNodeToggle={onNodeToggle}
          renderNodeContent={renderNodeContent}
          classNames={classNames}
        />
      ))}
    </ul>
  );
}
