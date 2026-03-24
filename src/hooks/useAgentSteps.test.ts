import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentSteps } from './useAgentSteps';
import type { AgentEvent, ApprovalRequest, Artifact } from '../types';

function dispatchEvents(dispatch: (e: AgentEvent) => void, events: AgentEvent[]) {
  for (const event of events) {
    act(() => dispatch(event));
  }
}

describe('useAgentSteps', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useAgentSteps());
    expect(result.current.steps).toEqual([]);
    expect(result.current.tiers).toEqual([]);
    expect(result.current.approvalRequest).toBeUndefined();
  });

  it('handles step.started', () => {
    const { result } = renderHook(() => useAgentSteps());
    act(() => result.current.dispatch({ type: 'step.started', step: { id: 's1', label: 'Step 1' } }));

    expect(result.current.steps).toHaveLength(1);
    expect(result.current.steps[0]).toMatchObject({
      id: 's1',
      label: 'Step 1',
      status: 'running',
    });
    expect(result.current.steps[0].startedAt).toBeTypeOf('number');
  });

  it('handles step.updated', () => {
    const { result } = renderHook(() => useAgentSteps());
    dispatchEvents(result.current.dispatch, [
      { type: 'step.started', step: { id: 's1', label: 'Step 1' } },
      { type: 'step.updated', stepId: 's1', fields: { description: 'Updated desc' } },
    ]);

    expect(result.current.steps[0].description).toBe('Updated desc');
  });

  it('handles step.completed with default status', () => {
    const { result } = renderHook(() => useAgentSteps());
    dispatchEvents(result.current.dispatch, [
      { type: 'step.started', step: { id: 's1', label: 'Step 1' } },
      { type: 'step.completed', stepId: 's1' },
    ]);

    expect(result.current.steps[0].status).toBe('complete');
    expect(result.current.steps[0].completedAt).toBeTypeOf('number');
  });

  it('handles step.completed with error', () => {
    const { result } = renderHook(() => useAgentSteps());
    dispatchEvents(result.current.dispatch, [
      { type: 'step.started', step: { id: 's1', label: 'Step 1' } },
      { type: 'step.completed', stepId: 's1', status: 'error', error: 'fail' },
    ]);

    expect(result.current.steps[0].status).toBe('error');
    expect(result.current.steps[0].error).toBe('fail');
  });

  it('handles tool.started', () => {
    const { result } = renderHook(() => useAgentSteps());
    dispatchEvents(result.current.dispatch, [
      { type: 'step.started', step: { id: 's1', label: 'Step 1' } },
      { type: 'tool.started', stepId: 's1', toolCall: { id: 't1', name: 'read', input: {} } },
    ]);

    expect(result.current.steps[0].toolCalls).toHaveLength(1);
    expect(result.current.steps[0].toolCalls![0]).toMatchObject({
      id: 't1',
      name: 'read',
      status: 'running',
    });
  });

  it('handles tool.updated', () => {
    const { result } = renderHook(() => useAgentSteps());
    dispatchEvents(result.current.dispatch, [
      { type: 'step.started', step: { id: 's1', label: 'Step 1' } },
      { type: 'tool.started', stepId: 's1', toolCall: { id: 't1', name: 'read', input: {} } },
      { type: 'tool.updated', stepId: 's1', toolCallId: 't1', fields: { output: 'data' } },
    ]);

    expect(result.current.steps[0].toolCalls![0].output).toBe('data');
  });

  it('handles tool.completed with output', () => {
    const { result } = renderHook(() => useAgentSteps());
    dispatchEvents(result.current.dispatch, [
      { type: 'step.started', step: { id: 's1', label: 'Step 1' } },
      { type: 'tool.started', stepId: 's1', toolCall: { id: 't1', name: 'read', input: {} } },
      { type: 'tool.completed', stepId: 's1', toolCallId: 't1', output: 'result' },
    ]);

    const tc = result.current.steps[0].toolCalls![0];
    expect(tc.status).toBe('complete');
    expect(tc.output).toBe('result');
    expect(tc.completedAt).toBeTypeOf('number');
  });

  it('handles tool.completed with error', () => {
    const { result } = renderHook(() => useAgentSteps());
    dispatchEvents(result.current.dispatch, [
      { type: 'step.started', step: { id: 's1', label: 'Step 1' } },
      { type: 'tool.started', stepId: 's1', toolCall: { id: 't1', name: 'read', input: {} } },
      { type: 'tool.completed', stepId: 's1', toolCallId: 't1', error: 'oops' },
    ]);

    const tc = result.current.steps[0].toolCalls![0];
    expect(tc.status).toBe('error');
    expect(tc.error).toBe('oops');
  });

  it('handles tier.started and tier.completed', () => {
    const { result } = renderHook(() => useAgentSteps());
    act(() => result.current.dispatch({ type: 'tier.started', tier: { id: 'tier1', stepIds: ['s1'] } }));

    expect(result.current.tiers).toHaveLength(1);
    expect(result.current.tiers[0]).toMatchObject({ id: 'tier1', stepIds: ['s1'] });

    act(() => result.current.dispatch({ type: 'tier.completed', tierId: 'tier1' }));
    expect(result.current.tiers[0].completedAt).toBeTypeOf('number');
  });

  it('handles approval.requested and approval.resolved', () => {
    const request: ApprovalRequest = {
      id: 'a1', stepId: 's1', title: 'Approve?', createdAt: Date.now(),
    };
    const { result } = renderHook(() => useAgentSteps());

    act(() => result.current.dispatch({ type: 'approval.requested', request }));
    expect(result.current.approvalRequest).toEqual(request);

    act(() => result.current.dispatch({ type: 'approval.resolved', requestId: 'a1', decision: 'approved' }));
    expect(result.current.approvalRequest).toBeUndefined();
  });

  it('does not clear approval if requestId does not match', () => {
    const request: ApprovalRequest = {
      id: 'a1', stepId: 's1', title: 'Approve?', createdAt: Date.now(),
    };
    const { result } = renderHook(() => useAgentSteps());

    act(() => result.current.dispatch({ type: 'approval.requested', request }));
    act(() => result.current.dispatch({ type: 'approval.resolved', requestId: 'other', decision: 'rejected' }));
    expect(result.current.approvalRequest).toEqual(request);
  });

  it('handles artifact.added', () => {
    const artifact: Artifact = { id: 'art1', kind: 'code', content: 'console.log()' };
    const { result } = renderHook(() => useAgentSteps());
    dispatchEvents(result.current.dispatch, [
      { type: 'step.started', step: { id: 's1', label: 'Step 1' } },
      { type: 'artifact.added', stepId: 's1', artifact },
    ]);

    expect(result.current.steps[0].artifacts).toEqual([artifact]);
  });

  it('handles reset', () => {
    const { result } = renderHook(() => useAgentSteps());
    act(() => result.current.dispatch({ type: 'step.started', step: { id: 's1', label: 'Step 1' } }));
    act(() => result.current.dispatch({ type: 'reset' }));

    expect(result.current.steps).toEqual([]);
    expect(result.current.tiers).toEqual([]);
    expect(result.current.approvalRequest).toBeUndefined();
  });

  it('reset() convenience function dispatches reset event', () => {
    const { result } = renderHook(() => useAgentSteps());
    act(() => result.current.dispatch({ type: 'step.started', step: { id: 's1', label: 'Step 1' } }));
    act(() => result.current.reset());
    expect(result.current.steps).toEqual([]);
  });

  it('produces correct props with tiers', () => {
    const onApprove = () => {};
    const { result } = renderHook(() => useAgentSteps({ onApprove, showElapsedTime: true }));
    act(() => result.current.dispatch({ type: 'tier.started', tier: { id: 'tier1', stepIds: ['s1'] } }));

    expect(result.current.props.tiers).toHaveLength(1);
    expect(result.current.props.onApprove).toBe(onApprove);
    expect(result.current.props.showElapsedTime).toBe(true);
  });

  it('props.tiers is undefined when no tiers exist', () => {
    const { result } = renderHook(() => useAgentSteps());
    expect(result.current.props.tiers).toBeUndefined();
  });

  it('ignores unknown event types', () => {
    const { result } = renderHook(() => useAgentSteps());
    act(() => result.current.dispatch({ type: 'unknown.event' } as unknown as AgentEvent));
    expect(result.current.steps).toEqual([]);
  });
});
