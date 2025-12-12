import {
  ChangeEvent,
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useMemo,
  type CSSProperties,
  type FocusEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useField, useFormContext } from '@web-loom/forms-react';
import { cn } from '../../utils/cn';
import styles from './Form.module.css';
import { useFormLayout } from './FormContext';
import type { FormItemProps, FormItemRenderProps, FormItemRule, LabelAlign } from './types';

function normalizeValue(eventOrValue: ChangeEvent<HTMLInputElement> | unknown) {
  if (typeof eventOrValue === 'object' && eventOrValue !== null && 'target' in eventOrValue) {
    const target = eventOrValue.target as HTMLInputElement;

    if (target.type === 'checkbox') {
      return target.checked;
    }

    if (target.type === 'number' || target.type === 'range') {
      return target.valueAsNumber;
    }

    if (target.type === 'file') {
      return target.files;
    }

    return target.value;
  }

  return eventOrValue;
}

function shouldValidateOnChange(rules?: FormItemRule[]) {
  return rules?.some((rule) => !rule.trigger || rule.trigger === 'change') ?? false;
}

type FormChildProps = {
  id?: string;
  name?: string;
  value?: unknown;
  onChange?: (event: ChangeEvent<HTMLInputElement> | unknown) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  'aria-describedby'?: string;
  [key: string]: unknown;
};

