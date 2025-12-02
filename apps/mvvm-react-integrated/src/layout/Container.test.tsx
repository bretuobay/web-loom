import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Container from './Container';

describe('Container', () => {
  it('should render children', () => {
    render(
      <Container>
        <div data-testid="child">Test Content</div>
      </Container>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <Container>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
        <div data-testid="child-3">Third</div>
      </Container>,
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should render as main element with container-fluid class', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>,
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('container-fluid');
  });

  it('should have custom padding style', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>,
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveStyle({ padding: 'var(--spacing-5)' });
  });

  it('should handle empty children gracefully', () => {
    const { container } = render(<Container>{null}</Container>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render text content', () => {
    render(<Container>Plain text content</Container>);
    expect(screen.getByText('Plain text content')).toBeInTheDocument();
  });
});
