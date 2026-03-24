import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentEvent, ApprovalRequest } from '../types';
import type { AgentTimelineProps } from '../components/AgentTimeline/AgentTimeline';
import { useAgentSteps } from './useAgentSteps';

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set([
  'step.started',
  'step.updated',
  'step.completed',
  'tool.started',
  'tool.updated',
  'tool.completed',
  'tier.started',
  'tier.completed',
  'approval.requested',
  'approval.resolved',
  'artifact.added',
  'reset',
]);

function isValidAgentEvent(value: unknown): value is AgentEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Record<string, unknown>).type === 'string' &&
    VALID_EVENT_TYPES.has((value as Record<string, unknown>).type as string)
  );
}

export interface UseAgentStreamOptions {
  url: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnects?: number;
  onApprove?: (request: ApprovalRequest) => void;
  onReject?: (request: ApprovalRequest) => void;
  showElapsedTime?: boolean;
  showToolCalls?: boolean;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export type StreamStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface UseAgentStreamReturn {
  props: AgentTimelineProps;
  status: StreamStatus;
  error: Error | null;
  reconnectCount: number;
  disconnect: () => void;
  reconnect: () => void;
}

interface StreamCallbacks {
  onConnecting: () => void;
  onOpen: () => void;
  onEvent: (event: AgentEvent) => void;
  onClose: () => void;
  onError: (error: Error) => void;
}

async function readNdjsonStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: AgentEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (isValidAgentEvent(parsed)) onEvent(parsed);
      } catch { /* skip malformed lines */ }
    }
  }
}

async function fetchStream(
  url: string,
  headers: Record<string, string> | undefined,
  signal: AbortSignal,
  callbacks: StreamCallbacks,
): Promise<void> {
  callbacks.onConnecting();
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/x-ndjson', ...headers },
      signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('Response body is null');
    }
    callbacks.onOpen();
    await readNdjsonStream(response.body, callbacks.onEvent);
    callbacks.onClose();
  } catch (err) {
    if (signal.aborted) return;
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

interface StreamConnectionOptions {
  url: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnects?: number;
  onEvent: (event: AgentEvent) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

function useStreamConnection(options: StreamConnectionOptions) {
  const { url, headers, enabled = true, reconnect: shouldReconnect = true,
    reconnectInterval = 3000, maxReconnects = 5, onEvent, onError, onOpen, onClose } = options;
  const [status, setStatus] = useState<StreamStatus>('closed');
  const [error, setError] = useState<Error | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const cleanup = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
  }, []);
  const connect = useCallback(() => {
    cleanup();
    if (!mountedRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    fetchStream(url, headers, controller.signal, {
      onConnecting: () => { if (mountedRef.current) setStatus('connecting'); },
      onOpen: () => { if (mountedRef.current) { setStatus('open'); onOpen?.(); } },
      onEvent: (e) => { if (mountedRef.current) onEvent(e); },
      onClose: () => { if (mountedRef.current) { setStatus('closed'); onClose?.(); } },
      onError: (e) => { if (mountedRef.current) { setStatus('error'); setError(e); onError?.(e); } },
    });
  }, [url, headers, cleanup, onEvent, onOpen, onClose, onError]);
  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnect || !mountedRef.current) return;
    setReconnectCount((prev) => {
      if (prev >= maxReconnects) return prev;
      reconnectTimerRef.current = setTimeout(() => { if (mountedRef.current) connect(); }, reconnectInterval);
      return prev + 1;
    });
  }, [shouldReconnect, maxReconnects, reconnectInterval, connect]);
  useEffect(() => {
    if (status === 'error' && reconnectCount < maxReconnects) scheduleReconnect();
  }, [status, reconnectCount, maxReconnects, scheduleReconnect]);
  useEffect(() => {
    if (enabled) { setReconnectCount(0); connect(); } else { cleanup(); setStatus('closed'); }
    return cleanup;
  }, [enabled, url]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; cleanup(); }; }, [cleanup]);
  const disconnect = useCallback(() => { cleanup(); setStatus('closed'); }, [cleanup]);
  const reconnectFn = useCallback(() => { setReconnectCount(0); connect(); }, [connect]);
  return { status, error, reconnectCount, disconnect, reconnect: reconnectFn };
}

export function useAgentStream(options: UseAgentStreamOptions): UseAgentStreamReturn {
  const { url, headers, enabled, reconnect, reconnectInterval, maxReconnects,
    onApprove, onReject, showElapsedTime, showToolCalls, onError, onOpen, onClose } = options;
  const { dispatch, props } = useAgentSteps({ onApprove, onReject, showElapsedTime, showToolCalls });
  const connection = useStreamConnection({
    url, headers, enabled, reconnect, reconnectInterval, maxReconnects,
    onEvent: dispatch, onError, onOpen, onClose,
  });
  return { props, ...connection };
}
