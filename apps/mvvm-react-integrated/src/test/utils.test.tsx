import { describe, it, expect, vi } from 'vitest';
import { createMockProps, waitForAsync, mockData } from './utils';

describe('Test Utilities', () => {
  describe('createMockProps', () => {
    it('should create props with defaults only', () => {
      const defaults = { name: 'Test', age: 25 };
      const props = createMockProps(defaults);

      expect(props).toEqual({ name: 'Test', age: 25 });
    });

    it('should merge defaults with overrides', () => {
      const defaults = { name: 'Test', age: 25, city: 'NYC' };
      const overrides = { age: 30 };
      const props = createMockProps(defaults, overrides);

      expect(props).toEqual({ name: 'Test', age: 30, city: 'NYC' });
    });

    it('should override multiple properties', () => {
      const defaults = { name: 'Test', age: 25, city: 'NYC' };
      const overrides = { name: 'New Name', city: 'LA' };
      const props = createMockProps(defaults, overrides);

      expect(props).toEqual({ name: 'New Name', age: 25, city: 'LA' });
    });

    it('should handle empty overrides', () => {
      const defaults = { name: 'Test', age: 25 };
      const props = createMockProps(defaults, {});

      expect(props).toEqual({ name: 'Test', age: 25 });
    });

    it('should handle complex nested objects', () => {
      const defaults = {
        user: { name: 'Test', profile: { age: 25 } },
        settings: { theme: 'light' },
      };
      const overrides = {
        settings: { theme: 'dark' },
      };
      const props = createMockProps(defaults, overrides);

      expect(props.settings.theme).toBe('dark');
      expect(props.user.name).toBe('Test');
    });
  });

  describe('waitForAsync', () => {
    it('should wait for async operations', async () => {
      let executed = false;

      setTimeout(() => {
        executed = true;
      }, 0);

      expect(executed).toBe(false);

      await waitForAsync();

      expect(executed).toBe(true);
    });

    it('should allow promise chaining', async () => {
      const result = await waitForAsync().then(() => 'completed');
      expect(result).toBe('completed');
    });

    it('should work with multiple sequential waits', async () => {
      let counter = 0;

      setTimeout(() => {
        counter++;
      }, 0);

      await waitForAsync();
      expect(counter).toBe(1);

      setTimeout(() => {
        counter++;
      }, 0);

      await waitForAsync();
      expect(counter).toBe(2);
    });
  });

  describe('mockData', () => {
    describe('user', () => {
      it('should have correct user structure', () => {
        expect(mockData.user).toHaveProperty('id');
        expect(mockData.user).toHaveProperty('name');
        expect(mockData.user).toHaveProperty('email');
      });

      it('should have valid user data', () => {
        expect(mockData.user.id).toBe('1');
        expect(mockData.user.name).toBe('Test User');
        expect(mockData.user.email).toBe('test@example.com');
      });
    });

    describe('sensor', () => {
      it('should have correct sensor structure', () => {
        expect(mockData.sensor).toHaveProperty('id');
        expect(mockData.sensor).toHaveProperty('name');
        expect(mockData.sensor).toHaveProperty('type');
        expect(mockData.sensor).toHaveProperty('value');
        expect(mockData.sensor).toHaveProperty('unit');
      });

      it('should have valid sensor data', () => {
        expect(mockData.sensor.id).toBe('1');
        expect(mockData.sensor.name).toBe('Temperature Sensor');
        expect(mockData.sensor.type).toBe('temperature');
        expect(mockData.sensor.value).toBe(22.5);
        expect(mockData.sensor.unit).toBe('°C');
      });
    });

    describe('greenhouse', () => {
      it('should have correct greenhouse structure', () => {
        expect(mockData.greenhouse).toHaveProperty('id');
        expect(mockData.greenhouse).toHaveProperty('name');
        expect(mockData.greenhouse).toHaveProperty('location');
        expect(mockData.greenhouse).toHaveProperty('sensors');
      });

      it('should have valid greenhouse data', () => {
        expect(mockData.greenhouse.id).toBe('1');
        expect(mockData.greenhouse.name).toBe('Main Greenhouse');
        expect(mockData.greenhouse.location).toBe('Garden Center');
        expect(Array.isArray(mockData.greenhouse.sensors)).toBe(true);
      });
    });
  });
});
