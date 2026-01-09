/**
 * Tag Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tag, CheckableTag } from './Tag';

describe('Tag', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Tag>Test Tag</Tag>);

      const tag = screen.getByText('Test Tag');
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveClass('tag');
    });

    it('renders with custom className', () => {
      render(<Tag className="custom-class">Test Tag</Tag>);

      const tag = screen.getByText('Test Tag');
      expect(tag).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Tag ref={ref}>Test Tag</Tag>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLSpanElement));
    });
  });

  describe('Color Variants', () => {
    it.each(['success', 'processing', 'error', 'warning', 'default'])('renders %s color variant', (color) => {
      render(<Tag color={color}>Test Tag</Tag>);

      const tag = screen.getByText('Test Tag');
      expect(tag).toHaveClass(color);
    });

    it('handles custom colors', () => {
      render(<Tag color="#ff0000">Custom Color Tag</Tag>);

      const tag = screen.getByText('Custom Color Tag');
      expect(tag).toHaveClass('customColor');
      expect(tag).toHaveStyle('--tag-color: #ff0000');
    });
  });

  describe('Closable Functionality', () => {
    it('renders close button when closable', () => {
      render(
        <Tag closable onClose={vi.fn()}>
          Closable Tag
        </Tag>,
      );

      const closeButton = screen.getByRole('button', { name: /close tag/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <Tag closable onClose={onClose}>
          Closable Tag
        </Tag>,
      );

      const closeButton = screen.getByRole('button', { name: /close tag/i });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledWith(expect.any(Object));
    });

    it('hides tag after closing when no external visibility control', async () => {
      render(<Tag closable>Closable Tag</Tag>);

      const tag = screen.getByText('Closable Tag');
      const closeButton = screen.getByRole('button', { name: /close tag/i });

      await userEvent.click(closeButton);

      expect(tag).not.toBeInTheDocument();
    });

    it('renders custom close icon', () => {
      const customIcon = <span data-testid="custom-close">X</span>;
      render(
        <Tag closable closeIcon={customIcon}>
          Tag with Custom Close
        </Tag>,
      );

      expect(screen.getByTestId('custom-close')).toBeInTheDocument();
    });
  });

  describe('Icon Support', () => {
    it('renders icon when provided', () => {
      const icon = <span data-testid="tag-icon">★</span>;
      render(<Tag icon={icon}>Tag with Icon</Tag>);

      expect(screen.getByTestId('tag-icon')).toBeInTheDocument();
    });

    it('positions icon before content', () => {
      const icon = <span data-testid="tag-icon">★</span>;
      render(<Tag icon={icon}>Content</Tag>);

      const tag = screen.getByText('Content').parentElement;
      const iconElement = screen.getByTestId('tag-icon');
      const contentElement = screen.getByText('Content');

      expect(tag?.firstChild).toBe(iconElement.parentElement);
      expect(tag?.lastChild?.previousSibling).toBe(contentElement.parentElement);
    });
  });

  describe('Bordered Prop', () => {
    it('applies bordered class by default', () => {
      render(<Tag>Bordered Tag</Tag>);

      const tag = screen.getByText('Bordered Tag');
      expect(tag).toHaveClass('bordered');
    });

    it('removes bordered class when bordered=false', () => {
      render(<Tag bordered={false}>Borderless Tag</Tag>);

      const tag = screen.getByText('Borderless Tag');
      expect(tag).not.toHaveClass('bordered');
    });
  });

  describe('Visibility Control', () => {
    it('does not render when visible=false', () => {
      render(<Tag visible={false}>Hidden Tag</Tag>);

      expect(screen.queryByText('Hidden Tag')).not.toBeInTheDocument();
    });

    it('renders when visible=true', () => {
      render(<Tag visible={true}>Visible Tag</Tag>);

      expect(screen.getByText('Visible Tag')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for close button', () => {
      render(<Tag closable>Accessible Tag</Tag>);

      const closeButton = screen.getByRole('button', { name: /close tag/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close tag');
    });

    it('prevents event propagation on close', async () => {
      const onTagClick = vi.fn();
      const onClose = vi.fn();

      render(
        <Tag closable onClose={onClose} onClick={onTagClick}>
          Closable Tag
        </Tag>,
      );

      const closeButton = screen.getByRole('button', { name: /close tag/i });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onTagClick).not.toHaveBeenCalled();
    });
  });
});

describe('CheckableTag', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<CheckableTag>Checkable Tag</CheckableTag>);

      const tag = screen.getByText('Checkable Tag');
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveClass('tag', 'checkable');
    });

    it('has proper ARIA attributes', () => {
      render(<CheckableTag checked={false}>Checkable Tag</CheckableTag>);

      const tag = screen.getByText('Checkable Tag');
      expect(tag).toHaveAttribute('role', 'checkbox');
      expect(tag).toHaveAttribute('aria-checked', 'false');
      expect(tag).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Checked State', () => {
    it('applies checked class when checked=true', () => {
      render(<CheckableTag checked={true}>Checked Tag</CheckableTag>);

      const tag = screen.getByText('Checked Tag');
      expect(tag).toHaveClass('checked');
      expect(tag).toHaveAttribute('aria-checked', 'true');
    });

    it('does not apply checked class when checked=false', () => {
      render(<CheckableTag checked={false}>Unchecked Tag</CheckableTag>);

      const tag = screen.getByText('Unchecked Tag');
      expect(tag).not.toHaveClass('checked');
      expect(tag).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Interaction', () => {
    it('calls onChange when clicked', async () => {
      const onChange = vi.fn();
      render(
        <CheckableTag checked={false} onChange={onChange}>
          Clickable Tag
        </CheckableTag>,
      );

      const tag = screen.getByText('Clickable Tag');
      await userEvent.click(tag);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('toggles state correctly', async () => {
      const onChange = vi.fn();
      render(
        <CheckableTag checked={true} onChange={onChange}>
          Toggle Tag
        </CheckableTag>,
      );

      const tag = screen.getByText('Toggle Tag');
      await userEvent.click(tag);

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('responds to Enter key', async () => {
      const onChange = vi.fn();
      render(
        <CheckableTag checked={false} onChange={onChange}>
          Keyboard Tag
        </CheckableTag>,
      );

      const tag = screen.getByText('Keyboard Tag');
      tag.focus();

      fireEvent.keyDown(tag, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('responds to Space key', async () => {
      const onChange = vi.fn();
      render(
        <CheckableTag checked={false} onChange={onChange}>
          Keyboard Tag
        </CheckableTag>,
      );

      const tag = screen.getByText('Keyboard Tag');
      tag.focus();

      fireEvent.keyDown(tag, { key: ' ' });

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('prevents default behavior on Space key', async () => {
      const onChange = vi.fn();
      render(
        <CheckableTag checked={false} onChange={onChange}>
          Space Tag
        </CheckableTag>,
      );

      const tag = screen.getByText('Space Tag');
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      tag.focus();
      fireEvent(tag, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('is focusable', () => {
      render(<CheckableTag>Focusable Tag</CheckableTag>);

      const tag = screen.getByText('Focusable Tag');
      tag.focus();

      expect(document.activeElement).toBe(tag);
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<CheckableTag ref={ref}>Ref Tag</CheckableTag>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLSpanElement));
    });
  });
});

describe('Tag Compound Component', () => {
  it('exports CheckableTag as a property', () => {
    expect(Tag.CheckableTag).toBe(CheckableTag);
  });

  it('can be used as compound component', () => {
    render(
      <div>
        <Tag>Regular Tag</Tag>
        <Tag.CheckableTag checked={false} onChange={vi.fn()}>
          Checkable Tag
        </Tag.CheckableTag>
      </div>,
    );

    expect(screen.getByText('Regular Tag')).toBeInTheDocument();
    expect(screen.getByText('Checkable Tag')).toBeInTheDocument();
  });
});
