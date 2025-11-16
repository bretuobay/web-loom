import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useFormBehavior } from '../index';

describe('useFormBehavior', () => {
  describe('initial state', () => {
    it('should initialize with provided values', () => {
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: '', password: '' },
            fields: {},
          });
          return { form };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.form.values.value).toEqual({ email: '', password: '' });
      expect(vm.form.errors.value).toEqual({});
      expect(vm.form.touched.value).toEqual({});
      expect(vm.form.dirty.value).toEqual({});
      expect(vm.form.isValid.value).toBe(true);
      expect(vm.form.isValidating.value).toBe(false);
      expect(vm.form.isSubmitting.value).toBe(false);
      expect(vm.form.submitCount.value).toBe(0);
    });
  });

  describe('reactivity', () => {
    it('should update when setting field value', async () => {
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: '' },
            fields: {},
          });
          return { form };
        },
        template: '<div>{{ form.values.value.email }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.form.actions.setFieldValue('email', 'test@example.com');
      await nextTick();

      expect(vm.form.values.value.email).toBe('test@example.com');
      expect(vm.form.dirty.value.email).toBe(true);
      expect(wrapper.text()).toBe('test@example.com');
    });

    it('should update when setting field touched', async () => {
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: '' },
            fields: {},
          });
          return { form };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.form.actions.setFieldTouched('email', true);
      await nextTick();

      expect(vm.form.touched.value.email).toBe(true);
    });

    it('should update when validating field with sync validator', async () => {
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: '' },
            fields: {
              email: {
                validate: (value: string) => {
                  if (!value) return 'Email is required';
                  return null;
                },
              },
            },
          });
          return { form };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      await vm.form.actions.validateField('email');
      await nextTick();

      expect(vm.form.errors.value.email).toBe('Email is required');
      expect(vm.form.isValid.value).toBe(false);
    });

    it('should update when validating field with async validator', async () => {
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: 'test@example.com' },
            fields: {
              email: {
                validate: async (value: string) => {
                  await new Promise((resolve) => setTimeout(resolve, 10));
                  if (!value.includes('@')) return 'Invalid email';
                  return null;
                },
              },
            },
          });
          return { form };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      await vm.form.actions.validateField('email');
      await nextTick();

      expect(vm.form.errors.value.email).toBeUndefined();
      expect(vm.form.isValid.value).toBe(true);
    });

    it('should update when resetting form', async () => {
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: '' },
            fields: {},
          });
          return { form };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.form.actions.setFieldValue('email', 'test@example.com');
      vm.form.actions.setFieldTouched('email', true);
      await nextTick();

      expect(vm.form.values.value.email).toBe('test@example.com');
      expect(vm.form.dirty.value.email).toBe(true);

      vm.form.actions.resetForm();
      await nextTick();

      expect(vm.form.values.value.email).toBe('');
      expect(vm.form.dirty.value).toEqual({});
      expect(vm.form.touched.value).toEqual({});
    });

    it('should update when submitting form', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: 'test@example.com' },
            fields: {},
            onSubmit,
          });
          return { form };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      await vm.form.actions.submitForm();
      await nextTick();

      expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(vm.form.submitCount.value).toBe(1);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: '' },
            fields: {},
          });
          return { form };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      wrapper.unmount();

      expect(() => wrapper.unmount()).not.toThrow();
    });
  });

  describe('computed properties', () => {
    it('should provide computed properties for all state values', () => {
      const TestComponent = defineComponent({
        setup() {
          const form = useFormBehavior({
            initialValues: { email: '' },
            fields: {},
          });
          return { form };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.form.values.value).toBeDefined();
      expect(vm.form.errors.value).toBeDefined();
      expect(vm.form.touched.value).toBeDefined();
      expect(vm.form.dirty.value).toBeDefined();
      expect(vm.form.isValidating.value).toBeDefined();
      expect(vm.form.isValid.value).toBeDefined();
      expect(vm.form.isSubmitting.value).toBeDefined();
      expect(vm.form.submitCount.value).toBeDefined();
    });
  });
});
