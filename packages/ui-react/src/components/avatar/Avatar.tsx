import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Avatar.module.css';

const SIZE_MAP = {
  small: 32,
  default: 40,
  large: 56,
} as const;

type AvatarShape = 'circle' | 'square';

type AvatarSize = number | keyof typeof SIZE_MAP;

type AvatarStyle = CSSProperties & {
  '--avatar-size'?: string;
  '--avatar-gap'?: string;
};

const clampNumber = (value: number) => Math.max(0, value);

const getInitials = (value?: string) => {
  if (!value) return '';
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return '';

  if (tokens.length === 1) {
    return tokens[0]!.slice(0, 2).toUpperCase();
  }

  const first = tokens[0]![0]!;
  const last = tokens[tokens.length - 1]![0]!;
  return `${first}${last}`.toUpperCase();
};

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  size?: AvatarSize;
  shape?: AvatarShape;
  src?: string;
  alt?: string;
  icon?: ReactNode;
  gap?: number;
  draggable?: boolean;
  onError?: () => boolean;
  children?: ReactNode;
}

const resolveSize = (size?: AvatarSize) => {
  if (typeof size === 'number') {
    return size;
  }
  return SIZE_MAP[size ?? 'default'];
};

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      size = 'default',
      shape = 'circle',
      src,
      alt,
      icon,
      gap = 0,
      draggable = false,
      onError,
      children,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const [hasImageError, setHasImageError] = useState(false);

    useEffect(() => {
      if (src) {
        setHasImageError(false);
      }
    }, [src]);

    const resolvedSize = resolveSize(size);

    const fallbackText = useMemo(() => {
      if (typeof children === 'string' || typeof children === 'number') {
        return String(children).trim();
      }
      return alt?.trim() ?? '';
    }, [children, alt]);

    const initials = getInitials(fallbackText);
    const shouldShowImage = Boolean(src) && !hasImageError;
    const labelText = alt ?? (fallbackText || 'Avatar');

    const styleVars: AvatarStyle = {
      ...(style ?? {}),
      '--avatar-size': `${resolvedSize}px`,
      '--avatar-gap': `${clampNumber(gap)}px`,
    } as AvatarStyle;

    const handleImageError = () => {
      const allowFallback = onError ? onError() : true;
      if (allowFallback !== false) {
        setHasImageError(true);
      }
    };

    const avatarClasses = cn(
      styles.avatar,
      styles[`shape-${shape}`],
      {
        [styles.hasImage]: shouldShowImage,
      },
      className
    );

    return (
      <span
        ref={ref}
        className={avatarClasses}
        draggable={draggable}
        style={styleVars}
        {...(shouldShowImage
          ? rest
          : {
              role: 'img',
              'aria-label': labelText,
              ...rest,
            })}
      >
        {shouldShowImage ? (
          <img
            src={src}
            alt={alt ?? (fallbackText || 'Avatar image')}
            className={styles.avatarImage}
            draggable={draggable}
            onError={handleImageError}
          />
        ) : (
          <span className={styles.fallback} aria-hidden="true">
            {icon ? (
              <span className={styles.iconWrapper}>{icon}</span>
            ) : initials ? (
              <span className={styles.initials}>{initials}</span>
            ) : (
              <span className={styles.placeholder} />
            )}
          </span>
        )}
      </span>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  maxCount?: number;
  size?: AvatarSize;
  gap?: number;
  description?: string;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      children,
      className,
      maxCount,
      size,
      gap = 8,
      description,
      style,
      ...rest
    },
    ref
  ) => {
    const childArray = useMemo(
      () => Children.toArray(children).filter(Boolean),
      [children]
    );

    const normalizedMax =
      typeof maxCount === 'number' ? Math.max(0, maxCount) : childArray.length;
    const visibleChildren = childArray.slice(0, normalizedMax);
    const overflowCount = Math.max(0, childArray.length - normalizedMax);
    const normalizedGap = clampNumber(gap);

    const { 'aria-label': ariaLabelProp, ...restProps } = rest;
    const groupLabel = ariaLabelProp ?? description ?? 'Avatar group';

    return (
      <div
        ref={ref}
        role="group"
        aria-label={groupLabel}
        className={cn(styles.group, className)}
        style={style}
        {...restProps}
      >
        {visibleChildren.map((child, index) => {
          const element = isValidElement(child)
            ? cloneElement(child as ReactElement<any>, {
                size: (child.props as any).size ?? size,
                className: cn((child.props as any).className, styles.groupAvatarChild),
              })
            : child;

          return (
            <span
              key={`avatar-${index}`}
              className={styles.groupItem}
              style={{
                marginLeft: index === 0 ? 0 : -normalizedGap,
                zIndex: index + 1,
              }}
            >
              {element}
            </span>
          );
        })}
        {overflowCount > 0 && (
          <span
            className={styles.groupItem}
            style={{
              marginLeft: visibleChildren.length === 0 ? 0 : -normalizedGap,
              zIndex: visibleChildren.length + 1,
            }}
            key="overflow"
          >
            <Avatar
              size={size}
              className={styles.overflowAvatar}
              aria-label={`${overflowCount} more avatars`}
            >
              +{overflowCount}
            </Avatar>
          </span>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';
