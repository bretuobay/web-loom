import { FormFactory, type FormInstance } from '@web-loom/forms-core';
import type { InferFormOutput, InferFormValues, FormState } from '@web-loom/forms-core';
import type { ZodSchema } from 'zod';
import type {
  FormControllerConfig,
  FormControllerInstance,
  FormSubmitHandler,
  FieldControllerConfig,
  FieldControllerInstance,
} from './types';
import { FieldController } from './FieldController';
import { DOMHelpers } from './utils/DOMHelpers';
import { EventHelpers } from './utils/EventHelpers';

/**
 * Vanilla JS form controller
 */
export class FormController<TSchema extends ZodSchema> implements FormControllerInstance<TSchema> {
  public readonly form: FormInstance<InferFormValues<TSchema>>;
  public readonly element: HTMLFormElement;

  private readonly config: FormControllerConfig<TSchema>;
  private readonly fieldControllers = new Map<string, FieldControllerInstance>();
  private readonly eventListeners: Array<() => void> = [];
  private submitHandler?: FormSubmitHandler<TSchema>;
  private pendingSubmitHandler?: FormSubmitHandler<TSchema>;

  constructor(config: FormControllerConfig<TSchema>) {
    this.config = {
      preventDefault: true,
      validateOnChange: false,
      validateOnBlur: true,
      changeValidationDelay: 300,
      autoBind: true,
      ...config,
    };

    // Get form element
    this.element =
      typeof config.form === 'string' ? DOMHelpers.querySelector<HTMLFormElement>(config.form) : config.form;

    if (!this.element) {
      throw new Error(`Form element not found: ${config.form}`);
    }

    if (this.config.onSubmit) {
      this.submitHandler = async (values) => {
        await this.config.onSubmit!(values as InferFormValues<TSchema>);
      };
    }

    // Create form instance with submit bridge so we can surface typed handlers
    this.form = FormFactory.create({
      schema: this.config.schema,
      defaultValues: this.config.defaultValues,
      validateOnChange: this.config.validateOnChange,
      validateOnBlur: this.config.validateOnBlur,
      onSubmit: async (values) => {
        const handler = this.consumeSubmitHandler();
        if (handler) {
          await handler(values as InferFormOutput<TSchema>, this.form);
        }
      },
    });

    this.initialize();
  }

  private initialize(): void {
    // Prevent default form submission if configured
    if (this.config.preventDefault) {
      const submitListener = EventHelpers.addEventListener(this.element, 'submit', this.handleSubmit.bind(this));
      this.eventListeners.push(submitListener);
    }

    // Auto-bind fields if configured
    if (this.config.autoBind) {
      this.autoBindFields();
    }

    // Subscribe to form state changes
    const unsubscribe = this.form.subscribe('stateChange', (state) => {
      this.updateFormDisplay(state);
    });
    this.eventListeners.push(unsubscribe);
  }

  private autoBindFields(): void {
    const fieldElements = this.element.querySelectorAll('input, select, textarea, [data-field]');

    fieldElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const name = DOMHelpers.getFieldName(htmlElement);

      if (name && !this.fieldControllers.has(name)) {
        this.bindField(htmlElement, { name });
      }
    });
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    await this.submit();
  }

  private updateFormDisplay(state: FormState<InferFormValues<TSchema>>): void {
    const { validation } = this.config;

    if (validation) {
      // Update form-level classes
      if (validation.validClass) {
        this.element.classList.toggle(validation.validClass, state.isValid);
      }

      if (validation.errorClass) {
        this.element.classList.toggle(validation.errorClass, !state.isValid);
      }
    }
  }

  public getState(): FormState<InferFormValues<TSchema>> {
    return this.form.getState();
  }

  public getValues(): InferFormValues<TSchema> {
    return this.form.getValues();
  }

  public setValues(values: Partial<InferFormValues<TSchema>>): void {
    this.form.setValues(values);
  }

  public reset(values?: Partial<InferFormValues<TSchema>>): void {
    this.form.reset(values);
  }

  public async validate(): Promise<boolean> {
    return this.form.validate();
  }

  public async submit(handler?: FormSubmitHandler<TSchema>): Promise<void> {
    if (handler) {
      this.pendingSubmitHandler = handler;
    }

    await this.form.submit();
  }

  public bindField(selector: string | HTMLElement, config?: FieldControllerConfig): FieldControllerInstance {
    const element = typeof selector === 'string' ? DOMHelpers.querySelector<HTMLElement>(selector) : selector;

    if (!element) {
      throw new Error(`Field element not found: ${selector}`);
    }

    const fieldName = config?.name || DOMHelpers.getFieldName(element);

    if (!fieldName) {
      throw new Error('Field name is required');
    }

    // Create field controller
    const fieldController = new FieldController(
      element,
      {
        name: fieldName,
        validateOnChange: config?.validateOnChange ?? this.config.validateOnChange,
        validateOnBlur: config?.validateOnBlur ?? this.config.validateOnBlur,
        ...config,
      },
      this.form,
    );

    this.fieldControllers.set(fieldName, fieldController);

    return fieldController;
  }

  public unbindField(selector: string): void {
    const fieldController = this.fieldControllers.get(selector);

    if (fieldController) {
      fieldController.destroy();
      this.fieldControllers.delete(selector);
    }
  }

  public subscribe(callback: (state: FormState<InferFormValues<TSchema>>) => void): () => void {
    return this.form.subscribe('stateChange', callback);
  }

  public onSubmit(handler: FormSubmitHandler<TSchema>): void {
    this.submitHandler = handler;
  }

  public destroy(): void {
    // Clean up event listeners
    this.eventListeners.forEach((cleanup) => cleanup());
    this.eventListeners.length = 0;

    // Destroy field controllers
    this.fieldControllers.forEach((controller) => controller.destroy());
    this.fieldControllers.clear();
  }

  private consumeSubmitHandler(): FormSubmitHandler<TSchema> | undefined {
    const handler = this.pendingSubmitHandler ?? this.submitHandler;
    this.pendingSubmitHandler = undefined;
    return handler;
  }
}
