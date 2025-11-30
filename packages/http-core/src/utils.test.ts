import { describe, it, expect } from 'vitest';
import { buildURL, buildQueryString, mergeHeaders, createRequestSignature } from './utils';

describe('Utils', () => {
  describe('buildURL', () => {
    it('should combine base URL and relative path', () => {
      expect(buildURL('https://api.example.com', '/users')).toBe('https://api.example.com/users');
    });

    it('should handle trailing slashes', () => {
      expect(buildURL('https://api.example.com/', '/users')).toBe('https://api.example.com/users');
    });

    it('should return absolute URL as-is', () => {
      expect(buildURL('https://api.example.com', 'https://other.com/data')).toBe('https://other.com/data');
    });

    it('should handle missing base URL', () => {
      expect(buildURL(undefined, '/users')).toBe('/users');
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from object', () => {
      const result = buildQueryString({ q: 'test', page: 1 });
      expect(result).toBe('?q=test&page=1');
    });

    it('should handle arrays', () => {
      const result = buildQueryString({ tags: ['a', 'b', 'c'] });
      expect(result).toContain('tags=a');
      expect(result).toContain('tags=b');
      expect(result).toContain('tags=c');
    });

    it('should skip null and undefined values', () => {
      const result = buildQueryString({ a: 'value', b: null, c: undefined });
      expect(result).toBe('?a=value');
    });

    it('should return empty string for empty object', () => {
      expect(buildQueryString({})).toBe('');
    });
  });

  describe('mergeHeaders', () => {
    it('should merge multiple header objects', () => {
      const result = mergeHeaders({ 'X-A': '1' }, { 'X-B': '2' }, { 'X-C': '3' });
      expect(result).toEqual({ 'X-A': '1', 'X-B': '2', 'X-C': '3' });
    });

    it('should override with later values', () => {
      const result = mergeHeaders({ 'X-Token': 'old' }, { 'X-Token': 'new' });
      expect(result['X-Token']).toBe('new');
    });

    it('should handle undefined headers', () => {
      const result = mergeHeaders({ 'X-A': '1' }, undefined, { 'X-B': '2' });
      expect(result).toEqual({ 'X-A': '1', 'X-B': '2' });
    });
  });

  describe('createRequestSignature', () => {
    it('should create unique signature for different URLs', () => {
      const sig1 = createRequestSignature({ url: '/users' });
      const sig2 = createRequestSignature({ url: '/posts' });
      expect(sig1).not.toBe(sig2);
    });

    it('should create unique signature for different methods', () => {
      const sig1 = createRequestSignature({ method: 'GET', url: '/users' });
      const sig2 = createRequestSignature({ method: 'POST', url: '/users' });
      expect(sig1).not.toBe(sig2);
    });

    it('should include params in signature', () => {
      const sig1 = createRequestSignature({ url: '/users', params: { page: 1 } });
      const sig2 = createRequestSignature({ url: '/users', params: { page: 2 } });
      expect(sig1).not.toBe(sig2);
    });

    it('should include data in signature', () => {
      const sig1 = createRequestSignature({ url: '/users', data: { name: 'John' } });
      const sig2 = createRequestSignature({ url: '/users', data: { name: 'Jane' } });
      expect(sig1).not.toBe(sig2);
    });
  });
});
