/**
 * Interceptor Management
 * Request and response interceptor system
 */

import type { InterceptorManager, RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from './types';

/**
 * Generic interceptor manager implementation
 */
export class InterceptorManagerImpl<T> implements InterceptorManager<T> {
  private interceptors: Map<number, T> = new Map();
  private nextId = 0;

  /**
   * Add an interceptor
   */
  use(interceptor: T): number {
    const id = this.nextId++;
    this.interceptors.set(id, interceptor);
    return id;
  }

  /**
   * Remove an interceptor by ID
   */
  eject(id: number): void {
    this.interceptors.delete(id);
  }

  /**
   * Clear all interceptors
   */
  clear(): void {
    this.interceptors.clear();
  }

  /**
   * Get all interceptors
   */
  getAll(): T[] {
    return Array.from(this.interceptors.values());
  }
}

/**
 * Request interceptor manager
 */
export class RequestInterceptorManager extends InterceptorManagerImpl<RequestInterceptor> {}

/**
 * Response interceptor manager
 */
export class ResponseInterceptorManager extends InterceptorManagerImpl<ResponseInterceptor> {}

/**
 * Error interceptor manager
 */
export class ErrorInterceptorManager extends InterceptorManagerImpl<ErrorInterceptor> {}
