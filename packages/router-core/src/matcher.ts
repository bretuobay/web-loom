import { buildURL, normalizePath, parseQuery } from './query';
import { mergeMeta, toPathSegments } from './utils';
import type { RouteDefinition, RouteMatch } from './types';

const PARAM_REGEX = /^:([A-Za-z0-9_]+)(?:\((.+)\))?$/;
const STAR_PARAM = 'wildcard';

interface SegmentPatternBase {
  raw: string;
}

interface StaticSegment extends SegmentPatternBase {
  type: 'static';
  value: string;
}

interface ParamSegment extends SegmentPatternBase {
  type: 'param';
  name: string;
  matcher: RegExp;
}

interface WildcardSegment extends SegmentPatternBase {
  type: 'wildcard';
  name: string;
}

type SegmentPattern = StaticSegment | ParamSegment | WildcardSegment;

interface CompiledRoute {
  path: string;
  stack: RouteDefinition[];
  segments: SegmentPattern[];
  strategy: RouteDefinition['matchStrategy'];
}

export interface MatchContext {
  stack: RouteDefinition[];
  params: Record<string, string>;
}

export class RouteNotFoundError extends Error {
  constructor(path: string) {
    super(`No route matched path "${path}"`);
    this.name = 'RouteNotFoundError';
  }
}

export function createRouteMatcher(routes: RouteDefinition[]) {
  const compiled = compileRoutes(routes);
  return (path: string): MatchContext => {
    const normalizedPath = normalizePath(path);
    const targetSegments = toPathSegments(normalizedPath);
    for (const route of compiled) {
      const params = matchCompiledRoute(route, targetSegments);
      if (params) {
        return { stack: route.stack, params };
      }
    }
    throw new RouteNotFoundError(path);
  };
}

export function matchRoute(routes: RouteDefinition[], path: string): RouteMatch {
  const [purePath, rawQuery = ''] = splitPathAndQuery(path);
  const normalizedPath = normalizePath(purePath);
  const matcher = createRouteMatcher(routes);
  const { stack, params } = matcher(normalizedPath);
  const query = parseQuery(rawQuery);
  const fullPath = buildURL(normalizedPath, query, true);
  return {
    path: normalizedPath,
    fullPath,
    params,
    query,
    meta: mergeMeta(stack),
    name: stack[stack.length - 1]?.name,
    matched: stack,
  };
}

function splitPathAndQuery(path: string): [string, string] {
  const queryIndex = path.indexOf('?');
  if (queryIndex === -1) {
    return [path, ''];
  }
  return [path.slice(0, queryIndex), path.slice(queryIndex + 1)];
}

function matchCompiledRoute(compiled: CompiledRoute, pathSegments: string[]): Record<string, string> | null {
  const params: Record<string, string> = {};
  let pathIndex = 0;

  for (const segment of compiled.segments) {
    if (segment.type === 'wildcard') {
      params[segment.name] = pathSegments.slice(pathIndex).join('/');
      return params;
    }

    const currentSegment = pathSegments[pathIndex];
    if (currentSegment === undefined) {
      return null;
    }

    if (segment.type === 'static') {
      if (currentSegment !== segment.value) {
        return null;
      }
      pathIndex += 1;
      continue;
    }

    if (!segment.matcher.test(currentSegment)) {
      return null;
    }
    params[segment.name] = currentSegment;
    pathIndex += 1;
  }

  if (compiled.strategy === 'prefix') {
    return params;
  }

  if (pathIndex !== pathSegments.length) {
    return null;
  }

  return params;
}

function compileRoutes(routes: RouteDefinition[]): CompiledRoute[] {
  const compiled: CompiledRoute[] = [];

  const walk = (currentRoutes: RouteDefinition[], parentPath: string, parentStack: RouteDefinition[]) => {
    currentRoutes.forEach((route) => {
      const fullPath = resolveRoutePath(parentPath, route.path);
      const stack = [...parentStack, route];
      compiled.push({
        path: fullPath,
        stack,
        segments: toSegments(fullPath),
        strategy: route.matchStrategy ?? 'exact',
      });

      if (route.children && route.children.length) {
        walk(route.children, fullPath, stack);
      }
    });
  };

  walk(routes, '/', []);

  compiled.sort((a, b) => {
    if (b.segments.length !== a.segments.length) {
      return b.segments.length - a.segments.length;
    }
    return b.stack.length - a.stack.length;
  });

  return compiled;
}

function resolveRoutePath(parentPath: string, currentPath: string): string {
  if (!parentPath) {
    parentPath = '/';
  }
  if (!currentPath || currentPath === '.') {
    return normalizePath(parentPath);
  }
  if (currentPath === '/' && parentPath !== '/') {
    return normalizePath(parentPath);
  }
  if (currentPath.startsWith('/')) {
    return normalizePath(currentPath);
  }
  if (parentPath === '/' || !parentPath) {
    return normalizePath(`/${currentPath}`);
  }
  return normalizePath(`${parentPath}/${currentPath}`);
}

function toSegments(path: string): SegmentPattern[] {
  const segments = toPathSegments(path);
  if (!segments.length) {
    return [];
  }

  return segments.map<SegmentPattern>((segment) => {
    if (segment === '*') {
      return { type: 'wildcard', name: STAR_PARAM, raw: segment };
    }

    const paramMatch = segment.match(PARAM_REGEX);
    if (paramMatch) {
      const [, name, matcherSource] = paramMatch;
      const matcher = matcherSource ? new RegExp(`^${matcherSource}$`) : /^[^/]+$/;
      return { type: 'param', name, matcher, raw: segment };
    }

    return { type: 'static', value: segment, raw: segment };
  });
}