function FormItemLayout({
  label,
  colon,
  labelAlign,
  description,
  help,
  required,
  error,
  descriptionId,
  errorId,
  children,
  className,
  style,
}: {
  label?: ReactNode;
  colon?: boolean;
  labelAlign?: LabelAlign;
  description?: ReactNode;
  help?: ReactNode;
  required?: boolean;
  error?: string | null;
  descriptionId?: string;
  errorId?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const { layout, colon: contextColon, labelAlign: contextLabelAlign, requiredMark: contextRequired } =
    useFormLayout();
  const showColon = colon ?? contextColon;
  const resolvedLabelAlign = labelAlign ?? contextLabelAlign;
  const isOptionalMarker = contextRequired === 'optional' && !required;

  const formattedLabel =
    typeof label === 'string' && showColon && !label.trim().endsWith(':') ? `${label}:` : label;

  const requiredIndicator = required
    ? <span className={styles.required} aria-hidden="true">*</span>
    : isOptionalMarker
      ? (
        <span className={styles.required} aria-hidden="true">
          (Optional)
        </span>
      )
      : null;

  const wrapperClasses = cn(styles.formItem, className);
  const labelClasses = cn(styles.label, resolvedLabelAlign === 'right' && styles.labelRight);

  return (
    <div className={wrapperClasses} style={style}>
      {label && (
        <div className={labelClasses}>
          {formattedLabel}
          {requiredIndicator}
        </div>
      )}
      {description && (
        <div className={styles.description} id={descriptionId}>
          {description}
        </div>
      )}
      <div className={styles.content}>{children}</div>
      {help && <div className={styles.help}>{help}</div>}
      <div className={styles.error} role="alert" aria-live="assertive" id={errorId}>
        {error ?? '\u00a0'}
      </div>
    </div>
  );
}

interface FormItemFieldProps extends FormItemProps {
  name: string;
}

function FormItemField({
  className,
  description,
  error,
  label,
  name,
  rules,
  help,
  required,
  colon,
  labelAlign,
  children,
  style,
}: FormItemFieldProps) {
  const { field, meta, error: fieldError, setError, value } = useField(name);
  const { form } = useFormContext();
  const uniqueId = useId();
  const sanitizedName = name.replace(/\./g, '_');
  const fieldId = `${sanitizedName}-${uniqueId}`;
  const descriptionIdentifier = description ? `${fieldId}-description` : undefined;
  const errorIdentifier = `${fieldId}-error`;

  const isRequired = required ?? (rules?.some((rule) => rule.required) ?? false);

  const runRules = useCallback(
    async (trigger: 'change' | 'blur', incomingValue?: unknown) => {
      if (!rules || rules.length === 0) {
        const fieldErrors = form.getState().fieldErrors;
        if (!fieldErrors[name]) {
          setError(null);
        }
        return null;
      }

      const currentValue = incomingValue ?? value;
      for (const rule of rules) {
        if (rule.trigger && rule.trigger !== trigger) {
          continue;
        }

        if (rule.required && (currentValue === '' || currentValue === null || currentValue === undefined)) {
          const message = rule.message ?? 'This field is required';
          setError(message);
          return message;
        }

        if (rule.validator) {
          const result = await Promise.resolve(rule.validator(currentValue, { values: form.getValues() }));
          if (result === false) {
            const message = rule.message ?? 'Validation failed';
            setError(message);
            return message;
          }

          if (typeof result === 'string') {
            setError(result);
            return result;
          }
        }
      }

      const fieldErrors = form.getState().fieldErrors;
      if (!fieldErrors[name]) {
        setError(null);
      }

      return null;
    },
    [form, name, rules, setError, value],
  );

  const handleChange = useCallback(
    (eventOrValue: ChangeEvent<HTMLInputElement> | unknown) => {
      const normalized = normalizeValue(eventOrValue);
      field.onChange(eventOrValue as never);
      if (shouldValidateOnChange(rules)) {
        runRules('change', normalized);
      }
    },
    [field, runRules, rules],
  );

  const handleBlur = useCallback(() => {
    field.onBlur();
    runRules('blur');
  }, [field, runRules]);

  const fieldProps = useMemo(
    () => ({
      ...field,
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    [field, handleChange, handleBlur],
  );

  const enhancedMeta = useMemo(() => ({ ...meta, value }), [meta, value]);

  const renderProps = useMemo<FormItemRenderProps>(
    () => ({
      name,
      field: fieldProps,
      meta: enhancedMeta,
      error: fieldError,
      descriptionId: descriptionIdentifier,
      errorId: errorIdentifier,
    }),
    [name, fieldProps, meta, fieldError, descriptionIdentifier, errorIdentifier],
  );

  const renderedChildren = typeof children === 'function' ? children(renderProps) : children;

  const clonedChild = (() => {
    if (!isValidElement(renderedChildren)) {
      return renderedChildren;
    }

    const childElement = renderedChildren as ReactElement<FormChildProps>;
    const childProps = childElement.props as FormChildProps;
    const describedBy = [childProps['aria-describedby'], descriptionIdentifier, errorIdentifier]
      .filter(Boolean)
      .join(' ');

    return cloneElement(childElement, {
      ...childProps,
      id: childProps.id ?? fieldId,
      'aria-invalid': !!fieldError || !!error ? 'true' : undefined,
      'aria-required': isRequired ? 'true' : undefined,
      value: childProps.value ?? value,
      name: childProps.name ?? name,
      onChange: (evt: ChangeEvent<HTMLInputElement> | unknown) => {
        handleChange(evt);
        childProps.onChange?.(evt);
      },
      onBlur: (evt: FocusEvent<HTMLInputElement>) => {
        handleBlur();
        childProps.onBlur?.(evt);
      },
      onFocus: (evt: FocusEvent<HTMLInputElement>) => {
        field.onFocus();
        childProps.onFocus?.(evt);
      },
      'aria-describedby': describedBy || undefined,
    });
  })();

  return (
    <FormItemLayout
      label={label}
      colon={colon}
      labelAlign={labelAlign}
      description={description}
      help={help}
      error={fieldError ?? error}
      descriptionId={descriptionIdentifier}
      errorId={errorIdentifier}
      required={isRequired}
      className={className}
      style={style}
    >
      {clonedChild}
    </FormItemLayout>
  );
}

export function FormItem(props: FormItemProps) {
  const renderStaticLayout = (content: ReactNode) => (
    <FormItemLayout
      label={props.label}
      colon={props.colon}
      labelAlign={props.labelAlign}
      description={props.description}
      help={props.help}
      error={props.error ?? null}
      required={props.required}
      className={props.className}
      style={props.style}
    >
      {content}
    </FormItemLayout>
  );

  if (!props.name) {
    if (typeof props.children === 'function') {
      return renderStaticLayout(null);
    }

    return renderStaticLayout(props.children);
  }

  const { name, ...rest } = props;

  return (
    <FormItemField
      {...rest}
      name={name}
    />
  );
}
