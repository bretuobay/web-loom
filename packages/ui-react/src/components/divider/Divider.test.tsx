import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders horizontal divider by default', () => {
    const { container } = render(<Divider />);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveClass('loom-divider-horizontal');
    expect(divider).toHaveAttribute('role', 'separator');
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders vertical divider', () => {
    const { container } = render(<Divider type="vertical" />);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-vertical');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('renders horizontal divider with text', () => {
    render(<Divider>Divider Text</Divider>);

    const text = screen.getByText(/divider text/i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('loom-divider-inner-text');
  });

  it('renders horizontal divider with text centered (default)', () => {
    const { container } = render(<Divider>Center Text</Divider>);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-with-text-center');
  });

  it('renders horizontal divider with text aligned left', () => {
    const { container } = render(<Divider orientation="left">Left Text</Divider>);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-with-text-left');
  });

  it('renders horizontal divider with text aligned right', () => {
    const { container } = render(<Divider orientation="right">Right Text</Divider>);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-with-text-right');
  });

  it('applies dashed style to horizontal divider', () => {
    const { container } = render(<Divider dashed />);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-dashed');
  });

  it('applies dashed style to vertical divider', () => {
    const { container } = render(<Divider type="vertical" dashed />);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-dashed');
    expect(divider).toHaveClass('loom-divider-vertical');
  });

  it('applies plain style to text divider', () => {
    const { container } = render(<Divider plain>Plain Text</Divider>);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-plain');
  });

  it('renders ReactNode children', () => {
    render(
      <Divider>
        <span data-testid="custom-content">Custom Content</span>
      </Divider>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('vertical divider ignores text content', () => {
    const { container } = render(<Divider type="vertical">Text should not appear</Divider>);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-vertical');
    expect(screen.queryByText(/text should not appear/i)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Divider className="custom-divider" />);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('custom-divider');
  });

  it('supports custom HTML attributes', () => {
    const { container } = render(<Divider data-testid="test-divider" id="my-divider" />);

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveAttribute('data-testid', 'test-divider');
    expect(divider).toHaveAttribute('id', 'my-divider');
  });

  it('combines dashed and text styles', () => {
    const { container } = render(
      <Divider dashed orientation="left">
        Dashed Text
      </Divider>
    );

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-dashed');
    expect(divider).toHaveClass('loom-divider-with-text-left');
  });

  it('combines plain and dashed styles', () => {
    const { container } = render(
      <Divider plain dashed>
        Plain Dashed
      </Divider>
    );

    const divider = container.querySelector('.loom-divider');
    expect(divider).toHaveClass('loom-divider-plain');
    expect(divider).toHaveClass('loom-divider-dashed');
  });
});
