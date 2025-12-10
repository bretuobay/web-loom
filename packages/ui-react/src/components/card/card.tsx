import type { AnchorHTMLAttributes, HTMLAttributeAnchorTarget, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import '../../styles/design-system.css';
import './card.css';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Card title (appears in header) */
  title?: ReactNode;
  /** Card description/body content */
  description?: ReactNode;
  /** Badge displayed at the top of the card */
  badge?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Extra content to display in the header (top-right) */
  extra?: ReactNode;
  /** Whether to show border (default: true) */
  bordered?: boolean;
  /** Whether card is hoverable with lift effect (default: true) */
  hoverable?: boolean;
  /** Show loading skeleton */
  loading?: boolean;
  /** Card size */
  size?: 'default' | 'small';
  /** Cover image or media content */
  cover?: ReactNode;
  /** Array of action elements displayed at the bottom */
  actions?: ReactNode[];
  /** Make card a link */
  href?: string;
  /** Link rel attribute */
  rel?: string;
  /** Link target attribute */
  target?: HTMLAttributeAnchorTarget;
}

/**
 * Loading skeleton component
 */
const CardSkeleton = ({ size }: { size?: 'default' | 'small' }) => (
  <>
    <div className="loom-card-skeleton-header">
      <div className={cn('loom-card-skeleton-line', size === 'small' && 'loom-card-skeleton-line-small')} />
    </div>
    <div className="loom-card-skeleton-paragraph">
      <div className={cn('loom-card-skeleton-line', size === 'small' && 'loom-card-skeleton-line-small')} />
      <div className={cn('loom-card-skeleton-line', size === 'small' && 'loom-card-skeleton-line-small')} />
      <div
        className={cn('loom-card-skeleton-line', size === 'small' && 'loom-card-skeleton-line-small')}
        style={{ width: '60%' }}
      />
    </div>
  </>
);

const renderCardContent = ({
  title,
  badge,
  description,
  children,
  footer,
  extra,
  cover,
  actions,
  loading,
  size,
}: Pick<CardProps, 'title' | 'badge' | 'description' | 'children' | 'footer' | 'extra' | 'cover' | 'actions' | 'loading' | 'size'>) => (
  <>
    {cover ? <div className="loom-card-cover">{cover}</div> : null}
    <div className="loom-card-body">
      {loading ? (
        <CardSkeleton size={size} />
      ) : (
        <>
          {badge ? <span className="loom-card-badge">{badge}</span> : null}
          {title || extra ? (
            <header className="loom-card-header">
              {title ? (
                typeof title === 'string' ? (
                  <h3 className="loom-card-title">{title}</h3>
                ) : (
                  <div className="loom-card-title">{title}</div>
                )
              ) : null}
              {extra ? <div className="loom-card-extra">{extra}</div> : null}
            </header>
          ) : null}
          {description || children ? (
            <div className="loom-card-description">{description ?? children}</div>
          ) : null}
          {footer ? <div className="loom-card-footer">{footer}</div> : null}
        </>
      )}
    </div>
    {actions && actions.length > 0 ? (
      <div className="loom-card-actions">
        {actions.map((action, index) => (
          <div key={index} className="loom-card-action">
            {action}
          </div>
        ))}
      </div>
    ) : null}
  </>
);

/**
 * Card component for displaying content in a contained layout.
 * Supports various configurations including bordered, hoverable, loading states,
 * cover images, actions, and can be rendered as a link.
 */
export function Card({
  className,
  title,
  description,
  children,
  badge,
  footer,
  extra,
  bordered = true,
  hoverable = true,
  loading = false,
  size = 'default',
  cover,
  actions,
  href,
  rel,
  target,
  ...rest
}: CardProps) {
  const cardClasses = cn(
    'loom-card',
    {
      'loom-card-bordered': bordered,
      'loom-card-hoverable': hoverable,
      'loom-card-small': size === 'small',
      'loom-card-loading': loading,
    },
    className
  );

  const content = renderCardContent({
    title,
    badge,
    description,
    children,
    footer,
    extra,
    cover,
    actions,
    loading,
    size,
  });

  if (href) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        className={cardClasses}
        href={href}
        rel={rel ?? 'noreferrer noopener'}
        target={target ?? '_blank'}
        {...anchorProps}
      >
        {content}
      </a>
    );
  }

  return (
    <article className={cardClasses} {...rest}>
      {content}
    </article>
  );
}
