// Components
export { AgentTimeline } from './components/AgentTimeline';
export type { AgentTimelineProps } from './components/AgentTimeline';
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

// Hooks
export {
  useVisualMemory,
  useReducedMotion,
  useAutoScroll,
  useElapsedTime,
} from './hooks';
export type { VisualMemoryOptions, VisualMemoryState, AutoScrollOptions } from './hooks';

// Types
export type {
  StepStatus,
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
} from './types';

// Utilities
export { cn } from './utils/cn';
