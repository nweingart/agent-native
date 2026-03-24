import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgentStream } from './useAgentStream';

function makeReadableStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = lines.map((l) => encoder.encode(l));
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
}

function mockFetchOk(lines: string[]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    body: makeReadableStream(lines),
  });
}

function mockFetchError(status: number, statusText: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    body: null,
  });
}

describe('useAgentStream', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('connects and parses NDJSON events', async () => {
    const events = [
      JSON.stringify({ type: 'step.started', step: { id: 's1', label: 'S1' } }) + '\n',
      JSON.stringify({ type: 'step.completed', stepId: 's1' }) + '\n',
    ];
    vi.stubGlobal('fetch', mockFetchOk(events));

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', reconnect: false }),
    );

    await waitFor(() => expect(result.current.status).toBe('closed'));
    expect(result.current.props.steps).toHaveLength(1);
    expect(result.current.props.steps![0].status).toBe('complete');
  });

  it('sets error status on HTTP error', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', reconnect: false, onError }),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toContain('500');
    expect(onError).toHaveBeenCalled();
  });

  it('sets error when response body is null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      body: null,
    }));

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', reconnect: false }),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toContain('null');
  });

  it('calls onOpen and onClose callbacks', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    vi.stubGlobal('fetch', mockFetchOk(['{"type":"reset"}\n']));

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', reconnect: false, onOpen, onClose }),
    );

    await waitFor(() => expect(result.current.status).toBe('closed'));
    expect(onOpen).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('skips malformed JSON lines', async () => {
    const lines = [
      'not json\n',
      JSON.stringify({ type: 'step.started', step: { id: 's1', label: 'S1' } }) + '\n',
    ];
    vi.stubGlobal('fetch', mockFetchOk(lines));

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', reconnect: false }),
    );

    await waitFor(() => expect(result.current.status).toBe('closed'));
    expect(result.current.props.steps).toHaveLength(1);
  });

  it('does not connect when enabled is false', () => {
    const fetchMock = mockFetchOk([]);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', enabled: false }),
    );

    expect(result.current.status).toBe('closed');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('disconnect sets status to closed', async () => {
    vi.stubGlobal('fetch', mockFetchOk([
      JSON.stringify({ type: 'step.started', step: { id: 's1', label: 'S1' } }) + '\n',
    ]));

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', reconnect: false }),
    );

    await waitFor(() => expect(result.current.status).toBe('closed'));
    act(() => result.current.disconnect());
    expect(result.current.status).toBe('closed');
  });

  it('manual reconnect resets reconnect count', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 500, statusText: 'Error', body: null });
      }
      return Promise.resolve({
        ok: true, status: 200, statusText: 'OK',
        body: makeReadableStream(['{"type":"reset"}\n']),
      });
    }));

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', reconnect: false }),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.reconnect());
    await waitFor(() => expect(result.current.status).toBe('closed'));
    expect(result.current.reconnectCount).toBe(0);
  });

  it('handles buffered incomplete lines across chunks', async () => {
    const part1 = '{"type":"step.started","step":{"id":"s1"';
    const part2 = ',"label":"S1"}}\n';
    vi.stubGlobal('fetch', mockFetchOk([part1, part2]));

    const { result } = renderHook(() =>
      useAgentStream({ url: 'http://test/stream', reconnect: false }),
    );

    await waitFor(() => expect(result.current.status).toBe('closed'));
    expect(result.current.props.steps).toHaveLength(1);
  });

  it('sends custom headers', async () => {
    const fetchMock = mockFetchOk(['{"type":"reset"}\n']);
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() =>
      useAgentStream({
        url: 'http://test/stream',
        headers: { Authorization: 'Bearer token' },
        reconnect: false,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const callHeaders = fetchMock.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBe('Bearer token');
    expect(callHeaders.Accept).toBe('application/x-ndjson');
  });
});
