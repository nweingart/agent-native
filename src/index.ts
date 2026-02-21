// Components — AgentTimeline
export { AgentTimeline } from './components/AgentTimeline';
export type { AgentTimelineProps, TimelineClassNames } from './components/AgentTimeline';
export { TimelineStep } from './components/AgentTimeline';
export type { TimelineStepProps } from './components/AgentTimeline';
export { TimelineConnector } from './components/AgentTimeline';
export type { TimelineConnectorProps } from './components/AgentTimeline';
export { TimelineTier } from './components/AgentTimeline';
export type { TimelineTierProps } from './components/AgentTimeline';
export { TimelineApprovalGate } from './components/AgentTimeline';
export type { TimelineApprovalGateProps } from './components/AgentTimeline';
export { TimelineSummary } from './components/AgentTimeline';
export type { TimelineSummaryProps } from './components/AgentTimeline';
export { TimelineToolCall } from './components/AgentTimeline';
export type { TimelineToolCallProps } from './components/AgentTimeline';
export { TimelineToolCallList } from './components/AgentTimeline';
export type { TimelineToolCallListProps } from './components/AgentTimeline';
export { TimelineArtifact } from './components/AgentTimeline';
export type { TimelineArtifactProps } from './components/AgentTimeline';

// Components — StreamingText
export { StreamingText } from './components/StreamingText';
export type { StreamingTextProps, StreamingTextClassNames } from './components/StreamingText';

// Components — ThinkingIndicator
export { ThinkingIndicator } from './components/ThinkingIndicator';
export type { ThinkingIndicatorProps, ThinkingIndicatorClassNames } from './components/ThinkingIndicator';

// Components — AgentStatusBar
export { AgentStatusBar } from './components/AgentStatusBar';
export type { AgentStatusBarProps, AgentStatusBarClassNames } from './components/AgentStatusBar';

// Components — DiffViewer
export { DiffViewer } from './components/DiffViewer';
export type { DiffViewerProps, DiffViewerClassNames } from './components/DiffViewer';

// Components — TerminalOutput
export { TerminalOutput } from './components/TerminalOutput';
export type { TerminalOutputProps, TerminalOutputClassNames } from './components/TerminalOutput';

// Components — TaskTree
export { TaskTree } from './components/TaskTree';
export type { TaskTreeProps, TaskTreeClassNames } from './components/TaskTree';

// Components — AgentHandoff
export { AgentHandoff } from './components/AgentHandoff';
export type { AgentHandoffProps, AgentHandoffClassNames } from './components/AgentHandoff';

// Components — ContextBudget
export { ContextBudget } from './components/ContextBudget';
export type { ContextBudgetProps, ContextBudgetClassNames } from './components/ContextBudget';

// Components — CostTracker
export { CostTracker } from './components/CostTracker';
export type { CostTrackerProps, CostTrackerClassNames } from './components/CostTracker';

// Components — PermissionBadges
export { PermissionBadges } from './components/PermissionBadges';
export type { PermissionBadgesProps, PermissionBadgesClassNames } from './components/PermissionBadges';

// Hooks
export {
  useVisualMemory,
  useReducedMotion,
  useAutoScroll,
  useElapsedTime,
  useAgentSteps,
  useAgentStream,
  useStreamingText,
} from './hooks';
export type {
  VisualMemoryOptions,
  VisualMemoryState,
  AutoScrollOptions,
  AgentStepsState,
  UseAgentStepsOptions,
  UseAgentStepsReturn,
  UseAgentStreamOptions,
  UseAgentStreamReturn,
  StreamStatus,
  UseStreamingTextOptions,
  UseStreamingTextReturn,
} from './hooks';

// Types
export type {
  StepStatus,
  AgentStatus,
  AgentStep,
  StepTier,
  ToolCall,
  Artifact,
  ArtifactKind,
  TokenUsage,
  CostBreakdown,
  Message,
  MessageRole,
  Finding,
  FindingSeverity,
  DiffFile,
  DiffHunk,
  DiffLine,
  DiffLineType,
  Citation,
  ApprovalRequest,
  SubAgent,
  FeedbackPayload,
  AgentEvent,
  TaskNode,
  HandoffEvent,
  ContextBudgetData,
  CostEntry,
  Permission,
} from './types';

// Utilities
export { cn } from './utils/cn';
export { parseAnsi } from './utils/ansi';
export type { AnsiSpan, AnsiStyle } from './utils/ansi';
