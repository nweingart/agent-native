import { useReducer, useCallback, useMemo } from 'react';
import type { AgentStep, StepTier, ApprovalRequest, AgentEvent, ToolCall } from '../types';
import type { AgentTimelineProps } from '../components/AgentTimeline/AgentTimeline';

export interface AgentStepsState {
  steps: AgentStep[];
  tiers: StepTier[];
  approvalRequest: ApprovalRequest | undefined;
}

export interface UseAgentStepsOptions {
  onApprove?: (request: ApprovalRequest) => void;
  onReject?: (request: ApprovalRequest) => void;
  showElapsedTime?: boolean;
  showToolCalls?: boolean;
}

export interface UseAgentStepsReturn extends AgentStepsState {
  dispatch: (event: AgentEvent) => void;
  props: AgentTimelineProps;
  reset: () => void;
}

const STEP_ALLOWED_FIELDS: ReadonlySet<string> = new Set([
  'id', 'label', 'description', 'status', 'startedAt', 'completedAt',
  'toolCalls', 'artifacts', 'tokenUsage', 'error', 'metadata',
]);

const STEP_UPDATABLE_FIELDS: ReadonlySet<string> = new Set([
  'label', 'description', 'status', 'startedAt', 'completedAt',
  'tokenUsage', 'error', 'metadata',
]);

const TOOL_ALLOWED_FIELDS: ReadonlySet<string> = new Set([
  'id', 'name', 'input', 'output', 'status', 'startedAt', 'completedAt', 'error',
]);

const TOOL_UPDATABLE_FIELDS: ReadonlySet<string> = new Set([
  'input', 'output', 'status', 'startedAt', 'completedAt', 'error',
]);

const TIER_ALLOWED_FIELDS: ReadonlySet<string> = new Set([
  'id', 'label', 'stepIds', 'startedAt', 'completedAt',
]);

function pickAllowed<T extends Record<string, unknown>>(
  fields: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(fields)) {
    if (allowed.has(key)) {
      result[key] = fields[key];
    }
  }
  return result as Partial<T>;
}

const INITIAL_STATE: AgentStepsState = {
  steps: [],
  tiers: [],
  approvalRequest: undefined,
};

function updateStep(steps: AgentStep[], stepId: string, updater: (step: AgentStep) => AgentStep): AgentStep[] {
  return steps.map((s) => (s.id === stepId ? updater(s) : s));
}

function updateToolCall(toolCalls: ToolCall[], toolCallId: string, updater: (tc: ToolCall) => ToolCall): ToolCall[] {
  return toolCalls.map((tc) => (tc.id === toolCallId ? updater(tc) : tc));
}

function handleStepStarted(state: AgentStepsState, event: Extract<AgentEvent, { type: 'step.started' }>): AgentStepsState {
  const newStep: AgentStep = { status: 'running', startedAt: Date.now(), ...pickAllowed<AgentStep>(event.step, STEP_ALLOWED_FIELDS) };
  return { ...state, steps: [...state.steps, newStep] };
}

function handleStepUpdated(state: AgentStepsState, event: Extract<AgentEvent, { type: 'step.updated' }>): AgentStepsState {
  return {
    ...state,
    steps: updateStep(state.steps, event.stepId, (s) => ({
      ...s,
      ...pickAllowed<AgentStep>(event.fields, STEP_UPDATABLE_FIELDS),
    })),
  };
}

function handleStepCompleted(state: AgentStepsState, event: Extract<AgentEvent, { type: 'step.completed' }>): AgentStepsState {
  return {
    ...state,
    steps: updateStep(state.steps, event.stepId, (s) => ({
      ...s,
      status: event.status ?? 'complete',
      completedAt: Date.now(),
      ...(event.error != null ? { error: event.error } : {}),
    })),
  };
}

