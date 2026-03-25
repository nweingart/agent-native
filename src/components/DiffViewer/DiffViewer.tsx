import { cn } from '../../utils/cn';
import type { DiffFile, DiffHunk, DiffLine } from '../../types';

export interface DiffViewerClassNames {
  root?: string;
  header?: string;
  headerPath?: string;
  headerBadge?: string;
  hunk?: string;
  hunkHeader?: string;
  line?: string;
  lineNumber?: string;
  lineContent?: string;
  addedLine?: string;
  removedLine?: string;
  contextLine?: string;
}

export interface DiffViewerProps {
  /** The diff data to render. */
  file: DiffFile;
  /** Display mode. Default: 'unified'. */
  view?: 'unified' | 'split';
  /** Show line numbers. Default: true. */
  showLineNumbers?: boolean;
  /** Show file header with path and status badge. Default: true. */
  showHeader?: boolean;
  /** Optional max height for scroll container. */
  maxHeight?: number | string;
  /** Callback when a line is clicked. */
  onLineClick?: (line: DiffLine, hunkIndex: number) => void;
  className?: string;
  classNames?: DiffViewerClassNames;
}

const STATUS_LABELS: Record<DiffFile['status'], string> = {
  added: 'Added',
  modified: 'Modified',
  deleted: 'Deleted',
  renamed: 'Renamed',
};

function getFilePath(file: DiffFile): string {
  if (file.status === 'renamed' && file.oldPath !== file.newPath) {
    return `${file.oldPath} → ${file.newPath}`;
  }
  return file.newPath || file.oldPath;
}

// ── Unified View ────────────────────────────────────────────────────

