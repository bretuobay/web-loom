/**
 * DOM manipulation helpers
 */
export class DOMHelpers {
  /**
   * Query selector with type safety
   */
  static querySelector<T extends HTMLElement = HTMLElement>(
    selector: string,
    container: Document | HTMLElement = document,
  ): T {
    const element = container.querySelector(selector) as T;
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return element;
  }

  /**
   * Query selector that returns null if not found
   */
  static querySelectorSafe<T extends HTMLElement = HTMLElement>(
    selector: string,
    container: Document | HTMLElement = document,
  ): T | null {
    return container.querySelector(selector) as T | null;
  }

  /**
   * Get field name from element
   */
  static getFieldName(element: HTMLElement, nameAttribute = 'name'): string | null {
    // Try name attribute first
    const name = element.getAttribute(nameAttribute);
    if (name) return name;

    // Try data-field attribute
    const dataField = element.getAttribute('data-field');
    if (dataField) return dataField;

    // Try id as fallback
    const id = element.getAttribute('id');
    if (id) return id;

    return null;
  }

  /**
   * Get value from form element
   */
  static getElementValue(element: HTMLElement): unknown {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'checkbox':
          return element.checked;
        case 'radio':
          return element.checked ? element.value : undefined;
        case 'number':
        case 'range':
          return element.valueAsNumber;
        case 'date':
        case 'datetime-local':
        case 'time':
          return element.valueAsDate || element.value;
        case 'file':
          return element.files;
        default:
          return element.value;
      }
    }

    if (element instanceof HTMLSelectElement) {
      if (element.multiple) {
        return Array.from(element.selectedOptions).map((option) => option.value);
      }
      return element.value;
    }

    if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }

    // Custom element or contenteditable
    if (element.hasAttribute('contenteditable')) {
      return element.textContent;
    }

    // Fallback to data-value or textContent
    const dataValue = element.getAttribute('data-value');
    if (dataValue) return dataValue;

    return element.textContent;
  }

  /**
   * Set value to form element
   */
  static setElementValue(element: HTMLElement, value: unknown): void {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'checkbox':
          element.checked = Boolean(value);
          break;
        case 'radio':
          element.checked = element.value === String(value);
          break;
        case 'file':
          // File inputs are read-only, cannot set value
          break;
        default:
          element.value = String(value || '');
          break;
      }
      return;
    }

    if (element instanceof HTMLSelectElement) {
      if (element.multiple && Array.isArray(value)) {
        Array.from(element.options).forEach((option) => {
          option.selected = value.includes(option.value);
        });
      } else {
        element.value = String(value || '');
      }
      return;
    }

    if (element instanceof HTMLTextAreaElement) {
      element.value = String(value || '');
      return;
    }

    // Custom element or contenteditable
    if (element.hasAttribute('contenteditable')) {
      element.textContent = String(value || '');
      return;
    }

    // Fallback to data-value
    element.setAttribute('data-value', String(value || ''));
  }

  /**
   * Check if element is a form field
   */
  static isFormField(element: HTMLElement): boolean {
    return (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement ||
      element.hasAttribute('data-field')
    );
  }

  /**
   * Get closest form element
   */
  static getClosestForm(element: HTMLElement): HTMLFormElement | null {
    return element.closest('form');
  }

  /**
   * Create element with attributes
   */
  static createElement<T extends HTMLElement = HTMLElement>(
    tagName: string,
    attributes: Record<string, string> = {},
    textContent?: string,
  ): T {
    const element = document.createElement(tagName) as T;

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  /**
   * Add CSS class if not present
   */
  static addClass(element: HTMLElement, className: string): void {
    element.classList.add(className);
  }

  /**
   * Remove CSS class if present
   */
  static removeClass(element: HTMLElement, className: string): void {
    element.classList.remove(className);
  }

  /**
   * Toggle CSS class
   */
  static toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
    return element.classList.toggle(className, force);
  }
}
