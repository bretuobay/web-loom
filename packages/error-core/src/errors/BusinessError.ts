import { BaseError } from './BaseError';

export class BusinessError extends BaseError {
  constructor(
    message: string,
    options: {
      code?: string;
      operation?: string;
      domain?: string;
      cause?: Error;
      data?: Record<string, unknown>;
    } = {},
  ) {
    super(message, {
      name: 'BusinessError',
      code: options.code || 'BUSINESS_RULE_VIOLATION',
      category: 'business',
      severity: 'warn',
      retryable: false,
      recoverable: true,
      userFacing: true,
      cause: options.cause,
      context: {
        operation: options.operation,
        domain: options.domain,
        data: options.data,
      },
    });
  }

  get operation(): string | undefined {
    return this.context.operation as string;
  }

  get domain(): string | undefined {
    return this.context.domain as string;
  }
}

export class InsufficientPermissionError extends BusinessError {
  constructor(
    resource: string,
    action: string,
    options: {
      userId?: string;
      requiredRole?: string;
      cause?: Error;
    } = {},
  ) {
    super(`Insufficient permission to ${action} ${resource}`, {
      code: 'INSUFFICIENT_PERMISSION',
      operation: action,
      domain: 'authorization',
      cause: options.cause,
      data: {
        resource,
        action,
        userId: options.userId,
        requiredRole: options.requiredRole,
      },
    });
  }
}

export class ResourceNotFoundError extends BusinessError {
  constructor(
    resourceType: string,
    identifier: string,
    options: {
      cause?: Error;
    } = {},
  ) {
    super(`${resourceType} with identifier '${identifier}' not found`, {
      code: 'RESOURCE_NOT_FOUND',
      operation: 'read',
      domain: 'data',
      cause: options.cause,
      data: {
        resourceType,
        identifier,
      },
    });
  }
}

export class ConflictError extends BusinessError {
  constructor(
    message: string,
    options: {
      conflictType?: string;
      existingResource?: string;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      code: 'RESOURCE_CONFLICT',
      operation: 'create',
      domain: 'data',
      cause: options.cause,
      data: {
        conflictType: options.conflictType,
        existingResource: options.existingResource,
      },
    });
  }
}
