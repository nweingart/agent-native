import React from 'react';
import { cn } from '../../utils/cn';

export interface TimelineConnectorProps {
  /** Fill percentage 0-100. Used to show progress through the connector. */
  fillPercent?: number;
  className?: string;
}

export function TimelineConnector({ fillPercent = 0, className }: TimelineConnectorProps) {
  return (
    <div className={cn('an-timeline__connector', className)}>
      {fillPercent > 0 && (
        <div
          className="an-timeline__connector-fill"
          style={{ height: `${Math.min(100, fillPercent)}%` }}
        />
      )}
    </div>
  );
}
