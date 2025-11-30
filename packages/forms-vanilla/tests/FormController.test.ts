import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';
import { FormController } from '../src/FormController';
import { JSDOM } from 'jsdom';

// Setup JSDOM
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <form id="test-form">
        <input name="email" type="email" />
        <input name="name" type="text" />
        <input name="age" type="number" />
        <button type="submit">Submit</button>
      </form>
    </body>
  </html>
`);

global.document = dom.window.document;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLFormElement = dom.window.HTMLFormElement;
global.HTMLInputElement = dom.window.HTMLInputElement;

describe('FormController', () => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    age: z.number().min(18),
  });

  const defaultValues = {
    email: '',
    name: '',
    age: 18,
  };

  let formElement: HTMLFormElement;
  let controller: FormController<typeof schema>;

  beforeEach(() => {
    formElement = document.getElementById('test-form') as HTMLFormElement;
    controller = new FormController({
      form: formElement,
      schema,
      defaultValues,
    });
  });

  afterEach(() => {
    controller.destroy();
    // Reset form
    formElement.reset();
  });

  it('should create form controller with form element', () => {
    expect(controller.element).toBe(formElement);
    expect(controller.form).toBeDefined();
    expect(controller.getValues()).toEqual(defaultValues);
  });

  it('should auto-bind form fields', () => {
    const emailField = formElement.querySelector('[name="email"]') as HTMLInputElement;
    const nameField = formElement.querySelector('[name="name"]') as HTMLInputElement;
    const ageField = formElement.querySelector('[name="age"]') as HTMLInputElement;

    expect(emailField).toBeDefined();
    expect(nameField).toBeDefined();
    expect(ageField).toBeDefined();

    // Form should have registered the fields
    const state = controller.getState();
    expect(state.fields.email).toBeDefined();
    expect(state.fields.name).toBeDefined();
    expect(state.fields.age).toBeDefined();
  });

  it('should handle field value changes', () => {
    const emailField = formElement.querySelector('[name="email"]') as HTMLInputElement;

    emailField.value = 'test@example.com';
    emailField.dispatchEvent(new Event('input', { bubbles: true }));
    emailField.dispatchEvent(new Event('change', { bubbles: true }));

    expect(controller.getValues().email).toBe('test@example.com');
  });

  it('should validate form', async () => {
    controller.setValues({
      email: 'invalid-email',
      name: '',
      age: 15,
    });

    const isValid = await controller.validate();
    expect(isValid).toBe(false);

    const state = controller.getState();
    expect(state.isValid).toBe(false);
    expect(Object.keys(state.fieldErrors)).toHaveLength(3);
  });

  it('should handle form submission', async () => {
    const onSubmit = vi.fn();

    controller.setValues({
      email: 'test@example.com',
      name: 'John Doe',
      age: 25,
    });

    await controller.submit(onSubmit);

    expect(onSubmit).toHaveBeenCalledWith(
      {
        email: 'test@example.com',
        name: 'John Doe',
        age: 25,
      },
      controller.form,
    );
  });

  it('should prevent form submission with validation errors', async () => {
    const onSubmit = vi.fn();

    controller.setValues({
      email: 'invalid-email',
      name: '',
      age: 15,
    });

    await controller.submit(onSubmit);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should handle form reset', () => {
    controller.setValues({
      email: 'test@example.com',
      name: 'John Doe',
    });

    expect(controller.getState().isDirty).toBe(true);

    controller.reset();

    expect(controller.getValues()).toEqual(defaultValues);
    expect(controller.getState().isDirty).toBe(false);
  });

  it('should bind and unbind fields dynamically', () => {
    const newInput = document.createElement('input');
    newInput.name = 'newField';
    formElement.appendChild(newInput);

    const fieldController = controller.bindField(newInput, {
      name: 'newField',
    });

    expect(fieldController).toBeDefined();
    expect(fieldController.name).toBe('newField');

    controller.unbindField('newField');

    // Field should be unregistered
    const state = controller.getState();
    expect(state.fields.newField).toBeUndefined();
  });

  it('should subscribe to form state changes', () => {
    const callback = vi.fn();
    const unsubscribe = controller.subscribe(callback);

    controller.setValues({ email: 'test@example.com' });

    expect(callback).toHaveBeenCalled();

    unsubscribe();

    controller.setValues({ name: 'John Doe' });

    // Callback should not be called after unsubscribe
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
