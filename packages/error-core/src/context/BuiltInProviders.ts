import type { ContextProvider } from '../types/config.types';

// Browser context provider
export class BrowserContextProvider implements ContextProvider {
  readonly name = 'browser';

  getContext(): Record<string, unknown> {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      userAgent: window.navigator?.userAgent,
      url: window.location?.href,
      referrer: document?.referrer,
      language: window.navigator?.language,
      platform: window.navigator?.platform,
      cookieEnabled: window.navigator?.cookieEnabled,
      onLine: window.navigator?.onLine,
      screenWidth: window.screen?.width,
      screenHeight: window.screen?.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timezone: Intl?.DateTimeFormat?.().resolvedOptions?.()?.timeZone,
    };
  }
}

// Node.js context provider
export class NodeContextProvider implements ContextProvider {
  readonly name = 'node';

  getContext(): Record<string, unknown> {
    if (typeof process === 'undefined') {
      return {};
    }

    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      ppid: process.ppid,
      cwd: process.cwd(),
      execPath: process.execPath,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        USER: process.env.USER,
        HOME: process.env.HOME,
      },
    };
  }
}

// Application context provider
export class ApplicationContextProvider implements ContextProvider {
  readonly name = 'application';

  constructor(
    private appInfo: {
      name?: string;
      version?: string;
      environment?: string;
      buildId?: string;
      deploymentId?: string;
    } = {},
  ) {}

  getContext(): Record<string, unknown> {
    return {
      appName: this.appInfo.name,
      appVersion: this.appInfo.version,
      environment: this.appInfo.environment,
      buildId: this.appInfo.buildId,
      deploymentId: this.appInfo.deploymentId,
      startupTime: new Date().toISOString(),
    };
  }

  updateAppInfo(newInfo: Partial<typeof this.appInfo>): void {
    this.appInfo = { ...this.appInfo, ...newInfo };
  }
}

// Request context provider (for web applications)
export class RequestContextProvider implements ContextProvider {
  readonly name = 'request';
  private currentRequestContext: Record<string, unknown> = {};

  getContext(): Record<string, unknown> {
    return { ...this.currentRequestContext };
  }

  setRequestContext(context: Record<string, unknown>): void {
    this.currentRequestContext = context;
  }

  updateRequestContext(updates: Record<string, unknown>): void {
    this.currentRequestContext = { ...this.currentRequestContext, ...updates };
  }

  clearRequestContext(): void {
    this.currentRequestContext = {};
  }
}

// User context provider
export class UserContextProvider implements ContextProvider {
  readonly name = 'user';
  private userInfo: Record<string, unknown> = {};

  getContext(): Record<string, unknown> {
    return { ...this.userInfo };
  }

  setUser(userInfo: Record<string, unknown>): void {
    this.userInfo = userInfo;
  }

  updateUser(updates: Record<string, unknown>): void {
    this.userInfo = { ...this.userInfo, ...updates };
  }

  clearUser(): void {
    this.userInfo = {};
  }
}

// Session context provider
export class SessionContextProvider implements ContextProvider {
  readonly name = 'session';
  private sessionId: string;
  private sessionStart: Date;
  private sessionData: Record<string, unknown> = {};

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
    this.sessionStart = new Date();
  }

  getContext(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      sessionStart: this.sessionStart.toISOString(),
      sessionDuration: Date.now() - this.sessionStart.getTime(),
      ...this.sessionData,
    };
  }

  setSessionData(key: string, value: unknown): void {
    this.sessionData[key] = value;
  }

  getSessionData(key: string): unknown {
    return this.sessionData[key];
  }

  clearSessionData(): void {
    this.sessionData = {};
  }

  renewSession(newSessionId?: string): void {
    this.sessionId = newSessionId || this.generateSessionId();
    this.sessionStart = new Date();
    this.sessionData = {};
  }

  private generateSessionId(): string {
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Performance context provider
export class PerformanceContextProvider implements ContextProvider {
  readonly name = 'performance';

  getContext(): Record<string, unknown> {
    const context: Record<string, unknown> = {
      timestamp: Date.now(),
    };

    // Browser performance API
    if (typeof window !== 'undefined' && window.performance) {
      context.performanceTiming = {
        navigationStart: window.performance.timing?.navigationStart,
        loadEventEnd: window.performance.timing?.loadEventEnd,
        domContentLoaded: window.performance.timing?.domContentLoadedEventEnd,
      };

      if ((window.performance as any).memory) {
        context.memoryUsage = {
          usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
        };
      }
    }

    // Node.js process information
    if (typeof process !== 'undefined') {
      context.processMemory = process.memoryUsage();
      context.processUptime = process.uptime();
      context.hrtime = process.hrtime();
    }

    return context;
  }
}

// Custom context provider for user-defined context
export class CustomContextProvider implements ContextProvider {
  readonly name: string;
  private contextGetter: () => Record<string, unknown>;

  constructor(name: string, contextGetter: () => Record<string, unknown>) {
    this.name = name;
    this.contextGetter = contextGetter;
  }

  getContext(): Record<string, unknown> {
    try {
      return this.contextGetter();
    } catch (error) {
      console.warn(`Custom context provider '${this.name}' failed:`, error);
      return {};
    }
  }
}
