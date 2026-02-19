import React from 'react';
import type { ApprovalRequest } from '../../types';
import { cn } from '../../utils/cn';

export interface TimelineApprovalGateProps {
  request: ApprovalRequest;
  onApprove?: (request: ApprovalRequest) => void;
  onReject?: (request: ApprovalRequest) => void;
  className?: string;
}

export function TimelineApprovalGate({
  request,
  onApprove,
  onReject,
  className,
}: TimelineApprovalGateProps) {
  return (
    <div className={cn('an-timeline__approval', className)} data-approval-id={request.id}>
      <div className="an-timeline__approval-title">{request.title}</div>
      {request.description && (
        <div className="an-timeline__approval-description">{request.description}</div>
      )}
      <div className="an-timeline__approval-actions">
        {onApprove && (
          <button
            type="button"
            className="an-timeline__approval-btn an-timeline__approval-btn--approve"
            onClick={() => onApprove(request)}
          >
            Approve
          </button>
        )}
        {onReject && (
          <button
            type="button"
            className="an-timeline__approval-btn an-timeline__approval-btn--reject"
            onClick={() => onReject(request)}
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
}
