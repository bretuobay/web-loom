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
import styles from './Radio.module.css';

export type RadioValueType = string | number;

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: RadioValueType;
  checked?: boolean;
  buttonStyle?: boolean;
  children?: ReactNode;
}

export interface RadioGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  value?: RadioValueType;
  defaultValue?: RadioValueType;
  onChange?: (value: RadioValueType) => void;
  disabled?: boolean;
  label?: ReactNode;
  required?: boolean;
  name?: string;
  ariaLabel?: string;
  children?: ReactNode;
}

interface RadioGroupContextValue {
  name: string;
  disabled?: boolean;
  required?: boolean;
  selectedKey?: string;
  onChange: (value: RadioValueType) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

const createValueKey = (value: RadioValueType) => `wl-radio-${typeof value}-${String(value)}`;

const RadioComponent = forwardRef<HTMLInputElement, RadioProps>((props, forwardedRef) => {
  const {
    value,
    checked,
    defaultChecked,
    disabled = false,
    className,
    children,
    onChange,
    buttonStyle = false,
    style,
    name,
    ...rest
  } = props;

  const group = useContext(RadioGroupContext);
  const generatedValue = useId();
  const fallbackValueRef = useRef<RadioValueType | null>(null);

  if (fallbackValueRef.current === null) {
    fallbackValueRef.current = generatedValue;
  }

  const resolvedValue = value ?? fallbackValueRef.current!;
  const inputValue = typeof resolvedValue === 'string' ? resolvedValue : String(resolvedValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uncontrolledChecked, setUncontrolledChecked] = useState<boolean>(() => Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const hasGroup = Boolean(group);
  const shouldControlChecked = hasGroup || isControlled;
  const effectiveName = group?.name ?? name;

  const handleRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      if (!forwardedRef) return;
      if (typeof forwardedRef === 'function') {
        forwardedRef(element);
      } else {
        forwardedRef.current = element;
      }
    },
    [forwardedRef],
  );

  useEffect(() => {
    if (!shouldControlChecked) {
      setUncontrolledChecked(Boolean(defaultChecked));
    }
  }, [defaultChecked, shouldControlChecked]);

  useEffect(() => {
    if (shouldControlChecked || !effectiveName || typeof document === 'undefined') {
      return;
    }

    const handleDocumentChange = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (!target || target.type !== 'radio' || target.name !== effectiveName) {
        return;
      }

      if (target === inputRef.current) {
        setUncontrolledChecked(target.checked);
      } else if (target.checked) {
        setUncontrolledChecked(false);
      }
    };

    document.addEventListener('change', handleDocumentChange, true);
    return () => {
      document.removeEventListener('change', handleDocumentChange, true);
    };
  }, [effectiveName, shouldControlChecked]);

  const isDisabled = disabled || group?.disabled;
  const isChecked = group
    ? group.selectedKey === createValueKey(resolvedValue)
    : isControlled
      ? checked
      : uncontrolledChecked;

  const wrapperClasses = cn(styles.radio, className, {
    [styles.disabled]: isDisabled,
    [styles.checked]: Boolean(isChecked),
    [styles.buttonMode]: buttonStyle,
  });

  const contentClasses = cn(styles.content, {
    [styles.buttonText]: buttonStyle,
  });

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (isDisabled) {
        return;
      }

      if (group) {
        group.onChange(resolvedValue);
      } else if (!isControlled) {
        setUncontrolledChecked(event.target.checked);
      }

      onChange?.(event);
    },
    [group, isDisabled, isControlled, onChange, resolvedValue],
  );

  return (
    <label className={wrapperClasses} style={style}>
      <input
        {...rest}
        ref={handleRef}
        type="radio"
        name={group?.name ?? name}
        value={inputValue}
        checked={shouldControlChecked ? isChecked : undefined}
        defaultChecked={!shouldControlChecked ? defaultChecked : undefined}
        disabled={isDisabled}
        className={styles.input}
        onChange={handleChange}
      />
      {!buttonStyle && <span className={styles.bullet} aria-hidden="true" />}
      <span className={contentClasses}>{children}</span>
    </label>
  );
});

const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>((props, forwardedRef) => {
  const {
    value,
    defaultValue,
    onChange,
    disabled = false,
    label,
    required = false,
    name,
    ariaLabel,
    className,
    children,
    ...rest
  } = props;

  const [internalValue, setInternalValue] = useState<RadioValueType | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;
  const selectionBehavior = useRef<ListSelectionBehavior | null>(null);

  useEffect(() => {
    selectionBehavior.current = createListSelection({
      mode: 'single',
    });
    return () => {
      selectionBehavior.current?.destroy();
    };
  }, []);

  useEffect(() => {
    const behavior = selectionBehavior.current;
    if (!behavior) return;
    behavior.actions.clearSelection();
    if (selectedValue !== undefined) {
      behavior.actions.select(createValueKey(selectedValue));
    }
  }, [selectedValue]);

  const triggerChange = useCallback(
    (nextValue: RadioValueType) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  const selectValue = useCallback(
    (nextValue: RadioValueType) => {
      const behavior = selectionBehavior.current;
      if (!behavior) return;
      behavior.actions.select(createValueKey(nextValue));
      triggerChange(nextValue);
    },
    [triggerChange],
  );

  const fallbackName = useId();
  const effectiveName = useMemo(() => name ?? `radio-group-${fallbackName}`, [name, fallbackName]);
  const selectedKey = selectedValue !== undefined ? createValueKey(selectedValue) : undefined;
  const legendId = label ? `${effectiveName}-legend` : undefined;

  const contextValue = useMemo<RadioGroupContextValue>(
    () => ({
      name: effectiveName,
      disabled,
      required,
      selectedKey,
      onChange: selectValue,
    }),
    [disabled, effectiveName, required, selectValue, selectedKey],
  );

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <fieldset ref={forwardedRef} className={className} disabled={disabled} {...rest}>
        {label && (
          <legend id={legendId}>
            {label}
            {required && <span aria-hidden="true">*</span>}
          </legend>
        )}
        <div
          role="radiogroup"
          aria-label={!label ? ariaLabel : undefined}
          aria-labelledby={legendId}
          aria-required={required}
        >
          {children}
        </div>
      </fieldset>
    </RadioGroupContext.Provider>
  );
});

const RadioButton = forwardRef<HTMLInputElement, RadioProps>((props, forwardedRef) => (
  <RadioComponent {...props} ref={forwardedRef} buttonStyle />
));

const RadioWithGroup = RadioComponent as typeof RadioComponent & {
  Group: typeof RadioGroup;
  Button: typeof RadioButton;
};

RadioWithGroup.Group = RadioGroup;
RadioWithGroup.Button = RadioButton;

export { RadioGroup, RadioButton };
export const Radio = RadioWithGroup;
