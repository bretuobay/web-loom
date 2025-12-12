import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ForwardedRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Input.module.css';

export type InputSize = 'small' | 'middle' | 'large';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  allowClear?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  addonBefore?: ReactNode;
  addonAfter?: ReactNode;
}

const baseClearIcon = (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as MutableRefObject<T | null>).current = value;
}

export const Input = forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
  const {
    size = 'middle',
    allowClear = false,
    prefix,
    suffix,
    addonBefore,
    addonAfter,
    className,
    disabled = false,
    type = 'text',
    value: valueProp,
    defaultValue,
    onChange,
    ...rest
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [internalValue, setInternalValue] = useState(() => {
    if (valueProp !== undefined) return String(valueProp ?? '');
    if (defaultValue !== undefined) return String(defaultValue ?? '');
    return '';
  });

  useEffect(() => {
    if (valueProp !== undefined) {
      setInternalValue(String(valueProp ?? ''));
    }
  }, [valueProp]);

  const resolvedValue = valueProp !== undefined ? String(valueProp ?? '') : internalValue;
  const showClear = allowClear && !disabled && resolvedValue.length > 0;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (valueProp === undefined) {
        setInternalValue(event.target.value);
      }
      onChange?.(event);
    },
    [onChange, valueProp]
  );

  const handleRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef]
  );

  const handleClear = useCallback(() => {
    const element = inputRef.current;
    if (!element) return;
    element.value = '';
    if (valueProp === undefined) {
      setInternalValue('');
    }
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
    element.focus();
  }, [valueProp]);

  const wrapperClasses = cn(
    styles.wrapper,
    styles[`size-${size}`],
    {
      [styles.hasAddonBefore]: Boolean(addonBefore),
      [styles.hasAddonAfter]: Boolean(addonAfter),
      [styles.disabled]: disabled,
    },
    className
  );

  return (
    <div className={wrapperClasses}>
      {addonBefore && <div className={styles.addon}>{addonBefore}</div>}
      <div className={styles.control}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input
          ref={handleRef}
          type={type}
          disabled={disabled}
          value={resolvedValue}
          onChange={handleChange}
          {...rest}
        />
        {showClear && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear input"
          >
            {baseClearIcon}
          </button>
        )}
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {addonAfter && <div className={styles.addon}>{addonAfter}</div>}
    </div>
  );
});

Input.displayName = 'Input';

export interface InputPasswordProps extends Omit<InputProps, 'type'> {
  /** Show password visibility toggle */
  visibilityToggle?: boolean;
  /** Controlled aria label generator for the visibility toggle */
  visibilityToggleLabel?: (visible: boolean) => string;
}

export const InputPassword = forwardRef<HTMLInputElement, InputPasswordProps>((props, forwardedRef) => {
  const { visibilityToggle = true, visibilityToggleLabel, suffix, ...rest } = props;
  const [visible, setVisible] = useState(false);

  const label = useMemo(() => {
    if (visibilityToggleLabel) return visibilityToggleLabel(visible);
    return visible ? 'Hide password' : 'Show password';
  }, [visibilityToggleLabel, visible]);

  const toggleVisibility = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  const toggleButton = visibilityToggle ? (
    <button
      type="button"
      className={styles.visibilityToggle}
      onClick={toggleVisibility}
      aria-label={label}
      aria-pressed={visible}
    >
      {visible ? (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <path
            d="M2 10c2-4 7-6 8-6s6 2 8 6c-2 4-7 6-8 6s-6-2-8-6z"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
          />
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <path
            d="M2 2l16 16M2 2c2-1 7-1 8-1s6 0 8 1M2 18l16-16M2 18c2 1 7 1 8 1s6 0 8-1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </button>
  ) : null;

  const suffixContent = visibilityToggle ? (
    <>{suffix}{toggleButton}</>
  ) : (
    suffix
  );

  return (
    <Input
      {...rest}
      ref={forwardedRef}
      type={visible ? 'text' : 'password'}
      suffix={suffixContent}
    />
  );
});

InputPassword.displayName = 'Input.Password';

export interface InputSearchProps extends InputProps {
  /** Callback fired when the user submits the search */
  onSearch?: (value: string, event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLInputElement>) => void;
  /** Content rendered inside the search button */
  searchButtonText?: ReactNode;
  /** Aria label for the search button */
  searchButtonAriaLabel?: string;
  /** Allow disabling the explicit search action */
  searchButtonDisabled?: boolean;
}

export const InputSearch = forwardRef<HTMLInputElement, InputSearchProps>((props, forwardedRef) => {
  const {
    onSearch,
    searchButtonText = 'Search',
    searchButtonAriaLabel = 'Search input',
    searchButtonDisabled = false,
    onKeyDown,
    ...rest
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef]
  );

  const triggerSearch = useCallback(
    (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLInputElement>) => {
      const value = inputRef.current?.value ?? '';
      if (!onSearch) return;
      onSearch(value, event);
    },
    [onSearch]
  );

  const handleButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      triggerSearch(event);
    },
    [triggerSearch]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        triggerSearch(event);
      }
      onKeyDown?.(event);
    },
    [onKeyDown, triggerSearch]
  );

  const disabled = rest.disabled ?? false;
  const buttonDisabled = searchButtonDisabled || disabled;

  return (
    <div className={styles.group}>
      <Input
        {...rest}
        ref={handleRef}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className={styles.searchButton}
        onClick={handleButtonClick}
        aria-label={searchButtonAriaLabel}
        disabled={buttonDisabled}
      >
        {searchButtonText}
      </button>
    </div>
  );
});

InputSearch.displayName = 'Input.Search';

export interface InputTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: InputSize;
}

export const InputTextArea = forwardRef<HTMLTextAreaElement, InputTextAreaProps>((props, forwardedRef) => {
  const { size = 'middle', className, ...rest } = props;
  const textareaClass = cn(styles.textarea, styles[`size-${size}`], className);

  return <textarea ref={forwardedRef} className={textareaClass} {...rest} />;
});

InputTextArea.displayName = 'Input.TextArea';

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {}

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(({ className, ...rest }, forwardedRef) => {
  return <div ref={forwardedRef} className={cn(styles.group, className)} {...rest} />;
});

InputGroup.displayName = 'Input.Group';
