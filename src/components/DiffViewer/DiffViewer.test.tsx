import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DiffViewer } from './DiffViewer';
import type { DiffFile } from '../../types';

const sampleFile: DiffFile = {
  oldPath: 'src/utils.ts',
  newPath: 'src/utils.ts',
  status: 'modified',
  hunks: [
    {
      header: '@@ -1,3 +1,4 @@',
      oldStart: 1,
      oldCount: 3,
      newStart: 1,
      newCount: 4,
      lines: [
        { type: 'context', content: 'import { foo } from "bar";', oldLineNumber: 1, newLineNumber: 1 },
        { type: 'remove', content: 'const x = 1;', oldLineNumber: 2 },
        { type: 'add', content: 'const x = 2;', newLineNumber: 2 },
        { type: 'add', content: 'const y = 3;', newLineNumber: 3 },
        { type: 'context', content: 'export { foo };', oldLineNumber: 3, newLineNumber: 4 },
      ],
    },
  ],
};

describe('DiffViewer', () => {
  it('renders with role="table" and aria-label', () => {
    const { container } = render(<DiffViewer file={sampleFile} />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('role', 'table');
    expect(root).toHaveAttribute('aria-label', 'Diff: src/utils.ts');
  });

  it('renders file header with path and status badge', () => {
    const { container } = render(<DiffViewer file={sampleFile} />);
    expect(container.querySelector('.an-diff-viewer__header-path')?.textContent).toBe('src/utils.ts');
    expect(container.querySelector('.an-diff-viewer__header-badge')?.textContent).toBe('Modified');
    expect(container.querySelector('.an-diff-viewer__header-badge')).toHaveClass('an-diff-viewer__header-badge--modified');
  });

  it('hides header when showHeader is false', () => {
    const { container } = render(<DiffViewer file={sampleFile} showHeader={false} />);
    expect(container.querySelector('.an-diff-viewer__header')).not.toBeInTheDocument();
  });

  it('renders hunk header', () => {
    const { container } = render(<DiffViewer file={sampleFile} />);
    expect(container.querySelector('.an-diff-viewer__hunk-header')?.textContent).toBe('@@ -1,3 +1,4 @@');
  });

  it('renders all lines in unified view', () => {
    const { container } = render(<DiffViewer file={sampleFile} />);
    const lines = container.querySelectorAll('.an-diff-viewer__line');
    expect(lines).toHaveLength(5);
  });

  it('applies correct line type classes', () => {
    const { container } = render(<DiffViewer file={sampleFile} />);
    const lines = container.querySelectorAll('.an-diff-viewer__line');
    expect(lines[0]).toHaveClass('an-diff-viewer__line--context');
    expect(lines[1]).toHaveClass('an-diff-viewer__line--removed');
    expect(lines[2]).toHaveClass('an-diff-viewer__line--added');
  });

  it('renders line numbers by default', () => {
    const { container } = render(<DiffViewer file={sampleFile} />);
    const lineNumbers = container.querySelectorAll('.an-diff-viewer__line-number');
    expect(lineNumbers.length).toBeGreaterThan(0);
  });

  it('hides line numbers when showLineNumbers is false', () => {
    const { container } = render(<DiffViewer file={sampleFile} showLineNumbers={false} />);
    const lineNumbers = container.querySelectorAll('.an-diff-viewer__line-number');
    expect(lineNumbers).toHaveLength(0);
  });

  it('renders prefixes (+, -, space)', () => {
    const { container } = render(<DiffViewer file={sampleFile} />);
    const prefixes = container.querySelectorAll('.an-diff-viewer__line-prefix');
    expect(prefixes[0]?.textContent?.trim()).toBe('');
    expect(prefixes[1]?.textContent?.trim()).toBe('-');
    expect(prefixes[2]?.textContent?.trim()).toBe('+');
  });

  it('renders line content', () => {
    const { container } = render(<DiffViewer file={sampleFile} />);
    const contents = container.querySelectorAll('.an-diff-viewer__line-content');
    expect(contents[0]?.textContent).toBe('import { foo } from "bar";');
    expect(contents[1]?.textContent).toBe('const x = 1;');
  });

  it('fires onLineClick callback', () => {
    const onClick = vi.fn();
    const { container } = render(<DiffViewer file={sampleFile} onLineClick={onClick} />);
    const lines = container.querySelectorAll('.an-diff-viewer__line');
    fireEvent.click(lines[1]);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(sampleFile.hunks[0].lines[1], 0);
  });

  it('renders split view', () => {
    const { container } = render(<DiffViewer file={sampleFile} view="split" />);
    expect(container.firstChild).toHaveAttribute('data-view', 'split');
    const splitRows = container.querySelectorAll('.an-diff-viewer__split-row');
    expect(splitRows.length).toBeGreaterThan(0);
  });

  it('applies data-view attribute', () => {
    const { container } = render(<DiffViewer file={sampleFile} view="unified" />);
    expect(container.firstChild).toHaveAttribute('data-view', 'unified');
  });

  it('renders renamed file path with arrow', () => {
    const renamedFile: DiffFile = {
      ...sampleFile,
      oldPath: 'src/old.ts',
      newPath: 'src/new.ts',
      status: 'renamed',
      hunks: [],
    };
    const { container } = render(<DiffViewer file={renamedFile} />);
    expect(container.querySelector('.an-diff-viewer__header-path')?.textContent).toBe('src/old.ts → src/new.ts');
    expect(container.querySelector('.an-diff-viewer__header-badge')?.textContent).toBe('Renamed');
  });

  it('renders added file status', () => {
    const addedFile: DiffFile = { ...sampleFile, status: 'added', hunks: [] };
    const { container } = render(<DiffViewer file={addedFile} />);
    expect(container.querySelector('.an-diff-viewer__header-badge')).toHaveClass('an-diff-viewer__header-badge--added');
  });

  it('renders deleted file status', () => {
    const deletedFile: DiffFile = { ...sampleFile, status: 'deleted', hunks: [] };
    const { container } = render(<DiffViewer file={deletedFile} />);
    expect(container.querySelector('.an-diff-viewer__header-badge')).toHaveClass('an-diff-viewer__header-badge--deleted');
  });

  it('applies className to root', () => {
    const { container } = render(<DiffViewer file={sampleFile} className="my-custom" />);
    expect(container.firstChild).toHaveClass('an-diff-viewer', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <DiffViewer
        file={sampleFile}
        classNames={{
          root: 'custom-root',
          header: 'custom-header',
          headerPath: 'custom-path',
          headerBadge: 'custom-badge',
          hunk: 'custom-hunk',
          hunkHeader: 'custom-hunk-header',
          line: 'custom-line',
          lineNumber: 'custom-line-num',
          lineContent: 'custom-content',
        }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-diff-viewer__header')).toHaveClass('custom-header');
    expect(container.querySelector('.an-diff-viewer__header-path')).toHaveClass('custom-path');
    expect(container.querySelector('.an-diff-viewer__header-badge')).toHaveClass('custom-badge');
    expect(container.querySelector('.an-diff-viewer__hunk')).toHaveClass('custom-hunk');
    expect(container.querySelector('.an-diff-viewer__hunk-header')).toHaveClass('custom-hunk-header');
  });

  it('applies maxHeight style', () => {
    const { container } = render(<DiffViewer file={sampleFile} maxHeight={300} />);
    const body = container.querySelector('.an-diff-viewer__body') as HTMLElement;
    expect(body.style.maxHeight).toBe('300px');
    expect(body.style.overflow).toBe('auto');
  });

  it('handles string maxHeight', () => {
    const { container } = render(<DiffViewer file={sampleFile} maxHeight="50vh" />);
    const body = container.querySelector('.an-diff-viewer__body') as HTMLElement;
    expect(body.style.maxHeight).toBe('50vh');
  });

  it('renders empty hunks without crashing', () => {
    const emptyFile: DiffFile = { ...sampleFile, hunks: [] };
    const { container } = render(<DiffViewer file={emptyFile} />);
    expect(container.querySelector('.an-diff-viewer')).toBeInTheDocument();
  });
});
