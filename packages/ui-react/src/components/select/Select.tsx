import {
  Children,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ForwardedRef,
  type KeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
  type ReactNode,
  type UIEvent,
} from 'react';
import {
  createListSelection,
  createRovingFocus,
  type ListSelectionBehavior,
  type ListSelectionState,
  type RovingFocusBehavior,
  type RovingFocusState,
} from '@web-loom/ui-core/behaviors';
import { Input } from '../input';
import { cn } from '../../utils/cn';
import styles from './Select.module.css';

const ITEM_HEIGHT = 38;
const DROPDOWN_MAX_HEIGHT = 260;
const OVERSCAN_COUNT = 3;

export interface SelectOptionItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  title?: string;
  key?: string;
}

export interface SelectOptGroup {
  label: ReactNode;
  key?: string;
  options: SelectOptionItem[];
}

export type SelectOptionDefinition = SelectOptionItem | SelectOptGroup;

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  mode?: 'multiple' | 'tags';
  allowClear?: boolean;
  showSearch?: boolean;
  filterOption?:
    | boolean
    | ((input: string, option: SelectRenderedOption) => boolean);
  options?: SelectOptionDefinition[];
  loading?: boolean;
  notFoundContent?: ReactNode;
  /** Controlled value */
  value?: string | string[];
  /** Uncontrolled default value */
  defaultValue?: string | string[];
  placeholder?: ReactNode;
  disabled?: boolean;
  onChange?: (value: string | string[] | undefined) => void;
  children?: ReactNode;
}

export interface SelectOptionProps extends SelectOptionItem {}

export interface SelectOptGroupProps extends SelectOptGroup {}

type SelectEntry =
  | {
      type: 'group';
      key: string;
      label: ReactNode;
    }
  | (SelectRenderedOption & { type: 'option' });

export interface SelectRenderedOption {
  type: 'option';
  key: string;
  value: string;
  label: ReactNode;
  disabled?: boolean;
  title?: string;
  group?: ReactNode;
}

const noopFilter = () => true;

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as MutableRefObject<T | null>).current = value;
}

function ensureValueArray(value?: string | string[]): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeOptionDefinition(
  definition: SelectOptionDefinition,
  groupLabel?: ReactNode,
  groupKey?: string,
): SelectRenderedOption[] {
  if ('options' in definition) {
    return definition.options.flatMap((option, index) => ({
      type: 'option',
      key: option.key ?? `${groupKey ?? 'group'}-${option.value}-${index}`,
      value: option.value,
      label: option.label,
      disabled: option.disabled,
      title: option.title,
      group: definition.label,
    }));
  }
  return [
    {
      type: 'option',
      key: definition.key ?? `${groupKey ?? 'flat'}-${definition.value}`,
      value: definition.value,
      label: definition.label,
      disabled: definition.disabled,
      title: definition.title,
      group: groupLabel,
    },
  ];
}

function buildOptionsFromChildren(children: ReactNode): SelectRenderedOption[] {
  const normalized: SelectRenderedOption[] = [];

  Children.forEach(children, (child) => {
    if (!child || typeof child === 'string' || typeof child === 'number') return;

    if (!('type' in child)) return;

    const elementType = (child as React.ReactElement).type as any;
    if (elementType?.displayName === 'Select.OptGroup') {
      const { label, children: nested, key } = (child as React.ReactElement<SelectOptGroupProps>).props;
      const childOptions = buildOptionsFromChildren(nested);
      const grouped = childOptions.map((option, index) => ({
        ...option,
        group: label,
        key: `${key ?? 'optgroup'}-${index}-${option.value}`,
      }));
      normalized.push(...grouped);
      return;
    }

    if (elementType?.displayName === 'Select.Option') {
      const { value, label, disabled, title, key } = (child as React.ReactElement<SelectOptionProps>).props;
      normalized.push({
        type: 'option',
        value,
        label: label ?? value,
        disabled,
        title,
        key: key ?? `option-${value}`,
      });
    }
  });

  return normalized;
}

function buildRenderNodesFromOptions(options: SelectRenderedOption[], search: string, filterFn: typeof noopFilter) {
  const nodes: SelectEntry[] = [];
  const seenGroupLabels = new Set<string>();
  const trimmedSearch = search.trim();

  const matches: SelectRenderedOption[] = trimmedSearch
    ? options.filter((option) => filterFn(trimmedSearch, option))
    : options;

  matches.forEach((option) => {
    if (option.group && !seenGroupLabels.has(String(option.group))) {
      seenGroupLabels.add(String(option.group));
      nodes.push({
        type: 'group',
        key: `group-${String(option.group)}-${nodes.length}`,
        label: option.group,
      });
    }
    nodes.push(option);
  });

  return nodes;
}