function handleToolStarted(state: AgentStepsState, event: Extract<AgentEvent, { type: 'tool.started' }>): AgentStepsState {
  return {
    ...state,
    steps: updateStep(state.steps, event.stepId, (s) => ({
      ...s,
      toolCalls: [
        ...(s.toolCalls ?? []),
        { status: 'running' as const, startedAt: Date.now(), ...pickAllowed<ToolCall>(event.toolCall, TOOL_ALLOWED_FIELDS) },
      ],
    })),
  };
}

function handleToolUpdated(state: AgentStepsState, event: Extract<AgentEvent, { type: 'tool.updated' }>): AgentStepsState {
  return {
    ...state,
    steps: updateStep(state.steps, event.stepId, (s) => ({
      ...s,
      toolCalls: s.toolCalls
        ? updateToolCall(s.toolCalls, event.toolCallId, (tc) => ({
            ...tc,
            ...pickAllowed<ToolCall>(event.fields, TOOL_UPDATABLE_FIELDS),
          }))
        : s.toolCalls,
    })),
  };
}

function handleToolCompleted(state: AgentStepsState, event: Extract<AgentEvent, { type: 'tool.completed' }>): AgentStepsState {
  return {
    ...state,
    steps: updateStep(state.steps, event.stepId, (s) => ({
      ...s,
      toolCalls: s.toolCalls
        ? updateToolCall(s.toolCalls, event.toolCallId, (tc) => ({
            ...tc,
            status: event.error != null ? 'error' as const : 'complete' as const,
            completedAt: Date.now(),
            ...(event.output != null ? { output: event.output } : {}),
            ...(event.error != null ? { error: event.error } : {}),
          }))
        : s.toolCalls,
    })),
  };
}

function handleArtifactAdded(state: AgentStepsState, event: Extract<AgentEvent, { type: 'artifact.added' }>): AgentStepsState {
  return {
    ...state,
    steps: updateStep(state.steps, event.stepId, (s) => ({
      ...s,
      artifacts: [...(s.artifacts ?? []), event.artifact],
    })),
  };
}

function reducer(state: AgentStepsState, event: AgentEvent): AgentStepsState {
  switch (event.type) {
    case 'step.started': return handleStepStarted(state, event);
    case 'step.updated': return handleStepUpdated(state, event);
    case 'step.completed': return handleStepCompleted(state, event);
    case 'tool.started': return handleToolStarted(state, event);
    case 'tool.updated': return handleToolUpdated(state, event);
    case 'tool.completed': return handleToolCompleted(state, event);
    case 'tier.started': {
      const newTier: StepTier = { startedAt: Date.now(), ...pickAllowed<StepTier>(event.tier, TIER_ALLOWED_FIELDS) };
      return { ...state, tiers: [...state.tiers, newTier] };
    }
    case 'tier.completed':
      return {
        ...state,
        tiers: state.tiers.map((t) =>
          t.id === event.tierId ? { ...t, completedAt: Date.now() } : t,
        ),
      };
    case 'approval.requested':
      return { ...state, approvalRequest: event.request };
    case 'approval.resolved':
      return {
        ...state,
        approvalRequest:
          state.approvalRequest?.id === event.requestId ? undefined : state.approvalRequest,
      };
    case 'artifact.added': return handleArtifactAdded(state, event);
    case 'reset': return INITIAL_STATE;
    default: return state;
  }
}

export function useAgentSteps(options: UseAgentStepsOptions = {}): UseAgentStepsReturn {
  const { onApprove, onReject, showElapsedTime, showToolCalls } = options;
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const props = useMemo<AgentTimelineProps>(
    () => ({
      steps: state.steps,
      tiers: state.tiers.length > 0 ? state.tiers : undefined,
      approvalRequest: state.approvalRequest,
      onApprove,
      onReject,
      showElapsedTime,
      showToolCalls,
    }),
    [state.steps, state.tiers, state.approvalRequest, onApprove, onReject, showElapsedTime, showToolCalls],
  );

  return {
    ...state,
    dispatch,
    props,
    reset,
  };
}
