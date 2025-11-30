/**
 * Serialization utilities for storage values
 */

import type { StorageItem } from '../types';

/**
 * Serialize a value to a string
 */
export function serialize<T>(value: T): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new Error(`Failed to serialize value: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deserialize a string to a value
 */
export function deserialize<T>(value: string): T {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Failed to deserialize value: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Wrap a value in a StorageItem with metadata
 */
export function wrapItem<T>(value: T, ttl?: number): StorageItem<T> {
  const now = Date.now();
  return {
    value,
    createdAt: now,
    accessedAt: now,
    expiresAt: ttl ? now + ttl : undefined,
  };
}

/**
 * Unwrap a StorageItem and check expiration
 */
export function unwrapItem<T>(item: StorageItem<T>, updateAccess = false): T | null {
  if (item.expiresAt && Date.now() > item.expiresAt) {
    return null; // Expired
  }

  if (updateAccess) {
    item.accessedAt = Date.now();
  }

  return item.value;
}

/**
 * Check if an item is expired
 */
export function isExpired(item: StorageItem): boolean {
  return item.expiresAt !== undefined && Date.now() > item.expiresAt;
}
