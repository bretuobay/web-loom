import type { ErrorCategory } from '../types/error.types';
import { BaseError } from '../errors/BaseError';

export interface ErrorClassification {
  category: ErrorCategory;
  severity: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  recoverable: boolean;
  retryable: boolean;
  userFacing: boolean;
}

export interface ClassificationRule {
  name: string;
  condition: (error: Error) => boolean;
  classification: ErrorClassification;
  priority: number;
}

export class ErrorClassifier {
  private rules: ClassificationRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  classify(error: Error): ErrorClassification {
    // If it's already a BaseError, use its properties
    if (error instanceof BaseError) {
      return {
        category: error.category,
        severity: error.severity,
        recoverable: error.recoverable,
        retryable: error.retryable,
        userFacing: error.userFacing,
      };
    }

    // Find the first matching rule with highest priority
    const matchingRule = this.rules.filter((rule) => rule.condition(error)).sort((a, b) => b.priority - a.priority)[0];

    if (matchingRule) {
      return matchingRule.classification;
    }

    // Default classification
    return {
      category: 'unknown',
      severity: 'error',
      recoverable: true,
      retryable: false,
      userFacing: false,
    };
  }

  addRule(rule: ClassificationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(name: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter((rule) => rule.name !== name);
    return this.rules.length < initialLength;
  }

  getRules(): ClassificationRule[] {
    return [...this.rules];
  }

  private registerDefaultRules(): void {
    // Network/HTTP errors
    this.addRule({
      name: 'network-errors',
      condition: (error) => {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();
        return (
          message.includes('network') ||
          message.includes('fetch') ||
          message.includes('timeout') ||
          name.includes('network') ||
          (error as any).statusCode !== undefined
        );
      },
      classification: {
        category: 'network',
        severity: 'warn',
        recoverable: true,
        retryable: true,
        userFacing: true,
      },
      priority: 80,
    });

    // Validation errors
    this.addRule({
      name: 'validation-errors',
      condition: (error) => {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();
        return (
          message.includes('validation') ||
          message.includes('invalid') ||
          message.includes('required') ||
          name.includes('validation') ||
          name.includes('syntax')
        );
      },
      classification: {
        category: 'validation',
        severity: 'warn',
        recoverable: true,
        retryable: false,
        userFacing: true,
      },
      priority: 75,
    });

    // Authentication/Authorization errors
    this.addRule({
      name: 'auth-errors',
      condition: (error) => {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();
        const statusCode = (error as any).statusCode;
        return (
          message.includes('unauthorized') ||
          message.includes('forbidden') ||
          message.includes('authentication') ||
          name.includes('auth') ||
          statusCode === 401 ||
          statusCode === 403
        );
      },
      classification: {
        category: 'authentication',
        severity: 'warn',
        recoverable: true,
        retryable: false,
        userFacing: true,
      },
      priority: 85,
    });

    // Runtime errors
    this.addRule({
      name: 'runtime-errors',
      condition: (error) => {
        const name = error.name.toLowerCase();
        return name.includes('reference') || name.includes('type') || name.includes('range') || name === 'error';
      },
      classification: {
        category: 'runtime',
        severity: 'error',
        recoverable: false,
        retryable: false,
        userFacing: false,
      },
      priority: 60,
    });

    // Third-party service errors
    this.addRule({
      name: 'third-party-errors',
      condition: (error) => {
        const message = error.message.toLowerCase();
        return (
          message.includes('service unavailable') ||
          message.includes('api') ||
          message.includes('external') ||
          (error as any).statusCode >= 500
        );
      },
      classification: {
        category: 'third_party',
        severity: 'warn',
        recoverable: true,
        retryable: true,
        userFacing: false,
      },
      priority: 70,
    });
  }
}
