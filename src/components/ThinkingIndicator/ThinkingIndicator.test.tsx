import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThinkingIndicator } from './ThinkingIndicator';

describe('ThinkingIndicator', () => {
  it('renders when isThinking is true', () => {
    const { container } = render(<ThinkingIndicator isThinking />);
    expect(container.querySelector('.an-thinking-indicator')).toBeInTheDocument();
  });

  it('returns null when isThinking is false (after transition)', () => {
    const { container } = render(<ThinkingIndicator isThinking={false} />);
    expect(container.querySelector('.an-thinking-indicator')).not.toBeInTheDocument();
  });

  it('renders default label "Thinking"', () => {
    render(<ThinkingIndicator isThinking />);
    expect(screen.getByText('Thinking')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<ThinkingIndicator isThinking label="Reasoning..." />);
    expect(screen.getByText('Reasoning...')).toBeInTheDocument();
  });

  it('has role="status" and aria-live="polite"', () => {
    const { container } = render(<ThinkingIndicator isThinking />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-label from label prop', () => {
    const { container } = render(<ThinkingIndicator isThinking label="Deep thinking" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('aria-label', 'Deep thinking');
  });

  it('applies shimmer variant by default', () => {
    const { container } = render(<ThinkingIndicator isThinking />);
    expect(container.firstChild).toHaveClass('an-thinking-indicator--shimmer');
    expect(container.querySelector('.an-thinking-indicator__shimmer')).toBeInTheDocument();
  });

  it('applies dots variant', () => {
    const { container } = render(<ThinkingIndicator isThinking variant="dots" />);
    expect(container.firstChild).toHaveClass('an-thinking-indicator--dots');
    const dots = container.querySelectorAll('.an-thinking-indicator__dot');
    expect(dots).toHaveLength(3);
  });

  it('applies pulse variant', () => {
    const { container } = render(<ThinkingIndicator isThinking variant="pulse" />);
    expect(container.firstChild).toHaveClass('an-thinking-indicator--pulse');
    expect(container.querySelector('.an-thinking-indicator__pulse')).toBeInTheDocument();
  });

  it('applies className to root', () => {
    const { container } = render(
      <ThinkingIndicator isThinking className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('an-thinking-indicator', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <ThinkingIndicator
        isThinking
        classNames={{ root: 'custom-root', animation: 'custom-anim', label: 'custom-label' }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-thinking-indicator__animation')).toHaveClass('custom-anim');
    expect(container.querySelector('.an-thinking-indicator__label')).toHaveClass('custom-label');
  });
});
