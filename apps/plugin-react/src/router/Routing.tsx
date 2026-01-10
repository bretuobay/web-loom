import type { LinkProps, RouteProps, RoutesProps } from 'react-router-dom';
import {
  BrowserRouter as RouterBrowser,
  Link as RouterLink,
  Route as RouterRoute,
  Routes as RouterRoutes,
  useLocation as routerUseLocation,
} from 'react-router-dom';
import React from 'react';

export const BrowserRouter = RouterBrowser;

export const Link: React.ComponentType<LinkProps> = RouterLink as React.ComponentType<LinkProps>;

export const Routes: React.ComponentType<RoutesProps> = RouterRoutes as React.ComponentType<RoutesProps>;

export const Route: React.ComponentType<RouteProps> = RouterRoute as React.ComponentType<RouteProps>;

export const useLocation = routerUseLocation;
