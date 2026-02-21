import React from 'react';
import type { Artifact } from '../../types';
import { cn } from '../../utils/cn';

export interface TimelineArtifactProps {
  artifact: Artifact;
  className?: string;
  renderArtifactContent?: (artifact: Artifact) => React.ReactNode;
}

const KIND_LABELS: Record<string, string> = {
  code: 'Code',
  file: 'File',
  diff: 'Diff',
  image: 'Image',
  text: 'Text',
  json: 'JSON',
  markdown: 'Markdown',
};

function truncateToLines(text: string, maxLines: number): { truncated: string; isTruncated: boolean } {
  const lines = text.split('\n');
  if (lines.length <= maxLines) return { truncated: text, isTruncated: false };
  return { truncated: lines.slice(0, maxLines).join('\n'), isTruncated: true };
}

export function TimelineArtifact({
  artifact,
  className,
  renderArtifactContent,
}: TimelineArtifactProps) {
  const label = KIND_LABELS[artifact.kind] ?? artifact.kind;
  const usePreBlock = artifact.kind === 'code' || artifact.kind === 'json' || artifact.kind === 'diff';
  const { truncated, isTruncated } = truncateToLines(artifact.content, 3);

  return (
    <div
      className={cn(
        'an-timeline__artifact',
        `an-timeline__artifact--${artifact.kind}`,
        className,
      )}
      data-artifact-id={artifact.id}
    >
      <div className="an-timeline__artifact-header">
        <span className="an-timeline__artifact-badge">{label}</span>
        <span className="an-timeline__artifact-title">
          {artifact.title ?? label}
        </span>
      </div>

      {renderArtifactContent ? (
        renderArtifactContent(artifact)
      ) : artifact.kind === 'image' ? (
        <div className="an-timeline__artifact-content an-timeline__artifact-content--placeholder">
          [Image: {artifact.title ?? artifact.id}]
        </div>
      ) : isTruncated ? (
        <details className="an-timeline__artifact-details">
          <summary className="an-timeline__artifact-preview">
            {usePreBlock ? (
              <pre className="an-timeline__artifact-content">{truncated}{'…'}</pre>
            ) : (
              <div className="an-timeline__artifact-content">{truncated}{'…'}</div>
            )}
          </summary>
          {usePreBlock ? (
            <pre className="an-timeline__artifact-content">{artifact.content}</pre>
          ) : (
            <div className="an-timeline__artifact-content">{artifact.content}</div>
          )}
        </details>
      ) : (
        usePreBlock ? (
          <pre className="an-timeline__artifact-content">{artifact.content}</pre>
        ) : (
          <div className="an-timeline__artifact-content">{artifact.content}</div>
        )
      )}
    </div>
  );
}
