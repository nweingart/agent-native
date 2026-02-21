// ── Status & Classification ─────────────────────────────────────────

export type StepStatus =
  | 'pending'
  | 'running'
  | 'streaming'
  | 'waiting_approval'
  | 'complete'
  | 'error'
  | 'skipped'
  | 'cancelled';

// ── Tool Calls ──────────────────────────────────────────────────────

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'running' | 'complete' | 'error';
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

// ── Artifacts ───────────────────────────────────────────────────────

export type ArtifactKind = 'code' | 'file' | 'diff' | 'image' | 'text' | 'json' | 'markdown';

export interface Artifact {
  id: string;
  kind: ArtifactKind;
  title?: string;
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

// ── Token & Cost Tracking ───────────────────────────────────────────

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface CostBreakdown {
  totalCost: number;
  model: string;
  tokenUsage: TokenUsage;
  currency?: string;
}

// ── Steps & Tiers ───────────────────────────────────────────────────

export interface AgentStep {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
  startedAt?: number;
  completedAt?: number;
  toolCalls?: ToolCall[];
  artifacts?: Artifact[];
  tokenUsage?: TokenUsage;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface StepTier {
  id: string;
  label?: string;
  stepIds: string[];
  startedAt?: number;
  completedAt?: number;
}

// ── Messages ────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  artifacts?: Artifact[];
  tokenUsage?: TokenUsage;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

// ── Code Review ─────────────────────────────────────────────────────

export type FindingSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Finding {
  id: string;
  severity: FindingSeverity;
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
  rule?: string;
  suggestion?: string;
}

// ── Diffs ───────────────────────────────────────────────────────────

export type DiffLineType = 'add' | 'remove' | 'context';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  hunks: DiffHunk[];
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  language?: string;
}

// ── Citations ───────────────────────────────────────────────────────

export interface Citation {
  id: string;
  label: string;
  url?: string;
  filePath?: string;
  line?: number;
  snippet?: string;
}

// ── Approval Gates ──────────────────────────────────────────────────

export interface ApprovalRequest {
  id: string;
  stepId: string;
  title: string;
  description?: string;
  toolCall?: ToolCall;
  createdAt: number;
  expiresAt?: number;
}

// ── Agent Status ───────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'thinking' | 'acting' | 'waiting' | 'error' | 'complete';

// ── Sub-Agents ──────────────────────────────────────────────────────

export interface SubAgent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  task?: string;
  steps?: AgentStep[];
  startedAt?: number;
  completedAt?: number;
}

// ── Feedback ────────────────────────────────────────────────────────

export interface FeedbackPayload {
  type: 'thumbs_up' | 'thumbs_down' | 'comment' | 'correction';
  targetId: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

// ── Agent Events ────────────────────────────────────────────────────

export type AgentEvent =
  | { type: 'step.started'; step: Pick<AgentStep, 'id' | 'label'> & Partial<AgentStep> }
  | { type: 'step.updated'; stepId: string; fields: Partial<AgentStep> }
  | { type: 'step.completed'; stepId: string; status?: 'complete' | 'error' | 'skipped' | 'cancelled'; error?: string }
  | { type: 'tool.started'; stepId: string; toolCall: Pick<ToolCall, 'id' | 'name' | 'input'> }
  | { type: 'tool.updated'; stepId: string; toolCallId: string; fields: Partial<ToolCall> }
  | { type: 'tool.completed'; stepId: string; toolCallId: string; output?: unknown; error?: string }
  | { type: 'tier.started'; tier: Pick<StepTier, 'id' | 'stepIds'> & Partial<StepTier> }
  | { type: 'tier.completed'; tierId: string }
  | { type: 'approval.requested'; request: ApprovalRequest }
  | { type: 'approval.resolved'; requestId: string; decision: 'approved' | 'rejected' }
  | { type: 'artifact.added'; stepId: string; artifact: Artifact }
  | { type: 'reset' };

// ── Task Tree ──────────────────────────────────────────────────────

export interface TaskNode {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
  children?: TaskNode[];
  startedAt?: number;
  completedAt?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ── Agent Handoff ──────────────────────────────────────────────────

export interface HandoffEvent {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  task?: string;
  timestamp: number;
}

// ── Context Budget ────────────────────────────────────────────────

export interface ContextBudgetData {
  maxTokens: number;
  inputTokens: number;
  outputTokens: number;
  systemTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

// ── Cost Tracking ─────────────────────────────────────────────────

export interface CostEntry {
  id: string;
  model: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  timestamp: number;
  label?: string;
}

// ── Permissions ───────────────────────────────────────────────────

export interface Permission {
  id: string;
  name: string;
  description?: string;
  granted: boolean;
  category?: string;
}
