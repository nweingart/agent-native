import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TerminalOutput } from './TerminalOutput';

describe('TerminalOutput', () => {
  const sampleLines = [
    'Installing dependencies...',
    '\x1b[32m+ added 42 packages\x1b[0m',
    'Done in 3.2s',
  ];

  it('renders lines', () => {
    const { container } = render(<TerminalOutput lines={sampleLines} />);
    const lines = container.querySelectorAll('.an-terminal__line');
    expect(lines).toHaveLength(3);
  });

  it('has role="log" and aria-live on body', () => {
    const { container } = render(<TerminalOutput lines={sampleLines} />);
    const body = container.querySelector('.an-terminal__body');
    expect(body).toHaveAttribute('role', 'log');
    expect(body).toHaveAttribute('aria-live', 'polite');
  });

  it('renders line numbers', () => {
    const { container } = render(<TerminalOutput lines={sampleLines} />);
    const nums = container.querySelectorAll('.an-terminal__line-number');
    expect(nums).toHaveLength(3);
    expect(nums[0]?.textContent).toBe('1');
    expect(nums[2]?.textContent).toBe('3');
  });

  it('renders line content', () => {
    const { container } = render(<TerminalOutput lines={['hello world']} />);
    const content = container.querySelector('.an-terminal__line-content');
    expect(content?.textContent).toBe('hello world');
  });

  it('parses ANSI colors and renders spans with classes', () => {
    const { container } = render(
      <TerminalOutput lines={['\x1b[32mgreen text\x1b[0m']} />,
    );
    const span = container.querySelector('.an-terminal__ansi--green');
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe('green text');
  });

  it('handles ANSI bold', () => {
    const { container } = render(
      <TerminalOutput lines={['\x1b[1mbold text\x1b[0m']} />,
    );
    expect(container.querySelector('.an-terminal__ansi--bold')).toBeInTheDocument();
  });

  it('renders title in header', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} title="npm install" />,
    );
    expect(container.querySelector('.an-terminal__title')?.textContent).toBe('npm install');
  });

  it('renders exit code 0 with success class', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} title="build" exitCode={0} />,
    );
    const badge = container.querySelector('.an-terminal__exit-code');
    expect(badge).toHaveClass('an-terminal__exit-code--success');
    expect(badge?.textContent).toBe('exit 0');
  });

  it('renders nonzero exit code with error class', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} title="build" exitCode={1} />,
    );
    const badge = container.querySelector('.an-terminal__exit-code');
    expect(badge).toHaveClass('an-terminal__exit-code--error');
    expect(badge?.textContent).toBe('exit 1');
  });

  it('shows streaming cursor when isStreaming', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} isStreaming />,
    );
    expect(container.querySelector('.an-terminal__cursor')).toBeInTheDocument();
  });

  it('hides streaming cursor when not streaming', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} isStreaming={false} />,
    );
    expect(container.querySelector('.an-terminal__cursor')).not.toBeInTheDocument();
  });

  it('shows streaming badge in header', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} title="build" isStreaming />,
    );
    expect(container.querySelector('.an-terminal__streaming-badge')).toBeInTheDocument();
  });

  it('fires onLineClick callback', () => {
    const onClick = vi.fn();
    const { container } = render(
      <TerminalOutput lines={sampleLines} onLineClick={onClick} />,
    );
    const lines = container.querySelectorAll('.an-terminal__line');
    fireEvent.click(lines[1]);
    expect(onClick).toHaveBeenCalledWith(sampleLines[1], 1);
  });

  it('renders as collapsible details element', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} collapsible title="build" />,
    );
    const details = container.querySelector('details.an-terminal');
    expect(details).toBeInTheDocument();
    expect(details).toHaveAttribute('open');
    expect(container.querySelector('.an-terminal__summary')?.textContent).toContain('build');
  });

  it('collapsible respects defaultExpanded=false', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} collapsible defaultExpanded={false} />,
    );
    const details = container.querySelector('details.an-terminal');
    expect(details).not.toHaveAttribute('open');
  });

  it('applies className to root', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('an-terminal', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <TerminalOutput
        lines={sampleLines}
        title="test"
        exitCode={0}
        classNames={{
          root: 'custom-root',
          header: 'custom-header',
          title: 'custom-title',
          exitCode: 'custom-exit',
          body: 'custom-body',
          line: 'custom-line',
          lineNumber: 'custom-num',
        }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-terminal__header')).toHaveClass('custom-header');
    expect(container.querySelector('.an-terminal__title')).toHaveClass('custom-title');
    expect(container.querySelector('.an-terminal__exit-code')).toHaveClass('custom-exit');
    expect(container.querySelector('.an-terminal__body')).toHaveClass('custom-body');
  });

  it('sets data-streaming attribute when streaming', () => {
    const { container } = render(
      <TerminalOutput lines={sampleLines} isStreaming />,
    );
    expect(container.firstChild).toHaveAttribute('data-streaming');
  });

  it('renders empty lines array without crashing', () => {
    const { container } = render(<TerminalOutput lines={[]} />);
    expect(container.querySelector('.an-terminal')).toBeInTheDocument();
  });
});
