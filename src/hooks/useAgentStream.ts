import { useState, useEffect, useRef, useCallback } from 'react';
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

export function useAgentStream(options: UseAgentStreamOptions): UseAgentStreamReturn {
  const {
    url,
    headers,
    enabled = true,
    reconnect: shouldReconnect = true,
    reconnectInterval = 3000,
    maxReconnects = 5,
    onApprove,
    onReject,
    showElapsedTime,
    showToolCalls,
    onError,
    onOpen,
    onClose,
  } = options;

  const { dispatch, props, reset } = useAgentSteps({
    onApprove,
    onReject,
    showElapsedTime,
    showToolCalls,
  });

  const [status, setStatus] = useState<StreamStatus>('closed');
  const [error, setError] = useState<Error | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const headersRef = useRef(headers);
  headersRef.current = headers;

  const cleanup = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    cleanup();

    if (!mountedRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('connecting');
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/x-ndjson',
          ...headersRef.current,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      if (mountedRef.current) {
        setStatus('open');
        onOpen?.();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const event = JSON.parse(trimmed) as AgentEvent;
            if (mountedRef.current) {
              dispatch(event);
            }
          } catch {
            // Skip malformed lines
          }
        }
      }

      // Stream ended normally
      if (mountedRef.current) {
        setStatus('closed');
        onClose?.();
      }
    } catch (err) {
      if (controller.signal.aborted) return;

      const streamError = err instanceof Error ? err : new Error(String(err));
      if (mountedRef.current) {
        setStatus('error');
        setError(streamError);
        onError?.(streamError);
      }
    }
  }, [url, cleanup, dispatch, onOpen, onClose, onError]);

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnect || !mountedRef.current) return;

    setReconnectCount((prev) => {
      if (prev >= maxReconnects) return prev;

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, reconnectInterval);

      return prev + 1;
    });
  }, [shouldReconnect, maxReconnects, reconnectInterval, connect]);

  // Auto-reconnect on error/close
  useEffect(() => {
    if (status === 'error' && reconnectCount < maxReconnects) {
      scheduleReconnect();
    }
  }, [status, reconnectCount, maxReconnects, scheduleReconnect]);

  // Connect/disconnect based on enabled
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

  // Mounted tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus('closed');
  }, [cleanup]);

  const manualReconnect = useCallback(() => {
    setReconnectCount(0);
    connect();
  }, [connect]);

  return {
    props,
    status,
    error,
    reconnectCount,
    disconnect,
    reconnect: manualReconnect,
  };
}