const baseClearIcon = (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path
      d="M4.5 4.5l7 7m0-7l-7 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const baseArrowIcon = (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
    <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const Select = forwardRef<HTMLDivElement, SelectProps>((props, forwardedRef) => {
  const {
    mode,
    allowClear = false,
    showSearch,
    filterOption = true,
    options,
    loading = false,
    notFoundContent,
    value,
    defaultValue,
    placeholder = 'Select',
    disabled = false,
    onChange,
    className,
    children,
    ...rest
  } = props;

  const isMultiple = mode === 'multiple' || mode === 'tags';
  const shouldShowSearch = showSearch ?? isMultiple;
  const mergedFilter = useMemo(() => {
    if (filterOption === false) return () => true;
    if (typeof filterOption === 'function') return filterOption;
    return (input: string, option: SelectRenderedOption) => {
      const normalizedInput = input.toLowerCase();
      const label = typeof option.label === 'string' ? option.label : `${option.label ?? ''}`;
      return (
        label.toLowerCase().includes(normalizedInput) ||
        option.value.toLowerCase().includes(normalizedInput)
      );
    };
  }, [filterOption]);

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [tagOptions, setTagOptions] = useState<SelectRenderedOption[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const selectionBehaviorRef = useRef<ListSelectionBehavior | null>(null);
  const [listSelectionState, setListSelectionState] = useState<ListSelectionState | null>(null);
  const focusBehaviorRef = useRef<RovingFocusBehavior | null>(null);
  const [focusState, setFocusState] = useState<RovingFocusState>({
    items: [],
    currentIndex: 0,
    previousIndex: -1,
    orientation: 'vertical',
    wrap: true,
  });
  const listId = useId();
  const pendingSelectionsRef = useRef<string[]>([]);
  const handleRootRef = useCallback(
    (element: HTMLDivElement | null) => {
      containerRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef]
  );

  const builtOptions = useMemo(() => {
    const fromProp = options
      ? options.flatMap((option, index) =>
         normalizeOptionDefinition(option, undefined, `prop-${index}`)
        )
      : [];
    const fromChildren = buildOptionsFromChildren(children);
    const merged = options?.length ? fromProp : fromChildren;
    return merged.concat(tagOptions);
  }, [options, children, tagOptions]);

  const optionMap = useMemo(() => {
    const map = new Map<string, SelectRenderedOption>();
    builtOptions.forEach((option) => {
      map.set(option.value, option);
    });
    return map;
  }, [builtOptions]);

  const optionValues = useMemo(() => builtOptions.map((option) => option.value), [builtOptions]);
  const builtOptionsKey = useMemo(
    () => builtOptions.map((option) => `${option.key}:${option.value}`).join('|'),
    [builtOptions]
  );
  const optionValuesKey = useMemo(() => optionValues.join('|'), [optionValues]);

  const selectionMode = isMultiple ? 'multi' : 'single';

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const controlledSelection = valueRef.current !== undefined ? ensureValueArray(valueRef.current) : undefined;
    const previousSelection =
      selectionBehaviorRef.current?.getState().selectedIds ?? ensureValueArray(defaultValue);
    const initialSelection =
      controlledSelection ??
      (pendingSelectionsRef.current.length > 0
        ? Array.from(new Set([...previousSelection, ...pendingSelectionsRef.current]))
        : previousSelection);

    const filteredInitial = initialSelection.filter((val) => optionValues.includes(val));

    pendingSelectionsRef.current = [];

    const behavior = createListSelection({
      items: optionValues,
      mode: selectionMode,
      initialSelectedIds: filteredInitial,
    });

    selectionBehaviorRef.current = behavior;
    setListSelectionState(behavior.getState());

    let isInitial = true;
    const unsubscribe = behavior.subscribe((state) => {
      setListSelectionState(state);
      if (isInitial) {
        isInitial = false;
        return;
      }
      onChangeRef.current?.(
        state.selectedIds.length === 0
          ? undefined
          : selectionMode === 'multi'
            ? state.selectedIds
            : state.selectedIds[0]
      );
    });

    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, [builtOptionsKey, optionValuesKey, selectionMode]);

  useEffect(() => {
    if (!open) return;
    if (shouldShowSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, shouldShowSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectionBehaviorRef.current || value === undefined) return;
    const values = ensureValueArray(value);
    selectionBehaviorRef.current.actions.clearSelection();
    values.forEach((val) => selectionBehaviorRef.current?.actions.select(val));
  }, [value, optionValuesKey]);

  useEffect(() => {
    const focusBehavior = createRovingFocus({
      items: [],
      orientation: 'vertical',
      wrap: true,
    });

    focusBehaviorRef.current = focusBehavior;
    setFocusState(focusBehavior.getState());
    const unsubscribe = focusBehavior.subscribe((state) => setFocusState(state));

    return () => {
      unsubscribe();
      focusBehavior.destroy();
    };
  }, []);

  const renderNodes = useMemo(() => {
    return buildRenderNodesFromOptions(builtOptions, searchValue, mergedFilter);
  }, [builtOptions, searchValue, mergedFilter]);

  useEffect(() => {
    const focusItems = renderNodes
      .filter((node): node is SelectRenderedOption & { type: 'option' } => node.type === 'option')
      .map((node) => node.value);

    focusBehaviorRef.current?.actions.setItems(focusItems);
    if (focusItems.length === 0) {
      focusBehaviorRef.current?.actions.moveTo(0);
    }
  }, [renderNodes]);

  const focusValue = focusState.items[focusState.currentIndex] ?? null;
  const highlightedEntryIndex = renderNodes.findIndex(
    (entry) => entry.type === 'option' && entry.value === focusValue
  );

  useEffect(() => {
    if (!dropdownRef.current || highlightedEntryIndex === -1) return;
    const top = highlightedEntryIndex * ITEM_HEIGHT;
    const bottom = top + ITEM_HEIGHT;
    if (top < dropdownRef.current.scrollTop) {
      dropdownRef.current.scrollTop = top;
    } else if (bottom > dropdownRef.current.scrollTop + dropdownRef.current.clientHeight) {
      dropdownRef.current.scrollTop = bottom - dropdownRef.current.clientHeight;
    }
  }, [highlightedEntryIndex]);

  useEffect(() => {
    if (dropdownRef.current) {
      dropdownRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [renderNodes.length]);

  const visibleCount = Math.ceil(DROPDOWN_MAX_HEIGHT / ITEM_HEIGHT) + OVERSCAN_COUNT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN_COUNT);
  const endIndex = Math.min(renderNodes.length, startIndex + visibleCount);
  const visibleNodes = renderNodes.slice(startIndex, endIndex);
  const totalHeight = renderNodes.length * ITEM_HEIGHT;

  const handleControlKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true);
        if (event.key === 'ArrowDown') {
          focusBehaviorRef.current?.actions.moveNext();
        } else {
          focusBehaviorRef.current?.actions.movePrevious();
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (focusValue) {
          handleOptionSelect(focusValue);
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    },
    [disabled, open, focusValue, handleOptionSelect]
  );

  const handleControlClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      setOpen((prev) => !prev);
    },
    [disabled]
  );

  const selectedValues = listSelectionState?.selectedIds ?? [];

  const handleOptionSelect = useCallback(
    (optionValue: string) => {
      if (disabled) return;
      const option = optionMap.get(optionValue);
      if (!option || option.disabled) return;
      if (!selectionBehaviorRef.current) return;

      if (isMultiple) {
        selectionBehaviorRef.current.actions.toggleSelection(optionValue);
        if (mode === 'tags' && searchValue.trim()) {
          setSearchValue('');
        }
        return;
      }

      selectionBehaviorRef.current.actions.select(optionValue);
      setOpen(false);
    },
    [disabled, isMultiple, mode, optionMap, searchValue]
  );

  const handleClear = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!selectionBehaviorRef.current) return;
      selectionBehaviorRef.current.actions.clearSelection();
    },
    []
  );

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  }, []);

  const handleListScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (mode === 'tags') {
          event.preventDefault();
          handleCreateTag();
          return;
        }

        if (focusValue) {
          event.preventDefault();
          handleOptionSelect(focusValue);
        }
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusBehaviorRef.current?.actions.moveNext();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusBehaviorRef.current?.actions.movePrevious();
      }
    },
    [mode, focusValue, handleCreateTag, handleOptionSelect]
  );

  const handleCreateTag = useCallback(() => {
    if (mode !== 'tags') return;
    const inputValue = searchValue.trim();
    if (!inputValue) return;
    if (optionMap.has(inputValue)) {
      handleOptionSelect(inputValue);
      return;
    }
    const newTag: SelectRenderedOption = {
      type: 'option',
      key: `tag-${inputValue}-${Date.now()}`,
      value: inputValue,
      label: inputValue,
    };
    setTagOptions((prev) => [...prev, newTag]);
    pendingSelectionsRef.current = Array.from(new Set([...pendingSelectionsRef.current, inputValue]));
    setSearchValue('');
    const updatedSelection = Array.from(new Set([...selectedValues, inputValue]));
    onChangeRef.current?.(updatedSelection);
  }, [mode, optionMap, searchValue, selectedValues, handleOptionSelect]);

  const selectedOptions = selectedValues
    .map((value) => optionMap.get(value))
    .filter(Boolean) as SelectRenderedOption[];

  const singleDisplay = selectedOptions[0]?.label ?? placeholder;

  const ariaLiveLabel = `${renderNodes.filter((node) => node.type === 'option').length} options available`;

  return (
    <div
      ref={handleRootRef}
      className={cn(styles.select, className, {
        [styles.open]: open,
        [styles.disabled]: disabled,
        [styles.multiple]: isMultiple,
      })}
      {...rest}
    >
      <div
        className={styles.control}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        tabIndex={disabled ? -1 : 0}
        onClick={handleControlClick}
        onKeyDown={handleControlKeyDown}
        aria-disabled={disabled}
      >
        <div className={styles.valueArea}>
          {isMultiple ? (
            <div className={styles.tags}> 
              {selectedOptions.map((option) => (
                <span key={option.value} className={styles.tag}>
                  {option.label}
                </span>
              ))}
              {selectedOptions.length === 0 && <span className={styles.placeholder}>{placeholder}</span>}
            </div>
          ) : (
            <div className={styles.singleValue}>{singleDisplay}</div>
          )}
        </div>
        {allowClear && selectedValues.length > 0 && (
          <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="Clear selection">
            {baseClearIcon}
          </button>
        )}
        <span className={styles.arrow}>{baseArrowIcon}</span>
      </div>

      {open && (
        <div className={styles.dropdown}>
          {shouldShowSearch && (
            <div className={styles.searchWrapper}>
              <Input
                ref={searchRef}
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search..."
                allowClear
              />
            </div>
          )}

          <div
            className={styles.list}
            id={listId}
            role="listbox"
            ref={dropdownRef}
            onScroll={handleListScroll}
            aria-multiselectable={isMultiple ? true : undefined}
            aria-live="polite"
          >
            {loading ? (
              <div className={styles.loading} role="status">
                <span className={styles.spinner}></span>
                Loading options...
              </div>
            ) : renderNodes.length === 0 ? (
              <div className={styles.empty}>{notFoundContent ?? 'No options found'}</div>
            ) : (
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: `${startIndex * ITEM_HEIGHT}px`,
                    left: 0,
                    right: 0,
                  }}
                >
                  {visibleNodes.map((node) => {
                    if (node.type === 'group') {
                      return (
                        <div key={node.key} className={styles.groupLabel}>
                          {node.label}
                        </div>
                      );
                    }

                    const isSelected = selectedValues.includes(node.value);
                    const isHighlighted = focusValue === node.value;
                    return (
                      <div
                        key={node.key}
                        role="option"
                        aria-selected={isSelected}
                        title={node.title?.toString()}
                        data-value={node.value}
                        className={cn(styles.option, {
                          [styles.selected]: isSelected,
                          [styles.highlighted]: isHighlighted,
                          [styles.disabledOption]: node.disabled,
                        })}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleOptionSelect(node.value)}
                      >
                        {node.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className={styles.liveRegion} aria-live="polite">
            {ariaLiveLabel}
          </div>
        </div>
      )}
    </div>
  );
});

const OptionComponent = (_props: SelectOptionProps) => null;
OptionComponent.displayName = 'Select.Option';

const OptGroupComponent = (_props: SelectOptGroupProps) => null;
OptGroupComponent.displayName = 'Select.OptGroup';

Select.displayName = 'Select';
Select.Option = OptionComponent;
Select.OptGroup = OptGroupComponent;

export type { SelectOptionProps, SelectOptGroupProps };
