import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { createListSelection, type ListSelectionBehavior } from '@web-loom/ui-core';
import { cn } from '../../utils/cn';
import styles from './Checkbox.module.css';

export type CheckboxValueType = string | number;

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  indeterminate?: boolean;
  value?: CheckboxValueType;
  children?: ReactNode;
}

export interface CheckboxGroupProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'defaultValue'> {
  value?: CheckboxValueType[];
  defaultValue?: CheckboxValueType[];
  onChange?: (checked: CheckboxValueType[]) => void;
  disabled?: boolean;
  name?: string;
  label?: ReactNode;
  required?: boolean;
  ariaLabel?: string;
  children?: ReactNode;
}

interface CheckboxGroupContextValue {
  name: string;
  disabled?: boolean;
  required?: boolean;
  isChecked: (value: CheckboxValueType) => boolean;
  toggleValue: (value: CheckboxValueType) => void;
  registerValue: (value: CheckboxValueType) => void;
  unregisterValue: (value: CheckboxValueType) => void;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

const createValueKey = (value: CheckboxValueType) => `wl-checkbox-${typeof value}-${String(value)}`;

const CheckboxComponent = forwardRef<HTMLInputElement, CheckboxProps>((props, forwardedRef) => {
  const {
    checked,
    defaultChecked,
    indeterminate = false,
    disabled = false,
    className,
    children,
    onChange,
    value,
    style,
    ...rest
  } = props;

  const group = useContext(CheckboxGroupContext);
  const generatedValueId = useId();
  const fallbackValueRef = useRef<CheckboxValueType | null>(null);

  if (fallbackValueRef.current === null) {
    fallbackValueRef.current = generatedValueId;
  }

  const resolvedValue = value ?? fallbackValueRef.current!;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uncontrolledChecked, setUncontrolledChecked] = useState<boolean>(() => Boolean(defaultChecked));
  const isControlled = checked !== undefined;

  useEffect(() => {
    if (!isControlled) {
      setUncontrolledChecked(Boolean(defaultChecked));
    }
  }, [defaultChecked, isControlled]);

  const handleRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      if (typeof forwardedRef === 'function') {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    },
    [forwardedRef],
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  useEffect(() => {
    if (!group) return;
    group.registerValue(resolvedValue);
    return () => {
      group.unregisterValue(resolvedValue);
    };
  }, [group, resolvedValue]);

  const isChecked = group
    ? group.isChecked(resolvedValue)
    : isControlled
      ? checked
      : uncontrolledChecked;
  const isDisabled = disabled || group?.disabled;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (isDisabled) {
        return;
      }
      if (group) {
        group.toggleValue(resolvedValue);
      } else if (!isControlled) {
        setUncontrolledChecked(event.target.checked);
      }
      onChange?.(event);
    },
    [group, isControlled, isDisabled, onChange, resolvedValue],
  );

  const wrapperClasses = cn(styles.wrapper, className, {
    [styles.disabled]: isDisabled,
  });

  const controlClasses = cn(styles.control, {
    [styles.checked]: Boolean(isChecked),
    [styles.indeterminate]: indeterminate,
  });

  const valueAttr = typeof resolvedValue === 'string' ? resolvedValue : String(resolvedValue);
  const ariaChecked = indeterminate ? 'mixed' : isChecked ? 'true' : 'false';

  return (
    <label className={wrapperClasses} style={style}>
      <span className={controlClasses}>
        <input
          {...rest}
          ref={handleRef}
          type="checkbox"
          name={group?.name}
          value={valueAttr}
          aria-checked={ariaChecked}
          checked={isChecked}
          defaultChecked={!group ? defaultChecked : undefined}
          disabled={isDisabled}
          className={styles.input}
          onChange={handleChange}
        />
        <span className={styles.indicator} aria-hidden="true" />
      </span>
      {children && <span className={styles.label}>{children}</span>}
    </label>
  );
});

const CheckboxGroup = forwardRef<HTMLFieldSetElement, CheckboxGroupProps>((props, forwardedRef) => {
  const {
    value,
    defaultValue = [],
    onChange,
    disabled = false,
    name,
    label,
    required = false,
    ariaLabel,
    className,
    children,
    ...rest
  } = props;

  const [internalValue, setInternalValue] = useState<CheckboxValueType[]>(defaultValue);
  const isControlled = value !== undefined;
  const selectedValues = isControlled ? value! : internalValue;

  const selectedKeys = useMemo(() => selectedValues.map(createValueKey), [selectedValues]);
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const selectionBehavior = useRef<ListSelectionBehavior | null>(null);

  useEffect(() => {
    selectionBehavior.current = createListSelection({
      mode: 'multi',
    });
    return () => {
      selectionBehavior.current?.destroy();
    };
  }, []);

  useEffect(() => {
    const behavior = selectionBehavior.current;
    if (!behavior) return;
    behavior.actions.clearSelection();
    selectedKeys.forEach((key) => behavior.actions.select(key));
  }, [selectedKeys]);

  const valueRegistry = useRef<Map<string, CheckboxValueType>>(new Map());

  const registerValue = useCallback((val: CheckboxValueType) => {
    valueRegistry.current.set(createValueKey(val), val);
  }, []);

  const unregisterValue = useCallback((val: CheckboxValueType) => {
    valueRegistry.current.delete(createValueKey(val));
  }, []);

  const triggerChange = useCallback(
    (nextValues: CheckboxValueType[]) => {
      if (!isControlled) {
        setInternalValue(nextValues);
      }
      onChange?.(nextValues);
    },
    [isControlled, onChange],
  );

  const toggleValue = useCallback(
    (val: CheckboxValueType) => {
      const behavior = selectionBehavior.current;
      if (!behavior) return;
      const key = createValueKey(val);
      behavior.actions.toggleSelection(key);
      const { selectedIds } = behavior.getState();
      const nextValues = selectedIds
        .map((id) => valueRegistry.current.get(id))
        .filter((item): item is CheckboxValueType => item !== undefined);
      triggerChange(nextValues);
    },
    [triggerChange],
  );

  const fallbackName = useId();
  const effectiveName = name ?? `checkbox-group-${fallbackName}`;
  const legendId = label ? `${effectiveName}-label` : undefined;

  const contextValue = useMemo<CheckboxGroupContextValue>(
    () => ({
      name: effectiveName,
      disabled,
      required,
      isChecked: (val) => selectedSet.has(createValueKey(val)),
      toggleValue,
      registerValue,
      unregisterValue,
    }),
    [disabled, effectiveName, required, selectedSet, toggleValue, registerValue, unregisterValue],
  );

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      <fieldset ref={forwardedRef} className={cn(styles.groupFieldset, className)} disabled={disabled} {...rest}>
        {label && (
          <legend id={legendId} className={styles.groupLegend}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </legend>
        )}
        <div
          role="group"
          aria-required={required}
          aria-labelledby={legendId}
          aria-label={!label ? ariaLabel : undefined}
          className={styles.groupChildren}
        >
          {children}
        </div>
      </fieldset>
    </CheckboxGroupContext.Provider>
  );
});

const CheckboxWithGroup = CheckboxComponent as typeof CheckboxComponent & {
  Group: typeof CheckboxGroup;
};

CheckboxWithGroup.Group = CheckboxGroup;

export { CheckboxGroup };
export const Checkbox = CheckboxWithGroup;
export type { CheckboxGroupContextValue };
