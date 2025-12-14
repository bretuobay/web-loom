import React from 'react';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbRoute {
  path: string;
  breadcrumbName: string;
}

export interface BreadcrumbProps {
  separator?: React.ReactNode;
  routes?: BreadcrumbRoute[];
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface BreadcrumbItemProps {
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLSpanElement>;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isCurrent?: boolean;
}

export interface BreadcrumbSeparatorProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Breadcrumb: React.FC<BreadcrumbProps> & {
  Item: React.FC<BreadcrumbItemProps>;
  Separator: React.FC<BreadcrumbSeparatorProps>;
} = ({ separator = '/', routes, children, className, style }) => {
  let items: React.ReactNode[] = [];

  if (routes && routes.length) {
    items = routes.map((route, idx) => {
      const isLast = idx === routes.length - 1;
      return (
        <Breadcrumb.Item
          key={route.path || route.breadcrumbName || idx}
          href={!isLast ? route.path : undefined}
          isCurrent={isLast}
        >
          {route.breadcrumbName}
        </Breadcrumb.Item>
      );
    });
  } else if (children) {
    items = React.Children.toArray(children);
  }

  return (
    <nav className={[styles.breadcrumb, className].filter(Boolean).join(' ')} style={style} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, idx) => [
          <li key={idx} className={styles.item}>
            {item}
          </li>,
          idx < items.length - 1 && (
            <li key={`sep-${idx}`} className={styles.separator} aria-hidden="true">
              {separator}
            </li>
          ),
        ])}
      </ol>
    </nav>
  );
};

Breadcrumb.Item = function BreadcrumbItem({ href, onClick, children, className, style, isCurrent }) {
  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={[styles.link, className].filter(Boolean).join(' ')}
        style={style}
        aria-current={isCurrent ? 'page' : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <span
      onClick={onClick}
      className={[styles.link, className].filter(Boolean).join(' ')}
      style={style}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {children}
    </span>
  );
};

Breadcrumb.Separator = function BreadcrumbSeparator({ children = '/', className, style }) {
  return (
    <span className={[styles.separator, className].filter(Boolean).join(' ')} style={style} aria-hidden="true">
      {children}
    </span>
  );
};
