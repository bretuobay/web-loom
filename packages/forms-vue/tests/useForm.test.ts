import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { useForm } from '../src/composables/useForm';
import { nextTick } from 'vue';

describe('useForm', () => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    age: z.number().min(18),
  });

  const defaultValues = {
    email: 'default@example.com',
    name: 'Default User',
    age: 18,
  };

  it('should create form with initial state', () => {
    const { values, isValid, isDirty, isSubmitting } = useForm({ schema, defaultValues });

    expect(values.value).toEqual(defaultValues);
    expect(isValid.value).toBe(true);
    expect(isDirty.value).toBe(false);
    expect(isSubmitting.value).toBe(false);
  });

  it('should handle form submission', async () => {
    const onSubmit = vi.fn();
    const { handleSubmit } = useForm({ schema, defaultValues });

    const submitHandler = handleSubmit(onSubmit);
    await submitHandler();

    expect(onSubmit).toHaveBeenCalledWith(defaultValues, expect.any(Object));
  });

  it('should validate form before submission', async () => {
    const onSubmit = vi.fn();
    const { handleSubmit, isValid } = useForm({
      schema,
      defaultValues: {
        email: 'invalid-email',
        name: '',
        age: 15,
      },
    });

    const submitHandler = handleSubmit(onSubmit);
    await submitHandler();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(isValid.value).toBe(false);
  });

  it('should reset form values', async () => {
    const { reset, setValues, values, isDirty } = useForm({
      schema,
      defaultValues,
    });

    setValues({ email: 'test@example.com' });
    await nextTick();

    expect(values.value.email).toBe('test@example.com');
    expect(isDirty.value).toBe(true);

    reset();
    await nextTick();

    expect(values.value).toEqual(defaultValues);
    expect(isDirty.value).toBe(false);
  });

  it('should set form values', async () => {
    const { setValues, values } = useForm({ schema, defaultValues });

    setValues({
      email: 'test@example.com',
      name: 'John Doe',
    });
    await nextTick();

    expect(values.value.email).toBe('test@example.com');
    expect(values.value.name).toBe('John Doe');
    expect(values.value.age).toBe(18); // unchanged
  });

  it('should track form validation state', async () => {
    const { validate, isValid, errors } = useForm({
      schema,
      defaultValues: {
        email: 'invalid-email',
        name: '',
        age: 15,
      },
    });

    await validate();
    await nextTick();

    expect(isValid.value).toBe(false);
    expect(Object.keys(errors.value)).toHaveLength(3);
  });

  it('should update reactive state on form changes', async () => {
    const { form, formState } = useForm({ schema, defaultValues });

    form.setFieldValue('email', 'test@example.com');
    await nextTick();

    expect(formState.value.values.email).toBe('test@example.com');
    expect(formState.value.isDirty).toBe(true);
  });
});
