import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingText } from './StreamingText';

describe('StreamingText', () => {
  it('renders content text', () => {
    render(<StreamingText content="Hello world" isStreaming={false} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('has role="log" and aria-live="polite"', () => {
    const { container } = render(<StreamingText content="Test" isStreaming />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('role', 'log');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('shows cursor when streaming', () => {
    const { container } = render(<StreamingText content="Hello" isStreaming />);
    const cursor = container.querySelector('.an-streaming-text__cursor');
    expect(cursor).toBeInTheDocument();
    expect(cursor).not.toHaveClass('an-streaming-text__cursor--hidden');
  });

  it('hides cursor when not streaming (instant mode)', () => {
    const { container } = render(<StreamingText content="Done" isStreaming={false} />);
    const cursor = container.querySelector('.an-streaming-text__cursor');
    expect(cursor).toHaveClass('an-streaming-text__cursor--hidden');
  });

  it('cursor has aria-hidden="true"', () => {
    const { container } = render(<StreamingText content="Test" isStreaming />);
    const cursor = container.querySelector('.an-streaming-text__cursor');
    expect(cursor).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies line cursor style by default', () => {
    const { container } = render(<StreamingText content="Test" isStreaming />);
    const cursor = container.querySelector('.an-streaming-text__cursor');
    expect(cursor).toHaveClass('an-streaming-text__cursor--line');
  });

  it('applies block cursor style', () => {
    const { container } = render(<StreamingText content="Test" isStreaming cursorStyle="block" />);
    const cursor = container.querySelector('.an-streaming-text__cursor');
    expect(cursor).toHaveClass('an-streaming-text__cursor--block');
  });

  it('applies underscore cursor style', () => {
    const { container } = render(<StreamingText content="Test" isStreaming cursorStyle="underscore" />);
    const cursor = container.querySelector('.an-streaming-text__cursor');
    expect(cursor).toHaveClass('an-streaming-text__cursor--underscore');
  });

  it('applies className to root', () => {
    const { container } = render(
      <StreamingText content="Test" isStreaming className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('an-streaming-text', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <StreamingText
        content="Test"
        isStreaming
        classNames={{ root: 'custom-root', text: 'custom-text', cursor: 'custom-cursor' }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-streaming-text__text')).toHaveClass('custom-text');
    expect(container.querySelector('.an-streaming-text__cursor')).toHaveClass('custom-cursor');
  });

  it('fires onStreamEnd when streaming stops (instant mode)', () => {
    const onStreamEnd = vi.fn();
    const { rerender } = render(
      <StreamingText content="Hello" isStreaming onStreamEnd={onStreamEnd} />,
    );
    expect(onStreamEnd).not.toHaveBeenCalled();

    rerender(
      <StreamingText content="Hello world" isStreaming={false} onStreamEnd={onStreamEnd} />,
    );
    expect(onStreamEnd).toHaveBeenCalledTimes(1);
  });

  it('renders empty content without crashing', () => {
    const { container } = render(<StreamingText content="" isStreaming />);
    expect(container.querySelector('.an-streaming-text')).toBeInTheDocument();
  });

  it('displays content instantly when typingSpeed is undefined', () => {
    render(<StreamingText content="Instant text" isStreaming />);
    expect(screen.getByText('Instant text')).toBeInTheDocument();
  });
});
