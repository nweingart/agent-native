import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PermissionBadges } from './PermissionBadges';
import type { Permission } from '../../types';

const samplePermissions: Permission[] = [
  { id: 'read', name: 'File Read', granted: true, category: 'file', description: 'Read files' },
  { id: 'write', name: 'File Write', granted: true, category: 'file', description: 'Write files' },
  { id: 'shell', name: 'Shell', granted: false, category: 'shell', description: 'Execute shell commands' },
  { id: 'network', name: 'Network', granted: true, category: 'network', description: 'HTTP requests' },
];

describe('PermissionBadges', () => {
  it('renders with role="list"', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    expect(container.querySelector('[role="list"]')).toBeInTheDocument();
  });

  it('renders all permissions as list items', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items).toHaveLength(4);
  });

  it('renders inline layout by default', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    expect(container.firstChild).toHaveClass('an-permission-badges--inline');
    expect(container.firstChild).toHaveAttribute('data-layout', 'inline');
  });

  it('renders grid layout', () => {
    const { container } = render(
      <PermissionBadges permissions={samplePermissions} layout="grid" />,
    );
    expect(container.firstChild).toHaveClass('an-permission-badges--grid');
    expect(container.firstChild).toHaveAttribute('data-layout', 'grid');
  });

  it('applies granted class to granted permissions', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    const grantedBadges = container.querySelectorAll('.an-permission-badges__badge--granted');
    expect(grantedBadges).toHaveLength(3);
  });

  it('applies denied class to denied permissions', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    const deniedBadges = container.querySelectorAll('.an-permission-badges__badge--denied');
    expect(deniedBadges).toHaveLength(1);
  });

  it('renders permission names', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    const names = container.querySelectorAll('.an-permission-badges__badge-name');
    expect(names[0]?.textContent).toBe('File Read');
    expect(names[1]?.textContent).toBe('File Write');
    expect(names[2]?.textContent).toBe('Shell');
    expect(names[3]?.textContent).toBe('Network');
  });

  it('hides denied permissions when showDenied is false', () => {
    const { container } = render(
      <PermissionBadges permissions={samplePermissions} showDenied={false} />,
    );
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items).toHaveLength(3);
    expect(container.querySelector('.an-permission-badges__badge--denied')).not.toBeInTheDocument();
  });

  it('groups by category when groupByCategory is true', () => {
    const { container } = render(
      <PermissionBadges permissions={samplePermissions} groupByCategory />,
    );
    const groups = container.querySelectorAll('.an-permission-badges__group');
    expect(groups).toHaveLength(3); // file, shell, network
    const labels = container.querySelectorAll('.an-permission-badges__group-label');
    expect(labels[0]?.textContent).toBe('file');
    expect(labels[1]?.textContent).toBe('shell');
    expect(labels[2]?.textContent).toBe('network');
  });

  it('fires onPermissionClick callback', () => {
    const onClick = vi.fn();
    const { container } = render(
      <PermissionBadges permissions={samplePermissions} onPermissionClick={onClick} />,
    );
    const badges = container.querySelectorAll('.an-permission-badges__badge');
    fireEvent.click(badges[0]);
    expect(onClick).toHaveBeenCalledWith(samplePermissions[0]);
  });

  it('makes clickable badges keyboard accessible', () => {
    const onClick = vi.fn();
    const { container } = render(
      <PermissionBadges permissions={samplePermissions} onPermissionClick={onClick} />,
    );
    const badge = container.querySelector('.an-permission-badges__badge') as HTMLElement;
    expect(badge).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(badge, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(badge, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('does not make badges clickable without onPermissionClick', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    const badge = container.querySelector('.an-permission-badges__badge');
    expect(badge).not.toHaveAttribute('tabindex');
  });

  it('has aria-label with granted/denied state', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    const badges = container.querySelectorAll('.an-permission-badges__badge');
    expect(badges[0]).toHaveAttribute('aria-label', 'File Read: granted');
    expect(badges[2]).toHaveAttribute('aria-label', 'Shell: denied');
  });

  it('sets data-permission-id and data-granted attributes', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    const badge = container.querySelector('.an-permission-badges__badge');
    expect(badge).toHaveAttribute('data-permission-id', 'read');
    expect(badge).toHaveAttribute('data-granted', 'true');
  });

  it('shows description in grid layout', () => {
    const { container } = render(
      <PermissionBadges permissions={samplePermissions} layout="grid" />,
    );
    const descs = container.querySelectorAll('.an-permission-badges__badge-desc');
    expect(descs.length).toBeGreaterThan(0);
    expect(descs[0]?.textContent).toBe('Read files');
  });

  it('applies className to root', () => {
    const { container } = render(
      <PermissionBadges permissions={samplePermissions} className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('an-permission-badges', 'my-custom');
  });

  it('applies classNames overrides', () => {
    const { container } = render(
      <PermissionBadges
        permissions={samplePermissions}
        classNames={{
          root: 'custom-root',
          badge: 'custom-badge',
          badgeIcon: 'custom-icon',
          badgeName: 'custom-name',
        }}
      />,
    );
    expect(container.firstChild).toHaveClass('custom-root');
    expect(container.querySelector('.an-permission-badges__badge')).toHaveClass('custom-badge');
    expect(container.querySelector('.an-permission-badges__badge-icon')).toHaveClass('custom-icon');
    expect(container.querySelector('.an-permission-badges__badge-name')).toHaveClass('custom-name');
  });

  it('renders empty permissions without crashing', () => {
    const { container } = render(<PermissionBadges permissions={[]} />);
    expect(container.querySelector('.an-permission-badges')).toBeInTheDocument();
  });

  it('renders title attribute with description for tooltips', () => {
    const { container } = render(<PermissionBadges permissions={samplePermissions} />);
    const badge = container.querySelector('.an-permission-badges__badge');
    expect(badge).toHaveAttribute('title', 'Read files');
  });
});
