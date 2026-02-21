import React from 'react';
import type { ApprovalRequest } from '../../types';
import { cn } from '../../utils/cn';

export interface TimelineApprovalGateProps {
  request: ApprovalRequest;
  onApprove?: (request: ApprovalRequest) => void;
  onReject?: (request: ApprovalRequest) => void;
  className?: string;
  approveButtonClassName?: string;
  rejectButtonClassName?: string;
}

export function TimelineApprovalGate({
  request,
  onApprove,
  onReject,
  className,
  approveButtonClassName,
  rejectButtonClassName,
}: TimelineApprovalGateProps) {
  return (
    <div className={cn('an-timeline__approval', className)} data-approval-id={request.id}>
      <div className="an-timeline__approval-title">{request.title}</div>
      {request.description && (
        <div className="an-timeline__approval-description">{request.description}</div>
      )}
      <div className="an-timeline__approval-actions">
        <button
          type="button"
          className={cn('an-timeline__approval-btn an-timeline__approval-btn--approve', approveButtonClassName)}
          onClick={onApprove ? () => onApprove(request) : undefined}
        >
          Approve
        </button>
        <button
          type="button"
          className={cn('an-timeline__approval-btn an-timeline__approval-btn--reject', rejectButtonClassName)}
          onClick={onReject ? () => onReject(request) : undefined}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
