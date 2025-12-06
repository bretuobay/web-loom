import type { ErrorHandlerConfig, ContextProvider, LogEntry } from '../types/config.types';
import type { CapturedError, ErrorMetadata, ErrorContext } from '../types/error.types';
import type { Transport } from '../logger/Transport';
import { ErrorRegistry } from './ErrorRegistry';
import { ErrorClassifier } from './ErrorClassifier';
import { BaseError } from '../errors/BaseError';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private registry = new ErrorRegistry();
  private classifier = new ErrorClassifier();
  private transports: Transport[] = [];
  private contextProviders: ContextProvider[] = [];
  private errorHandlers: Array<(error: CapturedError) => void> = [];
  private isInitialized = false;
  private config: Required<ErrorHandlerConfig>;

  private constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      autoCapture: config.autoCapture ?? true,
      captureUnhandled: config.captureUnhandled ?? true,
      captureRejections: config.captureRejections ?? true,
      logLevel: config.logLevel || 'error',
      defaultTransports: config.defaultTransports || [],
      defaultContext: config.defaultContext || {},
      maxBreadcrumbs: config.maxBreadcrumbs || 50,
      normalizeStackTraces: config.normalizeStackTraces ?? true,
      batchSize: config.batchSize || 10,
      batchTimeout: config.batchTimeout || 5000,
      maxQueueSize: config.maxQueueSize || 1000,
    };
  }

  static initialize(config?: ErrorHandlerConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
      ErrorHandler.instance.initialize();
    }
    return ErrorHandler.instance;
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      throw new Error('ErrorHandler not initialized. Call initialize() first.');
    }
    return ErrorHandler.instance;
  }

  private initialize(): void {
    if (this.isInitialized) return;

    if (this.config.captureUnhandled || this.config.captureRejections) {
      this.registerGlobalHandlers();
    }

    this.registerBuiltInErrors();
    this.isInitialized = true;
  }

  captureError(
    error: Error | unknown,
    metadata?: Partial<ErrorMetadata>,
    additionalContext?: Record<string, unknown>,
  ): string {
    const errorId = this.generateErrorId();
    const normalizedError = this.normalizeError(error);
    const classification = this.classifier.classify(normalizedError);

    const mergedMetadata: ErrorMetadata = {
      category: metadata?.category || classification.category,
      severity: metadata?.severity || classification.severity,
      code: metadata?.code || (normalizedError instanceof BaseError ? normalizedError.code : 'UNKNOWN_ERROR'),
      timestamp: new Date(),
      recoverable: metadata?.recoverable ?? classification.recoverable,
      retryable: metadata?.retryable ?? classification.retryable,
      userFacing: metadata?.userFacing ?? classification.userFacing,
    };

    const context = this.collectContext(additionalContext);

    const capturedError: CapturedError = {
      error: normalizedError,
      metadata: mergedMetadata,
      context,
      stack: normalizedError.stack,
      breadcrumbs: normalizedError instanceof BaseError ? normalizedError.breadcrumbs : [],
    };

    // Send to transports
    this.sendToTransports(capturedError, errorId);

    // Execute custom handlers
    this.executeHandlers(capturedError);

    return errorId;
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  removeTransport(transportName: string): boolean {
    const initialLength = this.transports.length;
    this.transports = this.transports.filter((t) => t.name !== transportName);
    return this.transports.length < initialLength;
  }

  addContextProvider(provider: ContextProvider): void {
    this.contextProviders.push(provider);
  }

  removeContextProvider(name: string): boolean {
    const initialLength = this.contextProviders.length;
    this.contextProviders = this.contextProviders.filter((p) => p.name !== name);
    return this.contextProviders.length < initialLength;
  }

  onError(handler: (error: CapturedError) => void): () => void {
    this.errorHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  getRegistry(): ErrorRegistry {
    return this.registry;
  }

  getClassifier(): ErrorClassifier {
    return this.classifier;
  }

  getConfig(): Required<ErrorHandlerConfig> {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Statistics and monitoring
  getStatistics() {
    return {
      transports: this.transports.length,
      contextProviders: this.contextProviders.length,
      errorHandlers: this.errorHandlers.length,
      registry: this.registry.getStatistics(),
      config: this.config,
    };
  }

  async flush(): Promise<void> {
    const flushPromises = this.transports.filter((t) => t.flush).map((t) => t.flush!());

    await Promise.allSettled(flushPromises);
  }

  async destroy(): Promise<void> {
    await this.flush();

    // Unregister global handlers
    this.unregisterGlobalHandlers();

    // Destroy transports
    const destroyPromises = this.transports.filter((t) => t.destroy).map((t) => t.destroy!());

    await Promise.allSettled(destroyPromises);

    // Clear everything
    this.transports = [];
    this.contextProviders = [];
    this.errorHandlers = [];
    this.isInitialized = false;
  }

  private collectContext(additional?: Record<string, unknown>): ErrorContext {
    const context: ErrorContext = {
      ...this.config.defaultContext,
    };

    // Collect from all providers
    this.contextProviders.forEach((provider) => {
      try {
        Object.assign(context, provider.getContext());
      } catch (error) {
        console.warn(`Context provider '${provider.name}' failed:`, error);
      }
    });

    // Add additional context
    if (additional) {
      Object.assign(context, additional);
    }

    return context;
  }

  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `err_${timestamp}_${random}`;
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    if (typeof error === 'object' && error !== null) {
      return new Error(`Non-Error object: ${JSON.stringify(error)}`);
    }

    return new Error(`Unknown error: ${String(error)}`);
  }

  private sendToTransports(capturedError: CapturedError, errorId: string): void {
    const logEntry: LogEntry = {
      timestamp: capturedError.metadata.timestamp,
      level: capturedError.metadata.severity,
      message: `[${errorId}] ${capturedError.error.message}`,
      error: {
        name: capturedError.error.name,
        message: capturedError.error.message,
        stack: capturedError.stack,
        code: capturedError.metadata.code,
      },
      data: {
        errorId,
        category: capturedError.metadata.category,
        recoverable: capturedError.metadata.recoverable,
        retryable: capturedError.metadata.retryable,
        userFacing: capturedError.metadata.userFacing,
        breadcrumbs: capturedError.breadcrumbs,
      },
      context: capturedError.context,
    };

    this.transports.forEach((transport) => {
      try {
        const result = transport.log(logEntry);

        // Handle async transports
        if (result && typeof result.catch === 'function') {
          (result as Promise<void>).catch((transportError) => {
            console.error(`Transport '${transport.name}' error:`, transportError);
          });
        }
      } catch (transportError) {
        console.error(`Transport '${transport.name}' error:`, transportError);
      }
    });
  }

  private executeHandlers(capturedError: CapturedError): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(capturedError);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    });
  }

  private registerGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      if (this.config.captureUnhandled) {
        window.addEventListener('error', this.handleGlobalError);
      }
      if (this.config.captureRejections) {
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
      }
    } else if (typeof process !== 'undefined') {
      // Node.js environment
      if (this.config.captureUnhandled) {
        process.on('uncaughtException', this.handleUncaughtException);
      }
      if (this.config.captureRejections) {
        process.on('unhandledRejection', this.handleUnhandledRejection);
      }
    }
  }

  private unregisterGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    } else if (typeof process !== 'undefined') {
      process.removeListener('uncaughtException', this.handleUncaughtException);
      process.removeListener('unhandledRejection', this.handleUnhandledRejection);
    }
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    this.captureError(
      event.error || new Error(event.message),
      {
        category: 'runtime',
        severity: 'error',
      },
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    );
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent | any): void => {
    const reason = event.reason || event;
    this.captureError(
      reason,
      {
        category: 'runtime',
        severity: 'error',
      },
      {
        type: 'unhandled_promise_rejection',
      },
    );
  };

  private handleUncaughtException = (error: Error): void => {
    this.captureError(
      error,
      {
        category: 'runtime',
        severity: 'critical',
      },
      {
        type: 'uncaught_exception',
      },
    );
  };

  private registerBuiltInErrors(): void {
    // This would register common error types
    // Implementation depends on what errors are available
  }
}
