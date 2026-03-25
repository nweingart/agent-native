import { useState, useEffect, useLayoutEffect, useRef, useCallback, type MutableRefObject } from 'react';
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
  mounted: MutableRefObject<boolean>;
  headers: MutableRefObject<Record<string, string> | undefined>;
  onOpen: MutableRefObject<(() => void) | undefined>;
  onClose: MutableRefObject<(() => void) | undefined>;
  onError: MutableRefObject<((error: Error) => void) | undefined>;
}

function cleanupConnection(
  abortRef: MutableRefObject<AbortController | null>,
  timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
): void {
  if (abortRef.current) {
    abortRef.current.abort();
    abortRef.current = null;
  }
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

async function parseNdjsonStream(
  body: ReadableStream<Uint8Array>,
  dispatch: (event: AgentEvent) => void,
  mountedRef: MutableRefObject<boolean>,
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
        if (mountedRef.current) dispatch(event);
      } catch {
        // Skip malformed lines
      }
    }
  }
}

async function connectStream(
  url: string,
  controller: AbortController,
  dispatch: (event: AgentEvent) => void,
  refs: StreamRefs,
  setStatus: (s: StreamStatus) => void,
  setError: (e: Error | null) => void,
): Promise<void> {
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
      refs.onOpen.current?.();
    }

    await parseNdjsonStream(response.body, dispatch, refs.mounted);

    if (refs.mounted.current) {
      setStatus('closed');
      refs.onClose.current?.();
    }
  } catch (err) {
    if (controller.signal.aborted) return;
    const streamError = err instanceof Error ? err : new Error(String(err));
    if (refs.mounted.current) {
      setStatus('error');
      setError(streamError);
      refs.onError.current?.(streamError);
    }
  }
}

interface StreamConnectionOptions {
  url: string;
  enabled: boolean;
  shouldReconnect: boolean;
  reconnectInterval: number;
  maxReconnects: number;
  dispatch: (event: AgentEvent) => void;
  refs: StreamRefs;
}

function useStreamConnection(opts: StreamConnectionOptions) {
  const { url, enabled, shouldReconnect, reconnectInterval, maxReconnects, dispatch, refs } = opts;
  const [status, setStatus] = useState<StreamStatus>('closed');
  const [error, setError] = useState<Error | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanup = useCallback(() => cleanupConnection(abortRef, timerRef), []);

  const connect = useCallback(async () => {
    cleanup();
    if (!refs.mounted.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    await connectStream(url, controller, dispatch, refs, setStatus, setError);
  }, [url, cleanup, dispatch, refs]);

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnect || !refs.mounted.current) return;
    setReconnectCount((prev) => {
      if (prev >= maxReconnects) return prev;
      timerRef.current = setTimeout(() => {
        if (refs.mounted.current) connect();
      }, reconnectInterval);
      return prev + 1;
    });
  }, [shouldReconnect, maxReconnects, reconnectInterval, connect, refs]);

  useEffect(() => {
    if (status === 'error' && reconnectCount < maxReconnects) scheduleReconnect();
  }, [status, reconnectCount, maxReconnects, scheduleReconnect]);
  useEffect(() => {
    if (enabled) {
      setReconnectCount(0);
      connect();
    } else {
      cleanup();
      setStatus('closed');
    }
    return cleanup;
  }, [enabled, url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refs.mounted.current = true;
    return () => {
      refs.mounted.current = false;
      cleanup();
    };
  }, [cleanup, refs]);

  return {
    status, error, reconnectCount,
    disconnect: useCallback(() => {
      cleanup();
      setStatus('closed');
    }, [cleanup]),
    reconnect: useCallback(() => {
      setReconnectCount(0);
      connect();
    }, [connect]),
  };
}

export function useAgentStream(options: UseAgentStreamOptions): UseAgentStreamReturn {
  const {
    url, headers, enabled = true,
    reconnect: shouldReconnect = true,
    reconnectInterval = 3000, maxReconnects = 5,
    onApprove, onReject, showElapsedTime, showToolCalls,
    onError, onOpen, onClose,
  } = options;

  const { dispatch, props } = useAgentSteps({ onApprove, onReject, showElapsedTime, showToolCalls });

  const mountedRef = useRef(true);
  const headersRef = useRef(headers);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  useLayoutEffect(() => {
    headersRef.current = headers;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  });

  const refs = useRef<StreamRefs>({
    mounted: mountedRef, headers: headersRef,
    onOpen: onOpenRef, onClose: onCloseRef, onError: onErrorRef,
  }).current;

  const stream = useStreamConnection({
    url, enabled, shouldReconnect, reconnectInterval, maxReconnects, dispatch, refs,
  });

  return { props, ...stream };
}
