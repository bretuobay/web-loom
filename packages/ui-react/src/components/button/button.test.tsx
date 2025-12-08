/**
 * Button Component Tests
 *
 * Comprehensive test suite for Button component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render as a button element by default', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Click me</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('should spread additional HTML attributes', () => {
      render(
        <Button data-testid="test-button" aria-label="Test Button">
          Click me
        </Button>
      );
      const button = screen.getByTestId('test-button');
      expect(button).toHaveAttribute('aria-label', 'Test Button');
    });
  });

  describe('Variants', () => {
    it('should render primary variant', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-primary');
    });

    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-default');
    });

    it('should render dashed variant', () => {
      render(<Button variant="dashed">Dashed</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-dashed');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-link');
    });

    it('should render text variant', () => {
      render(<Button variant="text">Text</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-text');
    });

    it('should default to "default" variant', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-default');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Button size="small">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-small');
    });

    it('should render middle size', () => {
      render(<Button size="middle">Middle</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-middle');
    });

    it('should render large size', () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-large');
    });

    it('should default to "middle" size', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-middle');
    });
  });

  describe('Shapes', () => {
    it('should render default shape', () => {
      render(<Button shape="default">Default Shape</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('shape-default');
    });

    it('should render circle shape', () => {
      render(<Button shape="circle" icon={<span>Icon</span>} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('shape-circle');
    });

    it('should render round shape', () => {
      render(<Button shape="round">Round</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('shape-round');
    });

    it('should default to "default" shape', () => {
      render(<Button>Default Shape</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('shape-default');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading=true', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('should hide icon when loading', () => {
      render(
        <Button loading icon={<span data-testid="icon">Icon</span>}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should prevent onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should apply loading class', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('loading');
    });

    it('should set aria-busy=true when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled=true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled class', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled');
    });

    it('should set aria-disabled=true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should prevent onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Danger Variant', () => {
    it('should apply danger class when danger=true', () => {
      render(<Button danger>Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('danger');
    });

    it('should not apply danger class to link variant', () => {
      render(
        <Button variant="link" danger>
          Danger Link
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('danger');
    });

    it('should not apply danger class to text variant', () => {
      render(
        <Button variant="text" danger>
          Danger Text
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('danger');
    });

    it('should apply danger with primary variant', () => {
      render(
        <Button variant="primary" danger>
          Delete
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('danger');
      expect(button.className).toContain('variant-primary');
    });
  });

  describe('Icon Support', () => {
    it('should render icon before text', () => {
      const { container } = render(
        <Button icon={<span data-testid="icon">Icon</span>}>Text</Button>
      );
      const iconSpan = container.querySelector('[class*="icon"]');
      expect(iconSpan).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render icon-only button without text', () => {
      render(<Button icon={<span data-testid="icon">Icon</span>} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('iconOnly');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should not apply iconOnly class when text is present', () => {
      render(
        <Button icon={<span data-testid="icon">Icon</span>}>Text</Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('iconOnly');
    });

    it('should add aria-hidden to icon', () => {
      const { container } = render(
        <Button icon={<span data-testid="icon">Icon</span>}>Text</Button>
      );
      const iconWrapper = container.querySelector('[class*="icon"]');
      expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Block Mode', () => {
    it('should apply block class when block=true', () => {
      render(<Button block>Block Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('block');
    });

    it('should not apply block class by default', () => {
      render(<Button>Normal Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('block');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should pass event to onClick handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Button Type', () => {
    it('should default to type="button"', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should accept custom type', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('ForwardRef', () => {
    it('should forward ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should allow ref methods to be called', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current?.focus).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have proper aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should have loading spinner with role="status"', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have loading spinner with aria-label', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });
  });

  describe('TypeScript Props', () => {
    it('should accept all ButtonHTMLAttributes', () => {
      render(
        <Button
          title="Button Title"
          data-testid="test"
          aria-describedby="description"
        >
          Button
        </Button>
      );
      const button = screen.getByTestId('test');
      expect(button).toHaveAttribute('title', 'Button Title');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });
  });

  describe('Combined Props', () => {
    it('should render with multiple props', () => {
      const handleClick = vi.fn();
      render(
        <Button
          variant="primary"
          size="large"
          shape="round"
          icon={<span data-testid="icon">Icon</span>}
          onClick={handleClick}
          className="custom-class"
        >
          Combined
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-primary');
      expect(button.className).toContain('size-large');
      expect(button.className).toContain('shape-round');
      expect(button.className).toContain('custom-class');
      expect(screen.getByTestId('icon')).toBeInTheDocument();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('should render danger primary button', () => {
      render(
        <Button variant="primary" danger>
          Delete
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('variant-primary');
      expect(button.className).toContain('danger');
    });

    it('should render small circle icon button', () => {
      render(
        <Button size="small" shape="circle" icon={<span>Icon</span>} />
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-small');
      expect(button.className).toContain('shape-circle');
      expect(button.className).toContain('iconOnly');
    });
  });
});
