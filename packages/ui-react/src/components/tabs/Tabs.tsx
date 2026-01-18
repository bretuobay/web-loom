import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { useState, useCallback, Children, isValidElement, useRef, KeyboardEvent } from 'react';
import { cn } from '../../utils/cn';
import { TabsContext, type TabsContextValue } from './TabsContext';
import type { TabPaneProps } from './TabPane';
import '../../styles/design-system.css';
import './Tabs.css';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Currently active tab key (controlled) */
  activeKey?: string;
  /** Default active tab key (uncontrolled) */
  defaultActiveKey?: string;
  /** Tab type variant */
  type?: 'line' | 'card' | 'editable-card';
  /** Tab size */
  size?: 'large' | 'middle' | 'small';
  /** Position of tabs */
  tabPosition?: 'top' | 'right' | 'bottom' | 'left';
  /** Callback when active tab changes */
  onChange?: (activeKey: string) => void;
  /** Callback for editable tabs (add/remove) */
  onEdit?: (targetKey: string, action: 'add' | 'remove') => void;
  /** Tab panes */
  children?: ReactNode;
}

/**
 * Tabs component for organizing content in tabbed panels.
 * Supports multiple types, positions, keyboard navigation, and editable tabs.
 */
export function Tabs({
  className,
  activeKey: controlledActiveKey,
  defaultActiveKey,
  type = 'line',
  size = 'middle',
  tabPosition = 'top',
  onChange,
  onEdit,
  children,
  ...rest
}: TabsProps) {
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Get all tab keys from children
  const tabPanes = Children.toArray(children).filter((child): child is ReactElement<TabPaneProps> =>
    isValidElement(child),
  );

  const firstTabKey = tabPanes[0]?.props.tabKey;

  const [uncontrolledActiveKey, setUncontrolledActiveKey] = useState<string>(defaultActiveKey || firstTabKey || '');

  const isControlled = controlledActiveKey !== undefined;
  const activeKey = isControlled ? controlledActiveKey : uncontrolledActiveKey;

  const handleTabClick = useCallback(
    (key: string) => {
      if (!isControlled) {
        setUncontrolledActiveKey(key);
      }
      onChange?.(key);
    },
    [isControlled, onChange],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    const tabKeys = tabPanes.map((pane) => pane.props.tabKey);
    const currentIndex = tabKeys.indexOf(activeKey);

    let newIndex = currentIndex;

    switch (key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabKeys.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < tabKeys.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabKeys.length - 1;
        break;
      default:
        return;
    }

    const newKey = tabKeys[newIndex];
    if (newKey) {
      handleTabClick(newKey);
      // Focus the newly selected tab
      const tabElements = tabsListRef.current?.querySelectorAll('[role="tab"]');
      if (tabElements && tabElements[newIndex]) {
        (tabElements[newIndex] as HTMLElement).focus();
      }
    }
  };

  const contextValue: TabsContextValue = {
    activeKey,
    type,
    size,
    tabPosition,
    onTabClick: handleTabClick,
    onEdit,
  };

  const tabsClasses = cn('loom-tabs', `loom-tabs-${type}`, `loom-tabs-${size}`, `loom-tabs-${tabPosition}`, className);

  const isVertical = tabPosition === 'left' || tabPosition === 'right';

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={tabsClasses} {...rest}>
        <div
          className="loom-tabs-nav"
          role="tablist"
          aria-orientation={isVertical ? 'vertical' : 'horizontal'}
          onKeyDown={handleKeyDown}
          ref={tabsListRef}
        >
          {tabPanes.map((pane) => {
            const { tabKey, tab, disabled, closable = true } = pane.props;
            const isActive = activeKey === tabKey;

            return (
              <div
                key={tabKey}
                className={cn('loom-tabs-tab', {
                  'loom-tabs-tab-active': isActive,
                  'loom-tabs-tab-disabled': disabled,
                })}
                role="tab"
                aria-selected={isActive}
                aria-disabled={disabled}
                tabIndex={isActive ? 0 : -1}
                onClick={() => !disabled && handleTabClick(tabKey)}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleTabClick(tabKey);
                  }
                }}
              >
                <span className="loom-tabs-tab-label">{tab}</span>
                {type === 'editable-card' && closable && !disabled && (
                  <button
                    className="loom-tabs-tab-remove"
                    aria-label="Remove tab"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(tabKey, 'remove');
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
          {type === 'editable-card' && (
            <button className="loom-tabs-tab-add" aria-label="Add tab" onClick={() => onEdit?.('', 'add')}>
              +
            </button>
          )}
        </div>
        <div className="loom-tabs-content">
          {tabPanes.map((pane) => {
            const { tabKey } = pane.props;
            const isActive = activeKey === tabKey;
            return (
              <div
                key={tabKey}
                className={cn('loom-tabs-tabpane', {
                  'loom-tabs-tabpane-active': isActive,
                  'loom-tabs-tabpane-inactive': !isActive,
                })}
                role="tabpanel"
                aria-hidden={!isActive}
                tabIndex={0}
              >
                {pane}
              </div>
            );
          })}
        </div>
      </div>
    </TabsContext.Provider>
  );
}
