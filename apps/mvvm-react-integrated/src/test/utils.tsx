/**
 * Helper to create mock props for components
 */
export function createMockProps<T extends object>(defaults: T, overrides: Partial<T> = {}): T {
  return { ...defaults, ...overrides };
}

/**
 * Helper to wait for async operations in tests
 */
export async function waitForAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock data generators for common use cases
 */
export const mockData = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
  },
  sensor: {
    id: '1',
    name: 'Temperature Sensor',
    type: 'temperature',
    value: 22.5,
    unit: '°C',
  },
  greenhouse: {
    id: '1',
    name: 'Main Greenhouse',
    location: 'Garden Center',
    sensors: [],
  },
};
