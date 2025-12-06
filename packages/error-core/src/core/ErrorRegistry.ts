import { BaseError } from '../errors/BaseError';

export interface ErrorRegistryEntry {
  errorClass: new (...args: any[]) => BaseError;
  code: string;
  category: string;
  description: string;
  examples?: string[];
}

export class ErrorRegistry {
  private registry = new Map<string, ErrorRegistryEntry>();
  private codeToClass = new Map<string, new (...args: any[]) => BaseError>();

  register(entry: ErrorRegistryEntry): void {
    this.registry.set(entry.errorClass.name, entry);
    this.codeToClass.set(entry.code, entry.errorClass);
  }

  unregister(className: string): boolean {
    const entry = this.registry.get(className);
    if (entry) {
      this.registry.delete(className);
      this.codeToClass.delete(entry.code);
      return true;
    }
    return false;
  }

  getByClassName(className: string): ErrorRegistryEntry | undefined {
    return this.registry.get(className);
  }

  getByCode(code: string): ErrorRegistryEntry | undefined {
    const ErrorClass = this.codeToClass.get(code);
    if (ErrorClass) {
      return this.registry.get(ErrorClass.name);
    }
    return undefined;
  }

  createErrorByCode(code: string, message: string, options?: any): BaseError | null {
    const ErrorClass = this.codeToClass.get(code);
    if (ErrorClass) {
      return new ErrorClass(message, options);
    }
    return null;
  }

  getAllErrors(): ErrorRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  getErrorsByCategory(category: string): ErrorRegistryEntry[] {
    return Array.from(this.registry.values()).filter((entry) => entry.category === category);
  }

  getCodes(): string[] {
    return Array.from(this.codeToClass.keys());
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    this.registry.forEach((entry) => categories.add(entry.category));
    return Array.from(categories);
  }

  isRegistered(className: string): boolean {
    return this.registry.has(className);
  }

  isCodeRegistered(code: string): boolean {
    return this.codeToClass.has(code);
  }

  // Utility methods for error analysis
  getStatistics() {
    const stats = {
      totalErrors: this.registry.size,
      categories: {} as Record<string, number>,
    };

    this.registry.forEach((entry) => {
      stats.categories[entry.category] = (stats.categories[entry.category] || 0) + 1;
    });

    return stats;
  }

  // Search functionality
  search(query: string): ErrorRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.registry.values()).filter(
      (entry) =>
        entry.errorClass.name.toLowerCase().includes(lowerQuery) ||
        entry.code.toLowerCase().includes(lowerQuery) ||
        entry.description.toLowerCase().includes(lowerQuery) ||
        entry.category.toLowerCase().includes(lowerQuery) ||
        entry.examples?.some((example) => example.toLowerCase().includes(lowerQuery)),
    );
  }

  // Export/Import for configuration
  export(): Record<string, Omit<ErrorRegistryEntry, 'errorClass'> & { className: string }> {
    const exported: Record<string, Omit<ErrorRegistryEntry, 'errorClass'> & { className: string }> = {};

    this.registry.forEach((entry, className) => {
      exported[className] = {
        className,
        code: entry.code,
        category: entry.category,
        description: entry.description,
        examples: entry.examples,
      };
    });

    return exported;
  }

  // Validation
  validate(): string[] {
    const issues: string[] = [];
    const usedCodes = new Set<string>();

    this.registry.forEach((entry, className) => {
      // Check for duplicate codes
      if (usedCodes.has(entry.code)) {
        issues.push(`Duplicate error code: ${entry.code}`);
      } else {
        usedCodes.add(entry.code);
      }

      // Check for missing required fields
      if (!entry.code) {
        issues.push(`Error class ${className} missing code`);
      }
      if (!entry.category) {
        issues.push(`Error class ${className} missing category`);
      }
      if (!entry.description) {
        issues.push(`Error class ${className} missing description`);
      }
    });

    return issues;
  }
}
