import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance } from 'vue';

/**
 * Enhanced mount helper for Vue testing with better TypeScript support
 */
export function mountComponent<T extends ComponentPublicInstance>(component: any, options?: any): VueWrapper<T> {
  return mount(component, {
    global: {
      stubs: {
        // Add common stubs here
      },
    },
    ...options,
  });
}

/**
 * Helper to create mock Vue composables for testing
 */
export function createMockComposable<T>(defaultValue: T) {
  return (override?: Partial<T>) => ({
    ...defaultValue,
    ...override,
  });
}

/**
 * Helper to wait for Vue's next tick in tests
 */
export async function waitForUpdate() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Helper to create mock form data for testing
 */
export function createMockFormData(overrides?: Record<string, any>) {
  return {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    ...overrides,
  };
}
