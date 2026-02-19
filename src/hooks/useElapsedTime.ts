import { useState, useEffect, useRef } from 'react';

/**
 * Returns a formatted elapsed time string that updates live.
 * Shows "0s", "1s", ..., "1m 5s", "1h 2m 3s".
 *
 * @param startedAt - Unix timestamp (ms) when the timer started, or undefined to pause.
 * @param completedAt - Unix timestamp (ms) when the timer stopped, or undefined if still running.
 * @param interval - Update interval in ms. Default: 1000.
 */
export function useElapsedTime(
  startedAt: number | undefined,
  completedAt?: number | undefined,
  interval = 1000,
): string {
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedAt == null || completedAt != null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setNow(Date.now());
    timerRef.current = setInterval(() => setNow(Date.now()), interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [startedAt, completedAt, interval]);

  if (startedAt == null) return '0s';

  const endTime = completedAt ?? now;
  const totalSeconds = Math.max(0, Math.floor((endTime - startedAt) / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
