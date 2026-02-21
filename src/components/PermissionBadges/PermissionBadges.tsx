import { cn } from '../../utils/cn';
import type { Permission } from '../../types';

export interface PermissionBadgesClassNames {
  root?: string;
  badge?: string;
  badgeIcon?: string;
  badgeName?: string;
  group?: string;
  groupLabel?: string;
}

export interface PermissionBadgesProps {
  /** List of permissions. */
  permissions: Permission[];
  /** Layout mode. Default: 'inline'. */
  layout?: 'inline' | 'grid';
  /** Show denied permissions. Default: true. */
  showDenied?: boolean;
  /** Group badges by category. Default: false. */
  groupByCategory?: boolean;
  /** Callback when a badge is clicked. */
  onPermissionClick?: (permission: Permission) => void;
  className?: string;
  classNames?: PermissionBadgesClassNames;
}

function CheckIcon() {
  return (
    <svg
      className="an-permission-badges__icon"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="an-permission-badges__icon"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Badge({
  permission,
  layout,
  isClickable,
  onPermissionClick,
  classNames,
}: {
  permission: Permission;
  layout: 'inline' | 'grid';
  isClickable: boolean;
  onPermissionClick?: (permission: Permission) => void;
  classNames?: PermissionBadgesClassNames;
}) {
  const handleClick = () => {
    if (onPermissionClick) onPermissionClick(permission);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onPermissionClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onPermissionClick(permission);
    }
  };

  return (
    <div
      className={cn(
        'an-permission-badges__badge',
        `an-permission-badges__badge--${layout}`,
        permission.granted ? 'an-permission-badges__badge--granted' : 'an-permission-badges__badge--denied',
        isClickable && 'an-permission-badges__badge--clickable',
        classNames?.badge,
      )}
      role="listitem"
      aria-label={`${permission.name}: ${permission.granted ? 'granted' : 'denied'}`}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      title={permission.description}
      data-permission-id={permission.id}
      data-granted={permission.granted}
    >
      <span className={cn('an-permission-badges__badge-icon', classNames?.badgeIcon)}>
        {permission.granted ? <CheckIcon /> : <XIcon />}
      </span>
      <span className={cn('an-permission-badges__badge-name', classNames?.badgeName)}>
        {permission.name}
      </span>
      {layout === 'grid' && permission.description && (
        <span className="an-permission-badges__badge-desc">
          {permission.description}
        </span>
      )}
    </div>
  );
}

export function PermissionBadges({
  permissions,
  layout = 'inline',
  showDenied = true,
  groupByCategory = false,
  onPermissionClick,
  className,
  classNames,
}: PermissionBadgesProps) {
  const filtered = showDenied ? permissions : permissions.filter((p) => p.granted);
  const isClickable = !!onPermissionClick;

  if (groupByCategory) {
    const groups = new Map<string, Permission[]>();
    for (const p of filtered) {
      const cat = p.category ?? 'Other';
      const group = groups.get(cat) ?? [];
      group.push(p);
      groups.set(cat, group);
    }

    return (
      <div
        className={cn(
          'an-permission-badges',
          `an-permission-badges--${layout}`,
          'an-permission-badges--grouped',
          className,
          classNames?.root,
        )}
        data-layout={layout}
      >
        {Array.from(groups).map(([category, perms]) => (
          <div key={category} className={cn('an-permission-badges__group', classNames?.group)}>
            <div className={cn('an-permission-badges__group-label', classNames?.groupLabel)}>
              {category}
            </div>
            <div className="an-permission-badges__group-items" role="list" aria-label={`${category} permissions`}>
              {perms.map((p) => (
                <Badge
                  key={p.id}
                  permission={p}
                  layout={layout}
                  isClickable={isClickable}
                  onPermissionClick={onPermissionClick}
                  classNames={classNames}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'an-permission-badges',
        `an-permission-badges--${layout}`,
        className,
        classNames?.root,
      )}
      role="list"
      aria-label="Agent permissions"
      data-layout={layout}
    >
      {filtered.map((p) => (
        <Badge
          key={p.id}
          permission={p}
          layout={layout}
          isClickable={isClickable}
          onPermissionClick={onPermissionClick}
          classNames={classNames}
        />
      ))}
    </div>
  );
}
