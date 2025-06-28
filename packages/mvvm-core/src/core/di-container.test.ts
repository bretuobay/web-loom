import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleDIContainer, ServiceRegistry, Constructor, Factory } from './di-container';

// --- Test Services and Interfaces ---
interface ILogger {
  log(message: string): void;
  getLogs(): string[];
}

class ConsoleLogger implements ILogger {
  private logs: string[] = [];
  log(message: string) {
    this.logs.push(message);
    // console.log(`ConsoleLogger: ${message}`);
  }
  getLogs(): string[] {
    return this.logs;
  }
}

class AdvancedLogger implements ILogger {
  private logs: string[] = [];
  constructor(private prefix: string) {}
  log(message: string) {
    const prefixedMessage = `[${this.prefix}] ${message}`;
    this.logs.push(prefixedMessage);
    // console.log(`AdvancedLogger: ${prefixedMessage}`);
  }
  getLogs(): string[] {
    return this.logs;
  }
}


class UserService {
  constructor(public logger: ILogger) {}

  greet(name: string): string {
    const message = `Hello, ${name}!`;
    this.logger.log(message);
    return message;
  }
}

class ConfigService {
  constructor(public readonly apiKey: string) {}
}

// --- Augment ServiceRegistry for tests ---
declare module './di-container' {
  interface ServiceRegistry {
    logger: ILogger;
    userService: UserService;
    configService: ConfigService;
    apiKey: string; // For factory-produced primitive
    transientService: ConsoleLogger;
    singletonService: ConsoleLogger;
    serviceWithNoDeps: ConsoleLogger;
    dependentService: UserService; // Depends on logger
    factoryProducedService: AdvancedLogger;
    circularA: CircularA;
    circularB: CircularB;
  }
}

// For circular dependency tests
class CircularA {
    constructor(public b: CircularB) {}
}
class CircularB {
    constructor(public a: CircularA) {}
}


