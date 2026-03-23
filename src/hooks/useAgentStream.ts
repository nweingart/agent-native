import { useState, useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import type { AgentEvent, ApprovalRequest } from '../types';
import type { AgentTimelineProps } from '../components/AgentTimeline/AgentTimeline';
import { useAgentSteps } from './useAgentSteps';

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

interface StreamRefs {
  abort: MutableRefObject<AbortController | null>;
  reconnectTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  mounted: MutableRefObject<boolean>;
  headers: MutableRefObject<Record<string, string> | undefined>;
}

function cleanupRefs(refs: StreamRefs): void {
  if (refs.abort.current) {
    refs.abort.current.abort();
    refs.abort.current = null;
  }
  if (refs.reconnectTimer.current) {
    clearTimeout(refs.reconnectTimer.current);
    refs.reconnectTimer.current = null;
  }
}

async function readNdjsonStream(
  body: ReadableStream<Uint8Array>,
  mounted: MutableRefObject<boolean>,
  dispatch: (event: AgentEvent) => void,
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
        const event = JSON.parse(trimmed) as AgentEvent;
        if (mounted.current) dispatch(event);
      } catch {
        // Skip malformed lines
      }
    }
  }
}

async function connectStream(
  url: string,
  refs: StreamRefs,
  dispatch: (event: AgentEvent) => void,
  setStatus: (s: StreamStatus) => void,
  setError: (e: Error | null) => void,
  callbacks: { onOpen?: () => void; onClose?: () => void; onError?: (e: Error) => void },
): Promise<void> {
  cleanupRefs(refs);
  if (!refs.mounted.current) return;

  const controller = new AbortController();
  refs.abort.current = controller;
  setStatus('connecting');
  setError(null);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/x-ndjson', ...refs.headers.current },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    if (!response.body) throw new Error('Response body is null');

    if (refs.mounted.current) {
      setStatus('open');
      callbacks.onOpen?.();
    }

    await readNdjsonStream(response.body, refs.mounted, dispatch);

    if (refs.mounted.current) {
      setStatus('closed');
      callbacks.onClose?.();
    }
  } catch (err) {
    if (controller.signal.aborted) return;
    const streamError = err instanceof Error ? err : new Error(String(err));
    if (refs.mounted.current) {
      setStatus('error');
      setError(streamError);
      callbacks.onError?.(streamError);
    }
  }
}

export function useAgentStream(options: UseAgentStreamOptions): UseAgentStreamReturn {
  const {
    url, headers, enabled = true, reconnect: shouldReconnect = true,
    reconnectInterval = 3000, maxReconnects = 5,
    onApprove, onReject, showElapsedTime, showToolCalls,
    onError, onOpen, onClose,
  } = options;

  const { dispatch, props } = useAgentSteps({ onApprove, onReject, showElapsedTime, showToolCalls });
  const [status, setStatus] = useState<StreamStatus>('closed');
  const [error, setError] = useState<Error | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const refs: StreamRefs = { abort: useRef(null), reconnectTimer: useRef(null), mounted: useRef(true), headers: useRef(headers) };
  useEffect(() => { refs.headers.current = headers; });
  const cleanup = useCallback(() => cleanupRefs(refs), []);
  const connect = useCallback(
    () => connectStream(url, refs, dispatch, setStatus, setError, { onOpen, onClose, onError }),
    [url, cleanup, dispatch, onOpen, onClose, onError],
  );

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnect || !refs.mounted.current) return;
    setReconnectCount((prev: number) => {
      if (prev >= maxReconnects) return prev;
      refs.reconnectTimer.current = setTimeout(() => { if (refs.mounted.current) connect(); }, reconnectInterval);
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

  useEffect(() => {
    refs.mounted.current = true;
    return () => { refs.mounted.current = false; cleanup(); };
  }, [cleanup]);

  const disconnect = useCallback(() => { cleanup(); setStatus('closed'); }, [cleanup]);
  const manualReconnect = useCallback(() => { setReconnectCount(0); connect(); }, [connect]);

  return { props, status, error, reconnectCount, disconnect, reconnect: manualReconnect };
}
