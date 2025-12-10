/**
 * Space Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Space } from './Space';

describe('Space', () => {
  it('should render children with horizontal spacing', () => {
    render(
      <Space>
        <div>Item 1</div>
        <div>Item 2</div>
      </Space>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should apply vertical direction', () => {
    const { container } = render(
      <Space direction="vertical">
        <div>Item 1</div>
        <div>Item 2</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.className).toContain('direction-vertical');
  });

  it('should apply horizontal direction by default', () => {
    const { container } = render(
      <Space>
        <div>Item 1</div>
        <div>Item 2</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.className).toContain('direction-horizontal');
  });

  it('should accept preset size values', () => {
    const { container } = render(
      <Space size="large">
        <div>Item</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.style.gap).toBe('24px');
  });

  it('should accept custom numeric size', () => {
    const { container } = render(
      <Space size={32}>
        <div>Item</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.style.gap).toBe('32px');
  });

  it('should default to middle size', () => {
    const { container } = render(
      <Space>
        <div>Item</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.style.gap).toBe('16px');
  });

  it('should apply alignment', () => {
    const { container } = render(
      <Space align="center">
        <div>Item</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.className).toContain('align-center');
  });

  it('should apply wrap class when wrap is true', () => {
    const { container } = render(
      <Space wrap>
        <div>Item</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.className).toContain('wrap');
  });

  it('should not apply wrap class by default', () => {
    const { container } = render(
      <Space>
        <div>Item</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.className).not.toContain('wrap');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Space className="custom-space">
        <div>Item</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.className).toContain('custom-space');
  });

  it('should apply custom style', () => {
    const { container } = render(
      <Space style={{ backgroundColor: 'red' }}>
        <div>Item</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.style.backgroundColor).toBe('red');
  });

  it('should filter out null/undefined children', () => {
    const { container } = render(
      <Space>
        <div>Item 1</div>
        {null}
        {undefined}
        <div>Item 2</div>
      </Space>
    );
    const space = container.firstChild as HTMLElement;
    expect(space.children.length).toBe(2);
  });

  it('should return null when no valid children', () => {
    const { container } = render(<Space>{null}</Space>);
    expect(container.firstChild).toBeNull();
  });

  it('should handle empty children', () => {
    const { container } = render(<Space />);
    expect(container.firstChild).toBeNull();
  });
});
