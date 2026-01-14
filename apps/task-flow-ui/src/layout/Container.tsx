import { type ReactNode } from 'react';

export interface ContainerProps {
  children: ReactNode;
}

export function Container({ children }: ContainerProps) {
  return <div className="layout-container">{children}</div>;
}
