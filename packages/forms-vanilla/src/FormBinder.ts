import type { FormInstance } from '../../forms-core/src';
import type { FormBinderConfig, ElementBinder, FieldControllerConfig, FieldControllerInstance } from './types';
import { FieldController } from './FieldController';
import { DOMHelpers } from './utils/DOMHelpers';

/**
 * Utility class for binding multiple form fields
 */
export class FormBinder implements ElementBinder {
  private readonly form: FormInstance<Record<string, unknown>>;
  private readonly config: Required<FormBinderConfig>;
  private readonly boundElements = new WeakMap<HTMLElement, FieldControllerInstance>();

  constructor(form: FormInstance<Record<string, unknown>>, config: FormBinderConfig = {}) {
    this.form = form;
    this.config = {
      fieldSelector: 'input, select, textarea, [data-field]',
      autoBind: true,
      nameAttribute: 'name',
      ...config,
    };
  }

  /**
   * Auto-bind all fields in a container
   */
  public autoBindFields(container: HTMLElement | Document = document): void {
    const fieldElements = container.querySelectorAll(this.config.fieldSelector);

    fieldElements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      if (!this.isBound(htmlElement)) {
        const fieldName = DOMHelpers.getFieldName(htmlElement, this.config.nameAttribute);

        if (fieldName) {
          this.bind(htmlElement, { name: fieldName });
        }
      }
    });
  }

  /**
   * Bind single element to form
   */
  public bind(element: HTMLElement, config: FieldControllerConfig): FieldControllerInstance {
    if (this.isBound(element)) {
      throw new Error('Element is already bound');
    }

    const fieldController = new FieldController(
      element,
      {
        ...config,
        errorDisplay: {
          ...this.config.validation,
          ...config.errorDisplay,
        },
      },
      this.form,
    );

    this.boundElements.set(element, fieldController);

    return fieldController;
  }

  /**
   * Unbind element from form
   */
  public unbind(element: HTMLElement): void {
    const fieldController = this.boundElements.get(element);

    if (fieldController) {
      fieldController.destroy();
      this.boundElements.delete(element);
    }
  }

  /**
   * Check if element is bound
   */
  public isBound(element: HTMLElement): boolean {
    return this.boundElements.has(element);
  }

  /**
   * Get bound field controller for element
   */
  public getController(element: HTMLElement): FieldControllerInstance | undefined {
    return this.boundElements.get(element);
  }

  /**
   * Unbind all elements
   */
  public unbindAll(): void {
    this.boundElements.forEach((controller) => {
      controller.destroy();
    });
  }
}