describe('SimpleDIContainer', () => {
  beforeEach(() => {
    SimpleDIContainer.reset(); // Ensure a clean state for each test
  });

  afterEach(() => {
    SimpleDIContainer.reset();
  });

  it('should register and resolve a simple service (constructor)', () => {
    SimpleDIContainer.register('serviceWithNoDeps', ConsoleLogger);
    const instance = SimpleDIContainer.resolve('serviceWithNoDeps');
    expect(instance).toBeInstanceOf(ConsoleLogger);
  });

  it('should register and resolve a service with dependencies', () => {
    SimpleDIContainer.register('logger', ConsoleLogger);
    SimpleDIContainer.register('dependentService', UserService, { dependencies: ['logger'] });

    const userService = SimpleDIContainer.resolve('dependentService');
    expect(userService).toBeInstanceOf(UserService);
    expect(userService.logger).toBeInstanceOf(ConsoleLogger);
    userService.greet('TestUser');
    expect((userService.logger as ConsoleLogger).getLogs()).toContain('Hello, TestUser!');
  });

  it('should handle singleton services: resolve returns the same instance', () => {
    SimpleDIContainer.register('singletonService', ConsoleLogger, { isSingleton: true });
    const instance1 = SimpleDIContainer.resolve('singletonService');
    const instance2 = SimpleDIContainer.resolve('singletonService');
    expect(instance1).toBe(instance2);
  });

  it('should handle transient services: resolve returns a new instance each time', () => {
    SimpleDIContainer.register('transientService', ConsoleLogger, { isSingleton: false }); // or omit isSingleton
    const instance1 = SimpleDIContainer.resolve('transientService');
    const instance2 = SimpleDIContainer.resolve('transientService');
    expect(instance1).not.toBe(instance2);
    expect(instance1).toBeInstanceOf(ConsoleLogger);
    expect(instance2).toBeInstanceOf(ConsoleLogger);
  });

  it('isSingleton defaults to false (transient)', () => {
    SimpleDIContainer.register('transientService', ConsoleLogger); // No isSingleton option
    const instance1 = SimpleDIContainer.resolve('transientService');
    const instance2 = SimpleDIContainer.resolve('transientService');
    expect(instance1).not.toBe(instance2);
  });

  it('should throw an error if trying to resolve an unregistered service', () => {
    expect(() => SimpleDIContainer.resolve('logger')).toThrow('DI Container: Service with key "logger" not registered.');
  });

  it('should register and resolve using a factory function', () => {
    const apiKeyFactory: Factory<string> = () => 'test-api-key-123';
    SimpleDIContainer.register('apiKey', apiKeyFactory);
    const apiKey = SimpleDIContainer.resolve('apiKey');
    expect(apiKey).toBe('test-api-key-123');
  });

  it('should register and resolve using a factory function with dependencies', () => {
    SimpleDIContainer.register('apiKey', () => 'prefix-for-logger');
    const advancedLoggerFactory: Factory<AdvancedLogger> = (prefix: string) => new AdvancedLogger(prefix);
    SimpleDIContainer.register('factoryProducedService', advancedLoggerFactory, { dependencies: ['apiKey'] });

    const logger = SimpleDIContainer.resolve('factoryProducedService');
    expect(logger).toBeInstanceOf(AdvancedLogger);
    logger.log('Factory test');
    expect(logger.getLogs()).toContain('[prefix-for-logger] Factory test');
  });

  it('factory function as singleton should return same instance', () => {
    let factoryCallCount = 0;
    const myFactory: Factory<{ id: number }> = () => {
        factoryCallCount++;
        return { id: Math.random() };
    };
    SimpleDIContainer.register('logger', myFactory, { isSingleton: true }); // Key 'logger' reused for convenience

    const instance1 = SimpleDIContainer.resolve('logger');
    const instance2 = SimpleDIContainer.resolve('logger');

    expect(instance1).toBe(instance2);
    expect(factoryCallCount).toBe(1);
  });


  it('reset() should clear all registrations', () => {
    SimpleDIContainer.register('logger', ConsoleLogger);
    expect(SimpleDIContainer.isRegistered('logger')).toBe(true);
    SimpleDIContainer.reset();
    expect(SimpleDIContainer.isRegistered('logger')).toBe(false);
    expect(() => SimpleDIContainer.resolve('logger')).toThrow();
  });

  it('unregister() should remove a specific service', () => {
    SimpleDIContainer.register('logger', ConsoleLogger);
    SimpleDIContainer.register('serviceWithNoDeps', ConsoleLogger);
    expect(SimpleDIContainer.isRegistered('logger')).toBe(true);
    expect(SimpleDIContainer.isRegistered('serviceWithNoDeps')).toBe(true);

    SimpleDIContainer.unregister('logger');
    expect(SimpleDIContainer.isRegistered('logger')).toBe(false);
    expect(SimpleDIContainer.isRegistered('serviceWithNoDeps')).toBe(true); // Other services remain
    expect(() => SimpleDIContainer.resolve('logger')).toThrow();
  });

  it('isRegistered() should return true for registered services, false otherwise', () => {
    expect(SimpleDIContainer.isRegistered('logger')).toBe(false);
    SimpleDIContainer.register('logger', ConsoleLogger);
    expect(SimpleDIContainer.isRegistered('logger')).toBe(true);
  });

  it('should throw error for circular dependencies', () => {
    SimpleDIContainer.register('circularA', CircularA, { dependencies: ['circularB'] });
    SimpleDIContainer.register('circularB', CircularB, { dependencies: ['circularA'] });

    expect(() => SimpleDIContainer.resolve('circularA'))
      .toThrow('DI Container: Circular dependency detected for key "circularA". Path: circularA -> circularB -> circularA');

    // Also test starting resolution from B
     expect(() => SimpleDIContainer.resolve('circularB'))
      .toThrow('DI Container: Circular dependency detected for key "circularB". Path: circularB -> circularA -> circularB');
  });

  it('should throw error if a service lists itself as a direct dependency', () => {
    SimpleDIContainer.register('logger', ConsoleLogger, { dependencies: ['logger'] as any }); // 'as any' to bypass stricter typing if ServiceRegistry implies non-self deps
    expect(() => SimpleDIContainer.resolve('logger'))
        .toThrow('DI Container: Service "logger" cannot directly depend on itself in the dependencies array.');
  });

  it('should handle re-registration of a service (last one wins)', () => {
    SimpleDIContainer.register('logger', ConsoleLogger, { isSingleton: true });
    const instance1 = SimpleDIContainer.resolve('logger');
    expect(instance1).toBeInstanceOf(ConsoleLogger);

    // Re-register with a different implementation (or factory)
    const advancedLoggerFactory: Factory<AdvancedLogger> = () => new AdvancedLogger("override");
    SimpleDIContainer.register('logger', advancedLoggerFactory, { isSingleton: true });

    const instance2 = SimpleDIContainer.resolve('logger');
    expect(instance2).toBeInstanceOf(AdvancedLogger);
    expect((instance2 as AdvancedLogger).getLogs()).toEqual([]); // Fresh instance
    (instance2 as AdvancedLogger).log("message");
    expect((instance2 as AdvancedLogger).getLogs()).toEqual(["[override] message"]);

    // Ensure the old singleton instance is gone if it was a singleton
    const instance3 = SimpleDIContainer.resolve('logger');
    expect(instance3).toBe(instance2); // Should be the new singleton instance
  });

  it('should throw if constructor/factory throws during instantiation', () => {
    class FailingService {
        constructor() {
            throw new Error("Constructor failed!");
        }
    }
    SimpleDIContainer.register('logger', FailingService); // Key 'logger' reused
    expect(() => SimpleDIContainer.resolve('logger'))
        .toThrow('DI Container: Error instantiating service "logger". Original error: Constructor failed!');

    const failingFactory: Factory<any> = () => {
        throw new Error("Factory failed!");
    };
    SimpleDIContainer.register('userService', failingFactory); // Key 'userService' reused
    expect(() => SimpleDIContainer.resolve('userService'))
        .toThrow('DI Container: Error instantiating service "userService". Original error: Factory failed!');
  });

  it('should allow dependencies to be undefined if service does not require them', () => {
    SimpleDIContainer.register('logger', ConsoleLogger, { dependencies: undefined });
    const logger = SimpleDIContainer.resolve('logger');
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

  it('should allow empty dependencies array', () => {
    SimpleDIContainer.register('logger', ConsoleLogger, { dependencies: [] });
    const logger = SimpleDIContainer.resolve('logger');
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

});