function UnifiedHunk({
  hunk,
  hunkIndex,
  showLineNumbers,
  onLineClick,
  classNames,
}: {
  hunk: DiffHunk;
  hunkIndex: number;
  showLineNumbers: boolean;
  onLineClick?: DiffViewerProps['onLineClick'];
  classNames?: DiffViewerClassNames;
}) {
  return (
    <div className={cn('an-diff-viewer__hunk', classNames?.hunk)} role="rowgroup">
      <div
        className={cn('an-diff-viewer__hunk-header', classNames?.hunkHeader)}
        role="row"
        aria-label={`Hunk: ${hunk.header}`}
      >
        <span role="cell">{hunk.header}</span>
      </div>
      {hunk.lines.map((line, lineIndex) => {
        const lineModifier =
          line.type === 'add'
            ? 'an-diff-viewer__line--added'
            : line.type === 'remove'
              ? 'an-diff-viewer__line--removed'
              : 'an-diff-viewer__line--context';

        const customClass =
          line.type === 'add'
            ? classNames?.addedLine
            : line.type === 'remove'
              ? classNames?.removedLine
              : classNames?.contextLine;

        return (
          <div
            key={`${hunkIndex}-${lineIndex}`}
            className={cn('an-diff-viewer__line', lineModifier, classNames?.line, customClass)}
            role="row"
            onClick={onLineClick ? () => onLineClick(line, hunkIndex) : undefined}
            data-line-type={line.type}
          >
            {showLineNumbers && (
              <>
                <span
                  className={cn('an-diff-viewer__line-number', classNames?.lineNumber)}
                  role="cell"
                  aria-label={line.oldLineNumber != null ? `old line ${line.oldLineNumber}` : undefined}
                >
                  {line.oldLineNumber ?? ''}
                </span>
                <span
                  className={cn('an-diff-viewer__line-number', classNames?.lineNumber)}
                  role="cell"
                  aria-label={line.newLineNumber != null ? `new line ${line.newLineNumber}` : undefined}
                >
                  {line.newLineNumber ?? ''}
                </span>
              </>
            )}
            <span
              className={cn('an-diff-viewer__line-prefix')}
              role="cell"
            >
              {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
            </span>
            <span
              className={cn('an-diff-viewer__line-content', classNames?.lineContent)}
              role="cell"
            >
              {line.content}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Split View ──────────────────────────────────────────────────────

function SplitHunk({
  hunk,
  hunkIndex,
  showLineNumbers,
  onLineClick,
  classNames,
}: {
  hunk: DiffHunk;
  hunkIndex: number;
  showLineNumbers: boolean;
  onLineClick?: DiffViewerProps['onLineClick'];
  classNames?: DiffViewerClassNames;
}) {
  // Build paired rows: context lines appear on both sides,
  // remove lines on left, add lines on right
  type SplitRow = { left: DiffLine | null; right: DiffLine | null };
  const rows: SplitRow[] = [];

  const removes: DiffLine[] = [];
  const adds: DiffLine[] = [];

  const flushPairs = () => {
    const max = Math.max(removes.length, adds.length);
    for (let i = 0; i < max; i++) {
      rows.push({
        left: removes[i] ?? null,
        right: adds[i] ?? null,
      });
    }
    removes.length = 0;
    adds.length = 0;
  };

  for (const line of hunk.lines) {
    if (line.type === 'context') {
      flushPairs();
      rows.push({ left: line, right: line });
    } else if (line.type === 'remove') {
      removes.push(line);
    } else {
      adds.push(line);
    }
  }
  flushPairs();

  return (
    <div className={cn('an-diff-viewer__hunk', classNames?.hunk)} role="rowgroup">
      <div
        className={cn('an-diff-viewer__hunk-header', 'an-diff-viewer__hunk-header--split', classNames?.hunkHeader)}
        role="row"
        aria-label={`Hunk: ${hunk.header}`}
      >
        <span role="cell">{hunk.header}</span>
      </div>
      {rows.map((row, rowIndex) => {
        const leftModifier = row.left
          ? row.left.type === 'remove'
            ? 'an-diff-viewer__split-cell--removed'
            : 'an-diff-viewer__split-cell--context'
          : 'an-diff-viewer__split-cell--empty';
        const rightModifier = row.right
          ? row.right.type === 'add'
            ? 'an-diff-viewer__split-cell--added'
            : 'an-diff-viewer__split-cell--context'
          : 'an-diff-viewer__split-cell--empty';

        return (
          <div
            key={`${hunkIndex}-split-${rowIndex}`}
            className={cn('an-diff-viewer__split-row', classNames?.line)}
            role="row"
          >
            {/* Left side */}
            <div
              className={cn('an-diff-viewer__split-cell', leftModifier)}
              onClick={row.left && onLineClick ? () => onLineClick(row.left!, hunkIndex) : undefined}
              data-line-type={row.left?.type ?? 'empty'}
            >
              {showLineNumbers && (
                <span className={cn('an-diff-viewer__line-number', classNames?.lineNumber)} role="cell">
                  {row.left?.oldLineNumber ?? ''}
                </span>
              )}
              <span className={cn('an-diff-viewer__line-prefix')} role="cell">
                {row.left ? (row.left.type === 'remove' ? '-' : ' ') : ''}
              </span>
              <span className={cn('an-diff-viewer__line-content', classNames?.lineContent)} role="cell">
                {row.left?.content ?? ''}
              </span>
            </div>
            {/* Right side */}
            <div
              className={cn('an-diff-viewer__split-cell', rightModifier)}
              onClick={row.right && onLineClick ? () => onLineClick(row.right!, hunkIndex) : undefined}
              data-line-type={row.right?.type ?? 'empty'}
            >
              {showLineNumbers && (
                <span className={cn('an-diff-viewer__line-number', classNames?.lineNumber)} role="cell">
                  {row.right?.newLineNumber ?? ''}
                </span>
              )}
              <span className={cn('an-diff-viewer__line-prefix')} role="cell">
                {row.right ? (row.right.type === 'add' ? '+' : ' ') : ''}
              </span>
              <span className={cn('an-diff-viewer__line-content', classNames?.lineContent)} role="cell">
                {row.right?.content ?? ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export function DiffViewer({
  file,
  view = 'unified',
  showLineNumbers = true,
  showHeader = true,
  maxHeight,
  onLineClick,
  className,
  classNames,
}: DiffViewerProps) {
  const HunkComponent = view === 'split' ? SplitHunk : UnifiedHunk;

  return (
    <div
      className={cn(
        'an-diff-viewer',
        view === 'split' && 'an-diff-viewer--split',
        className,
        classNames?.root,
      )}
      role="table"
      aria-label={`Diff: ${getFilePath(file)}`}
      data-view={view}
    >
      {showHeader && (
        <div className={cn('an-diff-viewer__header', classNames?.header)}>
          <span className={cn('an-diff-viewer__header-path', classNames?.headerPath)}>
            {getFilePath(file)}
          </span>
          <span
            className={cn(
              'an-diff-viewer__header-badge',
              `an-diff-viewer__header-badge--${file.status}`,
              classNames?.headerBadge,
            )}
          >
            {STATUS_LABELS[file.status]}
          </span>
        </div>
      )}
      <div
        className="an-diff-viewer__body"
        style={maxHeight ? { maxHeight, overflow: 'auto' } : undefined}
      >
        {file.hunks.map((hunk, i) => (
          <HunkComponent
            key={i}
            hunk={hunk}
            hunkIndex={i}
            showLineNumbers={showLineNumbers}
            onLineClick={onLineClick}
            classNames={classNames}
          />
        ))}
      </div>
    </div>
  );
}
