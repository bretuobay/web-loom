import type { FormInstance } from '../../forms-core/src';
import type { FieldControllerConfig, FieldControllerInstance } from './types';
import { DOMHelpers } from './utils/DOMHelpers';
import { EventHelpers } from './utils/EventHelpers';

/**
 * Individual field controller for DOM binding
 */
export class FieldController implements FieldControllerInstance {
  public readonly element: HTMLElement;
  public readonly name: string;

  private readonly config: Required<FieldControllerConfig>;
  private readonly form: FormInstance<Record<string, unknown>>;
  private readonly eventListeners: Array<() => void> = [];
  private unregisterField?: () => void;

  constructor(element: HTMLElement, config: FieldControllerConfig, form: FormInstance<Record<string, unknown>>) {
    this.element = element;
    this.form = form;
    this.name = config.name || DOMHelpers.getFieldName(element);

    if (!this.name) {
      throw new Error('Field name is required');
    }

    this.config = {
      name: this.name,
      validateOnChange: false,
      validateOnBlur: true,
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    // Register field with form
    this.unregisterField = this.form.registerField(this.name, {
      validateOnBlur: this.config.validateOnBlur,
      validateOnChange: this.config.validateOnChange,
    });

    // Set initial value from DOM
    const initialValue = this.getValueFromDOM();
    if (initialValue !== undefined) {
      this.form.setFieldValue(this.name, initialValue);
    }

    // Bind event listeners
    this.bindEvents();

    // Subscribe to field state changes
    const unsubscribe = this.form.subscribe('stateChange', (state) => {
      this.updateDisplay(state.fields[this.name], state.fieldErrors[this.name]);
    });
    this.eventListeners.push(unsubscribe);
  }

  private bindEvents(): void {
    // Change event
    const changeListener = EventHelpers.addEventListener(this.element, 'change', this.handleChange.bind(this));
    this.eventListeners.push(changeListener);

    // Input event (for real-time updates)
    const inputListener = EventHelpers.addEventListener(this.element, 'input', this.handleInput.bind(this));
    this.eventListeners.push(inputListener);

    // Blur event
    const blurListener = EventHelpers.addEventListener(this.element, 'blur', this.handleBlur.bind(this));
    this.eventListeners.push(blurListener);

    // Focus event
    const focusListener = EventHelpers.addEventListener(this.element, 'focus', this.handleFocus.bind(this));
    this.eventListeners.push(focusListener);
  }

  private handleChange(): void {
    const value = this.getValueFromDOM();
    this.setValue(value);

    if (this.config.validateOnChange) {
      this.validate();
    }
  }

  private handleInput(): void {
    // Handle real-time input for text fields
    if (this.isTextInput()) {
      const value = this.getValueFromDOM();
      this.setValue(value);

      if (this.config.validateOnChange) {
        this.debounceValidation();
      }
    }
  }

  private handleBlur(): void {
    this.form.setFieldTouched(this.name, true);

    if (this.config.validateOnBlur) {
      this.validate();
    }
  }

  private handleFocus(): void {
    // Clear error on focus if configured
    if (this.config.errorDisplay?.errorClass) {
      // Optionally clear error state
    }
  }

  private debounceValidation = EventHelpers.debounce(() => this.validate(), 300);

  private getValueFromDOM(): unknown {
    if (this.config.getValue) {
      return this.config.getValue(this.element);
    }

    return DOMHelpers.getElementValue(this.element);
  }

  private setValueToDOM(value: unknown): void {
    if (this.config.setValue) {
      this.config.setValue(this.element, value);
      return;
    }

    DOMHelpers.setElementValue(this.element, value);
  }

  private isTextInput(): boolean {
    return (
      this.element instanceof HTMLInputElement &&
      ['text', 'email', 'password', 'search', 'tel', 'url'].includes(this.element.type)
    );
  }

  private updateDisplay(fieldState: any, error: string | null): void {
    const { errorDisplay } = this.config;

    // Update element classes
    if (errorDisplay?.errorClass) {
      this.element.classList.toggle(errorDisplay.errorClass, !!error);
    }

    // Update error message display
    if (errorDisplay?.container) {
      const container = document.querySelector(errorDisplay.container);
      if (container) {
        container.textContent = error || '';
        container.style.display = error ? 'block' : 'none';
      }
    }

    // Update value if it changed externally
    const currentDOMValue = this.getValueFromDOM();
    const formValue = this.form.getFieldValue(this.name);

    if (currentDOMValue !== formValue) {
      this.setValueToDOM(formValue);
    }
  }

  public getValue(): unknown {
    return this.form.getFieldValue(this.name);
  }

  public setValue(value: unknown): void {
    let processedValue = value;

    // Apply transform if provided
    if (this.config.transform) {
      processedValue = this.config.transform(value);
    }

    // Apply parse if provided and value is string
    if (this.config.parse && typeof value === 'string') {
      processedValue = this.config.parse(value);
    }

    this.form.setFieldValue(this.name, processedValue);

    // Update DOM if necessary
    const currentDOMValue = this.getValueFromDOM();
    if (currentDOMValue !== processedValue) {
      this.setValueToDOM(processedValue);
    }
  }

  public getError(): string | null {
    return this.form.getState().fieldErrors[this.name] || null;
  }

  public setError(error: string | null): void {
    this.form.setFieldError(this.name, error);
  }

  public async validate(): Promise<boolean> {
    return this.form.validateField(this.name);
  }

  public destroy(): void {
    // Clean up event listeners
    this.eventListeners.forEach((cleanup) => cleanup());
    this.eventListeners.length = 0;

    // Unregister field
    if (this.unregisterField) {
      this.unregisterField();
    }
  }
}
