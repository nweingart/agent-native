import React, { useEffect, useRef } from 'react';
import type { ToolCall, Artifact } from '../../types';
import { cn } from '../../utils/cn';
import { TimelineToolCall } from './TimelineToolCall';
import type { TimelineToolCallProps } from './TimelineToolCall';
import { TimelineArtifact } from './TimelineArtifact';
import type { TimelineArtifactProps } from './TimelineArtifact';

export interface TimelineToolCallListProps {
  toolCalls?: ToolCall[];
  artifacts?: Artifact[];
  showElapsedTime?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  renderToolContent?: TimelineToolCallProps['renderToolContent'];
  renderArtifactContent?: TimelineArtifactProps['renderArtifactContent'];
}

export function TimelineToolCallList({
  toolCalls,
  artifacts,
  showElapsedTime,
  defaultExpanded = false,
  className,
  renderToolContent,
  renderArtifactContent,
}: TimelineToolCallListProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const toolCallCount = toolCalls?.length ?? 0;
  const artifactCount = artifacts?.length ?? 0;
  const totalCount = toolCallCount + artifactCount;
  const hasRunning = toolCalls?.some((tc) => tc.status === 'running') ?? false;

  // Auto-expand when a tool call is running
  useEffect(() => {
    if (hasRunning && detailsRef.current && !detailsRef.current.open) {
      detailsRef.current.open = true;
    }
  }, [hasRunning]);

  if (totalCount === 0) return null;

  const summaryParts: string[] = [];
  if (toolCallCount > 0) {
    summaryParts.push(`${toolCallCount} tool call${toolCallCount === 1 ? '' : 's'}`);
  }
  if (artifactCount > 0) {
    summaryParts.push(`${artifactCount} artifact${artifactCount === 1 ? '' : 's'}`);
  }

  return (
    <details
      ref={detailsRef}
      className={cn('an-timeline__tool-list', className)}
      open={defaultExpanded || hasRunning || undefined}
    >
      <summary className="an-timeline__tool-list-summary">
        {summaryParts.join(', ')}
      </summary>
      <div className="an-timeline__tool-list-content">
        {toolCalls?.map((tc) => (
          <TimelineToolCall
            key={tc.id}
            toolCall={tc}
            showElapsedTime={showElapsedTime}
            defaultExpanded={defaultExpanded}
            renderToolContent={renderToolContent}
          />
        ))}
        {artifacts?.map((a) => (
          <TimelineArtifact
            key={a.id}
            artifact={a}
            renderArtifactContent={renderArtifactContent}
          />
        ))}
      </div>
    </details>
  );
}
